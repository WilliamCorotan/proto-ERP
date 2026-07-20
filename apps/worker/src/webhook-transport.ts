import { createHmac } from "node:crypto";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const DEFAULT_MAX_REQUEST_BYTES = 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_ERROR_LENGTH = 256;

export type ResolvedAddress = {
  address: string;
  family: 4 | 6;
};

export type WebhookDnsResolver = (
  hostname: string,
) => Promise<readonly ResolvedAddress[]>;

export type WebhookFetch = (
  url: string,
  init: RequestInit,
) => Promise<{ status: number }>;

export type WebhookTransportRequest = {
  url: string;
  secret: string;
  eventId: string;
  deliveryId: string;
  eventType: string;
  rawBody: Uint8Array;
};

export type WebhookTransportResult = {
  classification: "delivered" | "permanent" | "retryable";
  status?: number;
  error?: string;
};

export type WebhookTransportOptions = {
  fetch?: WebhookFetch;
  resolver?: WebhookDnsResolver;
  now?: () => Date;
  production?: boolean;
  timeoutMs?: number;
  maxRequestBytes?: number;
};

export class SecureWebhookTransport {
  private readonly fetch: WebhookFetch;
  private readonly resolver: WebhookDnsResolver;
  private readonly now: () => Date;
  private readonly production: boolean;
  private readonly timeoutMs: number;
  private readonly maxRequestBytes: number;

  constructor(options: WebhookTransportOptions = {}) {
    this.fetch = options.fetch ?? globalThis.fetch;
    this.resolver = options.resolver ?? resolveAddresses;
    this.now = options.now ?? (() => new Date());
    this.production =
      options.production ?? process.env.NODE_ENV === "production";
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxRequestBytes = options.maxRequestBytes ?? DEFAULT_MAX_REQUEST_BYTES;

    if (this.timeoutMs < 1_000 || this.timeoutMs > 30_000) {
      throw new Error("Webhook timeout must be between 1000 and 30000 ms.");
    }
    if (
      !Number.isSafeInteger(this.maxRequestBytes) ||
      this.maxRequestBytes < 1
    ) {
      throw new Error(
        "Webhook maximum request size must be a positive integer.",
      );
    }
  }

  async send(
    request: WebhookTransportRequest,
  ): Promise<WebhookTransportResult> {
    if (request.rawBody.byteLength > this.maxRequestBytes) {
      return permanent("Webhook request body exceeds the configured limit.");
    }
    if (!request.secret) {
      return permanent("Webhook signing secret is required.");
    }

    let target: URL;
    try {
      target = await this.validateTarget(request.url);
    } catch (error) {
      return permanent(sanitizePolicyError(error));
    }

    const timestamp = String(Math.floor(this.now().getTime() / 1_000));
    const signature = signWebhookPayload(
      request.secret,
      timestamp,
      request.rawBody,
    );
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), this.timeoutMs);
    const requestBody = copyToArrayBuffer(request.rawBody);

    try {
      const response = await this.fetch(target.toString(), {
        method: "POST",
        redirect: "manual",
        signal: abortController.signal,
        headers: {
          "content-type": "application/json",
          "user-agent": "open-erp-webhook/1.0",
          "x-erp-delivery-id": request.deliveryId,
          "x-erp-event": request.eventType,
          "x-erp-event-id": request.eventId,
          "x-erp-signature": `v1=${signature}`,
          "x-erp-timestamp": timestamp,
        },
        body: requestBody,
      });
      return classifyWebhookStatus(response.status);
    } catch {
      if (abortController.signal.aborted) {
        return retryable("Webhook request timed out.");
      }
      return retryable("Webhook network request failed.");
    } finally {
      clearTimeout(timeout);
    }
  }

  private async validateTarget(value: string): Promise<URL> {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new WebhookPolicyError("Webhook destination URL is invalid.");
    }

    if (this.production && url.protocol !== "https:") {
      throw new WebhookPolicyError(
        "Webhook destinations must use HTTPS in production.",
      );
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new WebhookPolicyError(
        "Webhook destination protocol is not allowed.",
      );
    }
    if (url.username || url.password) {
      throw new WebhookPolicyError(
        "Webhook destination userinfo is not allowed.",
      );
    }
    if (url.hash) {
      throw new WebhookPolicyError(
        "Webhook destination fragments are not allowed.",
      );
    }
    if (url.port && url.port !== "443") {
      throw new WebhookPolicyError("Webhook destination port is not allowed.");
    }

    const hostname = stripIpv6Brackets(url.hostname).toLowerCase();
    if (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal") ||
      hostname.endsWith(".home.arpa")
    ) {
      throw new WebhookPolicyError("Webhook destination host is not allowed.");
    }

    const literalFamily = isIP(hostname);
    const addresses = literalFamily
      ? [{ address: hostname, family: literalFamily as 4 | 6 }]
      : await this.resolveSafely(hostname);
    if (addresses.length === 0) {
      throw new WebhookPolicyError("Webhook destination did not resolve.");
    }
    if (addresses.some(({ address }) => !isPublicIpAddress(address))) {
      throw new WebhookPolicyError(
        "Webhook destination resolves to a non-public address.",
      );
    }

    // DNS validation and fetch do not share a pinned socket. Production must
    // also enforce an outbound proxy/firewall denylist to contain DNS rebinding.
    return url;
  }

  private async resolveSafely(
    hostname: string,
  ): Promise<readonly ResolvedAddress[]> {
    try {
      return await this.resolver(hostname);
    } catch {
      throw new WebhookPolicyError("Webhook destination DNS lookup failed.");
    }
  }
}

