import { describe, expect, it, vi } from "vitest";
import { NotImplementedException, UnauthorizedException } from "@nestjs/common";
import { accountingManifest } from "@erp/accounting";
import { createDefaultRegistry } from "@erp/core";
import { inventoryManifest } from "@erp/inventory";
import { integrationManifest } from "@erp/integration";
import { manufacturingManifest } from "@erp/manufacturing";
import { operationsManifest } from "@erp/operations";
import { procurementManifest } from "@erp/procurement";
import { qualityManifest } from "@erp/quality";
import { reportingManifest } from "@erp/reporting";
import { salesManifest } from "@erp/sales";
import { ErpController } from "./main.js";

describe("API module registry", () => {
  it("exposes core and sales modules", () => {
    const registry = createDefaultRegistry([
      salesManifest,
      accountingManifest,
      procurementManifest,
      inventoryManifest,
      manufacturingManifest,
      qualityManifest,
      reportingManifest,
      integrationManifest,
      operationsManifest,
    ]);
    expect(registry.list().map((module) => module.id)).toEqual([
      "accounting",
      "core",
      "integration",
      "inventory",
      "manufacturing",
      "operations",
      "procurement",
      "quality",
      "reporting",
      "sales",
    ]);
  });
});

describe("ERP read authorization", () => {
  it.each(["sales", "dashboard"] as const)(
    "requires sales read permission for %s",
    async (endpoint) => {
      const session = {
        sub: "usr_sales",
        tenantId: "ten_sales",
        email: "sales@example.test",
        roles: ["sales"],
        permissions: ["sales.customer.read"],
      };
      const reads = {
        sales: vi.fn().mockResolvedValue({ customers: [] }),
        dashboard: vi.fn().mockResolvedValue({ recentAudit: [] }),
      };
      const auth = {
        requirePermission: vi.fn().mockReturnValue(session),
      };
      const controller = new ErpController(reads as never, auth as never);

      await controller[endpoint]("Bearer token");

      expect(auth.requirePermission).toHaveBeenCalledWith(
        "Bearer token",
        "sales.customer.read",
      );
      if (endpoint === "sales") {
        expect(reads.sales).toHaveBeenCalledWith("ten_sales");
      } else {
        expect(reads.dashboard).toHaveBeenCalledWith(session);
      }
    },
  );
});

describe("generic workflow transition shutdown", () => {
  it("authenticates before rejecting the disabled endpoint", () => {
    const failure = new UnauthorizedException("Bearer token is required.");
    const reads = { workflowTransition: vi.fn() };
    const auth = {
      currentUser: vi.fn(() => {
        throw failure;
      }),
    };
    const controller = new ErpController(reads as never, auth as never);

    expect(() => controller.workflowTransition(undefined)).toThrow(failure);
    expect(auth.currentUser).toHaveBeenCalledWith(undefined);
    expect(reads.workflowTransition).not.toHaveBeenCalled();
  });

  it("returns a stable 501 without invoking transition side effects", () => {
    const reads = { workflowTransition: vi.fn() };
    const auth = {
      currentUser: vi.fn().mockReturnValue({
        sub: "usr_admin",
        tenantId: "ten_demo",
        roles: ["admin"],
        permissions: ["sales.quote.manage"],
      }),
    };
    const controller = new ErpController(reads as never, auth as never);

    let thrown: unknown;
    try {
      controller.workflowTransition("Bearer valid-token");
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(NotImplementedException);
    expect((thrown as NotImplementedException).getStatus()).toBe(501);
    expect((thrown as NotImplementedException).message).toBe(
      "Generic workflow transitions are disabled; use an entity-specific transition endpoint.",
    );
    expect(auth.currentUser).toHaveBeenCalledWith("Bearer valid-token");
    expect(reads.workflowTransition).not.toHaveBeenCalled();
  });
});
