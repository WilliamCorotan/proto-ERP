import { describe, expect, it } from "vitest";
import { hashPassword, signAuthToken, verifyAuthToken, verifyPassword } from "./security";

describe("security primitives", () => {
  it("hashes and verifies passwords", async () => {
    const hash = await hashPassword("admin123", "test-salt");
    await expect(verifyPassword("admin123", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong", hash)).resolves.toBe(false);
  });

  it("signs and verifies auth tokens", () => {
    const token = signAuthToken(
      {
        sub: "usr_1",
        tenantId: "ten_1",
        email: "admin@example.com",
        roles: ["admin"],
        permissions: ["core.admin"]
      },
      "secret"
    );

    const payload = verifyAuthToken(token, "secret");
    expect(payload?.sub).toBe("usr_1");
    expect(verifyAuthToken(token, "wrong-secret")).toBeNull();
  });
});
