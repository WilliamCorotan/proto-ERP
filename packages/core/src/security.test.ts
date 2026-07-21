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

  it.each([
    ["truncated", (signature: string) => signature.slice(0, -1)],
    ["oversized", (signature: string) => `${signature}A`],
    ["invalid base64url", (signature: string) => `${signature.slice(0, -1)}%`],
    ["padded base64url", (signature: string) => `${signature}=`],
    ["tampered", (signature: string) => `${signature.slice(0, -1)}${signature.endsWith("A") ? "B" : "A"}`],
  ])("rejects a %s signature without throwing", (_name, mutate) => {
    const token = validToken();
    const [header, body, signature] = token.split(".");
    const malformed = `${header}.${body}.${mutate(signature ?? "")}`;

    expect(() => verifyAuthToken(malformed, "secret")).not.toThrow();
    expect(verifyAuthToken(malformed, "secret")).toBeNull();
  });

  it("rejects body tampering and extra token segments", () => {
    const token = validToken();
    const [header, body, signature] = token.split(".");
    expect(verifyAuthToken(`${header}.${body}A.${signature}`, "secret")).toBeNull();
    expect(verifyAuthToken(`${token}.extra`, "secret")).toBeNull();
  });

  it("continues to accept valid tokens and reject expired tokens", () => {
    expect(verifyAuthToken(validToken(), "secret")?.sub).toBe("usr_1");
    expect(verifyAuthToken(validToken(-1), "secret")).toBeNull();
  });
});

function validToken(ttlSeconds = 60): string {
  return signAuthToken(
    {
      sub: "usr_1",
      tenantId: "ten_1",
      email: "admin@example.com",
      roles: ["admin"],
      permissions: ["core.admin"],
    },
    "secret",
    ttlSeconds,
  );
}
