import { describe, expect, it } from "vitest";
import { AuthService, resolveJwtSecret } from "./auth.js";

describe("JWT secret configuration", () => {
  it("uses a development-only fallback outside production", () => {
    const secret = resolveJwtSecret({
      NODE_ENV: "test",
      JWT_SECRET: undefined,
    });

    expect(secret).toContain("development-only");
  });

  it("uses an explicitly configured non-production secret", () => {
    expect(
      resolveJwtSecret({
        NODE_ENV: "development",
        JWT_SECRET: "local-secret",
      }),
    ).toBe("local-secret");
  });

  it("requires an explicit production secret", () => {
    expect(() =>
      resolveJwtSecret({ NODE_ENV: "production", JWT_SECRET: undefined }),
    ).toThrow("JWT_SECRET is required when NODE_ENV is production.");
  });

  it.each([
    "replace-me",
    "dev-only-change-me",
    "short-secret",
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  ])("rejects weak production secret configuration", (secret) => {
    expect(() =>
      resolveJwtSecret({ NODE_ENV: "production", JWT_SECRET: secret }),
    ).toThrow(
      "JWT_SECRET must be at least 32 characters and must not be a placeholder or low-diversity value in production.",
    );
  });

  it("accepts a strong production secret without transforming it", () => {
    const secret = "9vQ$2mK!7zR#4pL@8xT%3nC&6wY*1sDf";

    expect(
      resolveJwtSecret({ NODE_ENV: "production", JWT_SECRET: secret }),
    ).toBe(secret);
  });
});

describe("session token rejection", () => {
  it("maps a malformed unequal-length signature to unauthorized", () => {
    const auth = new AuthService();

    expect(() => auth.currentUser("Bearer header.payload.x")).toThrow(
      "Invalid or expired token.",
    );
  });
});
