import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  cookieSet: vi.fn(),
  dispatchWebhook: vi.fn(),
  login: vi.fn(),
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: mocks.cookieGet,
    set: mocks.cookieSet,
  }),
}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@erp/sdk", () => ({
  ErpClient: class {
    dispatchWebhook = mocks.dispatchWebhook;
    login = mocks.login;
  },
}));

import { dispatchWebhookAction, loginAction } from "./actions";

describe("loginAction", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    mocks.cookieSet.mockReset();
    mocks.cookieGet.mockReset();
    mocks.dispatchWebhook.mockReset().mockResolvedValue({ status: "pending" });
    mocks.login.mockReset().mockResolvedValue({ token: "session-token" });
    mocks.redirect.mockReset();
    mocks.revalidatePath.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sets a secure production session and leaves the login page", async () => {
    await loginAction(loginFormData());

    expect(mocks.login).toHaveBeenCalledWith({
      tenantSlug: "acme",
      email: "admin@acme.example",
      password: "admin123",
    });
    expect(mocks.cookieSet).toHaveBeenCalledWith("erp_token", "session-token", {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/");
    expect(mocks.redirect).toHaveBeenCalledWith("/");
  });

  it("keeps local development cookies usable over HTTP", async () => {
    vi.stubEnv("NODE_ENV", "development");

    await loginAction(loginFormData());

    expect(mocks.cookieSet).toHaveBeenCalledWith(
      "erp_token",
      "session-token",
      expect.objectContaining({ secure: false }),
    );
  });
});

describe("dispatchWebhookAction", () => {
  beforeEach(() => {
    mocks.cookieGet.mockReset().mockReturnValue({ value: "session-token" });
    mocks.dispatchWebhook.mockReset().mockResolvedValue({ status: "pending" });
    mocks.revalidatePath.mockReset();
  });

  it("enqueues a webhook without accepting a simulated outcome", async () => {
    const formData = new FormData();
    formData.set("subscriptionId", "whsub_ops");
    formData.set("eventType", "operations.lead.created");
    formData.set("entityId", "lead_123");
    formData.set("fail", "on");

    await dispatchWebhookAction(formData);

    expect(mocks.dispatchWebhook).toHaveBeenCalledWith({
      subscriptionId: "whsub_ops",
      eventType: "operations.lead.created",
      payload: { entityId: "lead_123", source: "web-console" },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/integrations");
  });
});

function loginFormData(): FormData {
  const formData = new FormData();
  formData.set("tenantSlug", "acme");
  formData.set("email", "admin@acme.example");
  formData.set("password", "admin123");
  return formData;
}
