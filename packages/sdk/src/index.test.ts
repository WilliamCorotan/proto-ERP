import { afterEach, describe, expect, it, vi } from "vitest";
import { ErpClient, type OpenApiPaths, type WebhookEventContract } from "./index.js";

describe("ErpClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses generated OpenAPI path types", () => {
    const salesPath: keyof OpenApiPaths = "/sales";
    expect(salesPath).toBe("/sales");
  });

  it("sends the tenant slug when creating a session", async () => {
    const session = {
      token: "token",
      user: {
        id: "usr_admin",
        tenantId: "ten_demo",
        email: "admin@acme.example",
        name: "Admin",
        roles: ["admin"],
        permissions: ["core.admin"],
      },
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(session),
    });
    vi.stubGlobal("fetch", fetchMock);

    await new ErpClient("http://localhost:4000").login({
      tenantSlug: "acme",
      email: "admin@acme.example",
      password: "admin123",
    });

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:4000/auth/login", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        tenantSlug: "acme",
        email: "admin@acme.example",
        password: "admin123",
      }),
    });
  });

  it("authenticates tenant dashboard reads", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    vi.stubGlobal("fetch", fetchMock);

    await new ErpClient("http://localhost:4000", "token").dashboard();

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:4000/dashboard", {
      cache: "no-store",
      headers: {
        accept: "application/json",
        authorization: "Bearer token",
      },
    });
  });

  it("fetches webhook event contracts", async () => {
    const events: WebhookEventContract[] = [
      {
        type: "sales.order.created",
        version: "2026-07-01",
        description: "Sales order created.",
        payloadSchema: "SalesOrderCreatedPayload"
      }
    ];
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(events)
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(new ErpClient("http://localhost:4000", "token").webhookEvents()).resolves.toEqual(events);
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:4000/webhooks/events", {
      cache: "no-store",
      headers: {
        accept: "application/json",
        authorization: "Bearer token"
      }
    });
  });
});
