import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SecureWebhookTransport,
  classifyWebhookStatus,
  isPublicIpAddress,
  parseRetryAfter,
  signWebhookPayload,
  type WebhookDnsResolver,
  type WebhookFetch,
  type WebhookTransportRequest,
} from "./webhook-transport.js";

const rawBody = new TextEncoder().encode('{"order":"SO-1","total":125}');
const request: WebhookTransportRequest = {
  url: "https://hooks.example.test/events",
  secret: "test-secret",
  eventId: "evt_001",
  deliveryId: "del_001",
  eventType: "sales.order.approved",
  rawBody,
};
const publicResolver: WebhookDnsResolver = vi
  .fn()
  .mockResolvedValue([{ address: "8.8.8.8", family: 4 }]);

afterEach(() => {
  vi.useRealTimers();
});

describe("webhook signing and request contract", () => {
  const signatureInput = {
    timestamp: "1700000000",
    deliveryId: request.deliveryId,
    eventId: request.eventId,
    eventType: request.eventType,
    rawBody,
  };

  it("signs versioned delivery metadata and raw-body bytes with a known HMAC vector", () => {
    expect(signWebhookPayload("test-secret", signatureInput)).toBe(
      "bddec66da43e7c79a2d6192b0db2738e6b02a1db27914d07b8df25215fdc5390",
    );
  });

  it.each([
    ["delivery id", { deliveryId: "del_tampered" }],
    ["event id", { eventId: "evt_tampered" }],
    ["event type", { eventType: "sales.order.cancelled" }],
    ["timestamp", { timestamp: "1700000001" }],
  ])("rejects a signature when the %s is changed", (_label, change) => {
    const signature = signWebhookPayload("test-secret", signatureInput);
    expect(
      signWebhookPayload("test-secret", { ...signatureInput, ...change }),
    ).not.toBe(signature);
  });

  it("sends stable headers and raw bytes without following redirects", async () => {
    const fetch = vi.fn<WebhookFetch>().mockResolvedValue({ status: 204 });
    const transport = new SecureWebhookTransport({
      fetch,
      resolver: publicResolver,
      production: true,
      now: () => new Date("2023-11-14T22:13:20.000Z"),
    });

    await expect(transport.send(request)).resolves.toEqual({
      classification: "delivered",
      status: 204,
    });
    const [, init] = fetch.mock.calls[0] ?? [];
    expect(init?.redirect).toBe("manual");
    expect(new Uint8Array(init?.body as ArrayBuffer)).toEqual(rawBody);
    expect(init?.headers).toEqual({
      "content-type": "application/json",
      "user-agent": "open-erp-webhook/1.0",
      "x-erp-delivery-id": "del_001",
      "x-erp-event": "sales.order.approved",
      "x-erp-event-id": "evt_001",
      "x-erp-signature":
        "v1=bddec66da43e7c79a2d6192b0db2738e6b02a1db27914d07b8df25215fdc5390",
      "x-erp-signature-version": "v1",
      "x-erp-timestamp": "1700000000",
    });
    expect(fetch.mock.calls[0]?.[2]).toEqual([
      { address: "8.8.8.8", family: 4 },
    ]);
  });
});

