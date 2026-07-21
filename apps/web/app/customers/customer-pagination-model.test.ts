import { describe, expect, it } from "vitest";
import {
  customerPageHref,
  customerPageNavigation,
} from "./customer-pagination-model";

describe("customer cursor navigation", () => {
  it("makes customer 101 and later pages reachable when a page has more data", () => {
    expect(
      customerPageNavigation(undefined, {
        endCursor: "cus_100",
        hasNextPage: true,
        limit: 100,
      }),
    ).toEqual({
      first: null,
      next: "/customers?after=cus_100",
    });
  });

  it("offers first and next navigation from a later page", () => {
    expect(
      customerPageNavigation("cus_100", {
        endCursor: "cus_200",
        hasNextPage: true,
        limit: 100,
      }),
    ).toEqual({
      first: "/customers",
      next: "/customers?after=cus_200",
    });
  });

  it("encodes opaque cursor characters in the customer URL", () => {
    expect(customerPageHref("customer 100/next")).toBe(
      "/customers?after=customer+100%2Fnext",
    );
  });
});
