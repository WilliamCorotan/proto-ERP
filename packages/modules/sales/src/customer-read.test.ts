import { describe, expect, it, vi } from "vitest";
import {
  ListSalesCustomersUseCase,
  type SalesCustomerReadPort,
} from "./index.js";

describe("ListSalesCustomersUseCase", () => {
  it("normalizes a bounded query before invoking the inward port", async () => {
    const port: SalesCustomerReadPort = {
      listCustomers: vi.fn().mockResolvedValue({
        items: [],
        pageInfo: { endCursor: null, hasNextPage: false, limit: 10 },
      }),
    };
    const useCase = new ListSalesCustomersUseCase(port);

    await useCase.execute("ten_alpha", {
      after: "  cus_10  ",
      limit: "10",
      search: "  north  ",
      status: "active",
    });

    expect(port.listCustomers).toHaveBeenCalledWith("ten_alpha", {
      after: "cus_10",
      limit: 10,
      search: "north",
      status: "active",
    });
  });

  it("applies the default limit", async () => {
    const port: SalesCustomerReadPort = {
      listCustomers: vi.fn().mockResolvedValue({
        items: [],
        pageInfo: { endCursor: null, hasNextPage: false, limit: 25 },
      }),
    };

    await new ListSalesCustomersUseCase(port).execute("ten_alpha");

    expect(port.listCustomers).toHaveBeenCalledWith("ten_alpha", {
      limit: 25,
    });
  });

  it.each([0, 101, "1.5", "many"])("rejects invalid limit %s", (limit) => {
    const port = { listCustomers: vi.fn() };

    expect(() =>
      new ListSalesCustomersUseCase(port).execute("ten_alpha", { limit }),
    ).toThrowError(
      expect.objectContaining({
        code: "INVALID_LIMIT",
      }),
    );
    expect(port.listCustomers).not.toHaveBeenCalled();
  });

  it("rejects unsupported status filters", () => {
    const port = { listCustomers: vi.fn() };

    expect(() =>
      new ListSalesCustomersUseCase(port).execute("ten_alpha", {
        status: "archived",
      }),
    ).toThrowError(
      expect.objectContaining({
        code: "INVALID_FILTER",
      }),
    );
  });
});