describe("webhook destination policy", () => {
  it.each([
    "http://hooks.example.test/events",
    "https://user:password@hooks.example.test/events",
    "https://hooks.example.test/events#fragment",
    "https://hooks.example.test:8443/events",
    "https://localhost/events",
    "https://service.internal/events",
    "https://127.0.0.1/events",
    "https://169.254.169.254/latest/meta-data",
    "https://[::1]/events",
    "https://[::ffff:127.0.0.1]/events",
  ])("permanently rejects unsafe target %s", async (url) => {
    const fetch = vi.fn<WebhookFetch>();
    const transport = new SecureWebhookTransport({
      fetch,
      resolver: publicResolver,
      production: true,
    });

    const result = await transport.send({ ...request, url });

    expect(result.classification).toBe("permanent");
    expect(result.error?.length).toBeLessThanOrEqual(256);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects a hostname when any resolved address is non-public", async () => {
    const fetch = vi.fn<WebhookFetch>();
    const resolver: WebhookDnsResolver = vi.fn().mockResolvedValue([
      { address: "8.8.8.8", family: 4 },
      { address: "10.0.0.2", family: 4 },
    ]);
    const transport = new SecureWebhookTransport({
      fetch,
      resolver,
      production: true,
    });

    const result = await transport.send(request);

    expect(result).toEqual({
      classification: "permanent",
      error: "Webhook destination resolves to a non-public address.",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("classifies transient DNS failure as retryable", async () => {
    const transport = new SecureWebhookTransport({
      fetch: vi.fn<WebhookFetch>(),
      resolver: vi.fn().mockRejectedValue(new Error("EAI_AGAIN")),
      production: true,
    });
    await expect(transport.send(request)).resolves.toEqual({
      classification: "retryable",
      error: "Webhook destination DNS lookup failed.",
    });
  });

  it("bounds DNS resolution independently from the HTTP deadline", async () => {
    vi.useFakeTimers();
    const transport = new SecureWebhookTransport({
      fetch: vi.fn<WebhookFetch>(),
      resolver: vi.fn<WebhookDnsResolver>(() => new Promise(() => undefined)),
      production: true,
      dnsTimeoutMs: 100,
    });
    const pending = transport.send(request);
    await vi.advanceTimersByTimeAsync(100);
    await expect(pending).resolves.toEqual({
      classification: "retryable",
      error: "Webhook destination DNS lookup timed out.",
    });
  });

  it.each([
    ["0.0.0.0", false],
    ["10.1.2.3", false],
    ["100.64.0.1", false],
    ["172.31.255.255", false],
    ["192.168.1.1", false],
    ["198.51.100.20", false],
    ["8.8.8.8", true],
    ["::1", false],
    ["fe80::1", false],
    ["fd00::1", false],
    ["2001:1::1", false],
    ["2001:db8::1", false],
    ["3fff::1", false],
    ["::ffff:192.168.1.1", false],
    ["::ffff:8.8.8.8", true],
    ["2606:4700:4700::1111", true],
  ])("classifies address %s as public=%s", (address, expected) => {
    expect(isPublicIpAddress(address as string)).toBe(expected);
  });
});

describe("webhook response classification and bounds", () => {
  it.each([
    [200, "delivered"],
    [299, "delivered"],
    [301, "permanent"],
    [400, "permanent"],
    [408, "retryable"],
    [425, "retryable"],
    [429, "retryable"],
    [500, "retryable"],
    [599, "retryable"],
  ] as const)("classifies status %i as %s", (status, classification) => {
    expect(classifyWebhookStatus(status)).toEqual({ classification, status });
  });

  it("treats a manually surfaced redirect as permanent", async () => {
    const fetch = vi.fn<WebhookFetch>().mockResolvedValue({ status: 307 });
    const transport = new SecureWebhookTransport({
      fetch,
      resolver: publicResolver,
      production: true,
    });

    await expect(transport.send(request)).resolves.toEqual({
      classification: "permanent",
      status: 307,
    });
  });

  it("aborts at the configured bounded timeout", async () => {
    vi.useFakeTimers();
    const fetch: WebhookFetch = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<never>((_resolve, reject) => {
          init.signal?.addEventListener("abort", () =>
            reject(new Error("aborted")),
          );
        }),
    );
    const transport = new SecureWebhookTransport({
      fetch,
      resolver: publicResolver,
      production: true,
      timeoutMs: 1_000,
    });

    const pending = transport.send(request);
    await vi.advanceTimersByTimeAsync(1_000);

    await expect(pending).resolves.toEqual({
      classification: "retryable",
      error: "Webhook request timed out.",
    });
  });

  it("rejects oversized requests before DNS or network access", async () => {
    const resolver = vi.fn<WebhookDnsResolver>();
    const fetch = vi.fn<WebhookFetch>();
    const transport = new SecureWebhookTransport({
      fetch,
      resolver,
      production: true,
      maxRequestBytes: 4,
    });

    await expect(transport.send(request)).resolves.toEqual({
      classification: "permanent",
      error: "Webhook request body exceeds the configured limit.",
    });
    expect(resolver).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns a bounded stable network error without leaking secrets", async () => {
    const fetch = vi
      .fn<WebhookFetch>()
      .mockRejectedValue(
        new Error(
          `network failure ${request.secret} v1=${"a".repeat(64)} ${"x".repeat(1_000)}`,
        ),
      );
    const transport = new SecureWebhookTransport({
      fetch,
      resolver: publicResolver,
      production: true,
    });

    const result = await transport.send(request);

    expect(result).toEqual({
      classification: "retryable",
      error: "Webhook network request failed.",
    });
    expect(JSON.stringify(result)).not.toContain(request.secret);
    expect(result.error?.length).toBeLessThanOrEqual(256);
  });

  it("drains response bodies and honors bounded Retry-After metadata", async () => {
    const cancel = vi.fn().mockResolvedValue(undefined);
    const fetch = vi.fn<WebhookFetch>().mockResolvedValue({
      status: 429,
      headers: { get: () => "120" },
      body: { cancel },
    });
    const transport = new SecureWebhookTransport({
      fetch,
      resolver: publicResolver,
      production: true,
      now: () => new Date("2026-07-21T00:00:00.000Z"),
    });
    await expect(transport.send(request)).resolves.toEqual({
      classification: "retryable",
      status: 429,
      retryAfterMs: 120_000,
    });
    expect(cancel).toHaveBeenCalledOnce();
  });

  it("parses delta and HTTP-date Retry-After values", () => {
    const now = new Date("2026-07-21T00:00:00.000Z");
    expect(parseRetryAfter("2", now)).toBe(2_000);
    expect(parseRetryAfter("Tue, 21 Jul 2026 00:01:00 GMT", now)).toBe(60_000);
    expect(parseRetryAfter("invalid", now)).toBeUndefined();
  });

  it.each([999, 30_001])("rejects timeout configuration %i", (timeoutMs) => {
    expect(() => new SecureWebhookTransport({ timeoutMs })).toThrow(
      "Webhook timeout must be between 1000 and 30000 ms.",
    );
  });
});
