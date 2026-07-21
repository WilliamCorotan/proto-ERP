import type { SalesCustomerPage } from "@erp/sdk";

type CustomerPageInfo = SalesCustomerPage["pageInfo"];

export function customerPageNavigation(
  after: string | undefined,
  pageInfo: CustomerPageInfo,
): { first: string | null; next: string | null } {
  return {
    first: after ? "/customers" : null,
    next:
      pageInfo.hasNextPage && pageInfo.endCursor
        ? customerPageHref(pageInfo.endCursor)
        : null,
  };
}

export function customerPageHref(after: string): string {
  const query = new URLSearchParams({ after });
  return `/customers?${query.toString()}`;
}