export function signWebhookPayload(
  secret: string,
  timestamp: string,
  rawBody: Uint8Array,
): string {
  return createHmac("sha256", secret)
    .update(timestamp, "utf8")
    .update(".", "utf8")
    .update(rawBody)
    .digest("hex");
}

export function classifyWebhookStatus(status: number): WebhookTransportResult {
  if (status >= 200 && status < 300) {
    return { classification: "delivered", status };
  }
  if (status === 408 || status === 425 || status === 429 || status >= 500) {
    return { classification: "retryable", status };
  }
  return { classification: "permanent", status };
}

export function isPublicIpAddress(address: string): boolean {
  const normalized = stripIpv6Brackets(address.split("%")[0] ?? address);
  const family = isIP(normalized);
  if (family === 4) return isPublicIpv4(normalized);
  if (family !== 6) return false;
  const dottedMappedIpv4 = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(
    normalized,
  )?.[1];
  if (dottedMappedIpv4) return isPublicIpv4(dottedMappedIpv4);

  const groups = parseIpv6(normalized);
  if (!groups) return false;
  const sixth = groups[5] ?? -1;
  const seventh = groups[6] ?? -1;
  const eighth = groups[7] ?? -1;
  if (groups.slice(0, 5).every((group) => group === 0) && sixth === 0xffff) {
    const mapped = `${seventh >> 8}.${seventh & 0xff}.${eighth >> 8}.${eighth & 0xff}`;
    return isPublicIpv4(mapped);
  }

  const first = groups[0] ?? -1;
  const second = groups[1] ?? -1;
  if ((first & 0xe000) !== 0x2000) return false;
  if (first === 0x2001 && second <= 0x01ff) return false;
  if (first === 0x2001 && second === 0x0db8) return false;
  if (first === 0x2002) return false;
  if (first === 0x3ffe) return false;
  if (first === 0x3fff && (second & 0xf000) === 0) return false;
  return true;
}

async function resolveAddresses(hostname: string): Promise<ResolvedAddress[]> {
  const addresses = await lookup(hostname, { all: true, verbatim: true });
  return addresses.map(({ address, family }) => ({
    address,
    family: family === 6 ? 6 : 4,
  }));
}

function isPublicIpv4(address: string): boolean {
  const octets = address.split(".").map(Number);
  if (
    octets.length !== 4 ||
    octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)
  ) {
    return false;
  }
  const value =
    ((octets[0] ?? 0) * 2 ** 24 +
      (octets[1] ?? 0) * 2 ** 16 +
      (octets[2] ?? 0) * 2 ** 8 +
      (octets[3] ?? 0)) >>>
    0;
  return ![
    ["0.0.0.0", 8],
    ["10.0.0.0", 8],
    ["100.64.0.0", 10],
    ["127.0.0.0", 8],
    ["169.254.0.0", 16],
    ["172.16.0.0", 12],
    ["192.0.0.0", 24],
    ["192.0.2.0", 24],
    ["192.31.196.0", 24],
    ["192.52.193.0", 24],
    ["192.88.99.0", 24],
    ["192.168.0.0", 16],
    ["192.175.48.0", 24],
    ["198.18.0.0", 15],
    ["198.51.100.0", 24],
    ["203.0.113.0", 24],
    ["224.0.0.0", 4],
    ["240.0.0.0", 4],
  ].some(([network, prefix]) =>
    ipv4InCidr(value, ipv4ToNumber(network as string), prefix as number),
  );
}

function ipv4ToNumber(address: string): number {
  return address
    .split(".")
    .map(Number)
    .reduce((value, octet) => ((value << 8) | octet) >>> 0, 0);
}

function ipv4InCidr(value: number, network: number, prefix: number): boolean {
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (value & mask) === (network & mask);
}

function parseIpv6(address: string): number[] | null {
  if (address.split("::").length > 2) return null;
  const [head = "", tail = ""] = address.split("::");
  const headGroups = head ? head.split(":") : [];
  const tailGroups = tail ? tail.split(":") : [];
  const missing = 8 - headGroups.length - tailGroups.length;
  if (missing < 0 || (!address.includes("::") && missing !== 0)) return null;
  const groups = [
    ...headGroups,
    ...Array.from({ length: missing }, () => "0"),
    ...tailGroups,
  ];
  if (
    groups.length !== 8 ||
    groups.some((group) => !/^[0-9a-f]{1,4}$/i.test(group))
  ) {
    return null;
  }
  return groups.map((group) => Number.parseInt(group, 16));
}

function stripIpv6Brackets(value: string): string {
  return value.startsWith("[") && value.endsWith("]")
    ? value.slice(1, -1)
    : value;
}

function copyToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const body = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(body).set(bytes);
  return body;
}

function sanitizePolicyError(error: unknown): string {
  const message =
    error instanceof WebhookPolicyError
      ? error.message
      : "Webhook destination was rejected by policy.";
  return message.slice(0, MAX_ERROR_LENGTH);
}

function permanent(error: string): WebhookTransportResult {
  return {
    classification: "permanent",
    error: error.slice(0, MAX_ERROR_LENGTH),
  };
}

function retryable(error: string): WebhookTransportResult {
  return {
    classification: "retryable",
    error: error.slice(0, MAX_ERROR_LENGTH),
  };
}

class WebhookPolicyError extends Error {}
