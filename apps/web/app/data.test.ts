import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  clientTokens: [] as Array<string | undefined>,
  cookies: vi.fn(),
  sales: vi.fn(),
  workflowInbox: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("@erp/sdk", () => ({
  ErpClient: class {
    constructor(_baseUrl: string, token?: string) {
      mocks.clientTokens.push(token);
    }

    sales = mocks.sales;
    workflowInbox = mocks.workflowInbox;
  },
}));

describe("ERP web data fallbacks", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    mocks.cookies.mockReset();
    mocks.cookies.mockResolvedValue({
      get: () => ({ value: "session-token" }),
    });
    mocks.clientTokens.length = 0;
    mocks.sales.mockReset();
    mocks.workflowInbox.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("propagates API failures by default", async () => {
    const failure = new Error("API unavailable");
    mocks.sales.mockRejectedValue(failure);

    const { getSalesSnapshot } = await import("./data");

    await expect(getSalesSnapshot()).rejects.toBe(failure);
    expect(mocks.clientTokens).toEqual(["session-token"]);
  });

  it("uses demo data only when explicitly enabled outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ERP_ENABLE_DEMO_DATA", "true");
    mocks.sales.mockRejectedValue(new Error("API unavailable"));

    const { getSalesSnapshot } = await import("./data");
    const snapshot = await getSalesSnapshot();

    expect(snapshot.customers.length).toBeGreaterThan(0);
    expect(snapshot.customers[0]?.id).toBe("cus_001");
  });

  it("does not allow demo data in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ERP_ENABLE_DEMO_DATA", "true");
    const failure = new Error("API unavailable");
    mocks.sales.mockRejectedValue(failure);

    const { getSalesSnapshot } = await import("./data");

    await expect(getSalesSnapshot()).rejects.toBe(failure);
  });

  it("rejects protected data access when the session is missing", async () => {
    mocks.cookies.mockResolvedValue({
      get: () => undefined,
    });

    const { getWorkflowInbox } = await import("./data");

    await expect(getWorkflowInbox()).rejects.toThrow(
      "Authentication is required to load the workflow inbox.",
    );
    expect(mocks.workflowInbox).not.toHaveBeenCalled();
  });
});
