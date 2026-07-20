import { describe, expect, it } from "vitest";
import {
  activeMigrationTemporaryDirectories,
  deployTestMigrations,
  requireTestDatabaseUrl,
} from "./postgres.js";

describe("PostgreSQL integration target validation", () => {
  it("requires an explicit TEST_DATABASE_URL", () => {
    expect(() => requireTestDatabaseUrl(undefined)).toThrow(
      "TEST_DATABASE_URL is required",
    );
    expect(() => requireTestDatabaseUrl("  ")).toThrow(
      "TEST_DATABASE_URL is required",
    );
  });

  it("accepts a stable PostgreSQL administrative database", () => {
    expect(
      requireTestDatabaseUrl(
        "postgresql://erp:secret@postgres:5432/erp_test?schema=public",
      ),
    ).toBe("postgresql://erp:secret@postgres:5432/erp_test?schema=public");
  });

  it.each([
    "not a URL",
    "mysql://erp:secret@postgres:5432/erp_test",
    "postgresql://postgres:5432/erp_test",
    "postgresql://erp:secret@postgres:5432/",
    "postgresql://erp:secret@postgres:5432/erp/test",
    "postgresql://erp:secret@postgres:5432/template1",
    "postgresql://erp:secret@postgres:5432/erp_it_previous",
    "postgresql://erp:secret@postgres:5432/erp_test#unsafe",
  ])("rejects malformed or unsafe administrative target %s", (value) => {
    expect(() => requireTestDatabaseUrl(value)).toThrow();
  });

  it("rejects an unknown cutoff and removes its temporary snapshot", async () => {
    await expect(
      deployTestMigrations("postgresql://unused:unused@localhost/unused", {
        through: "99999999999999_missing",
      }),
    ).rejects.toThrow("Unknown migration cutoff: 99999999999999_missing.");
    expect(activeMigrationTemporaryDirectories()).toEqual([]);
  });
});
