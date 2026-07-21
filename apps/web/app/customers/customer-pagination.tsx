import { Button } from "../../components/design-system";
import type { SalesCustomerPage } from "@erp/sdk";
import { customerPageNavigation } from "./customer-pagination-model";

type CustomerPaginationProps = {
  after: string | undefined;
  pageInfo: SalesCustomerPage["pageInfo"];
};

export function CustomerPagination({
  after,
  pageInfo,
}: CustomerPaginationProps) {
  const links = customerPageNavigation(after, pageInfo);

  if (!links.first && !links.next) {
    return null;
  }

  return (
    <nav className="customer-page-navigation" aria-label="Customer pages">
      {links.first ? (
        <Button asChild size="sm" variant="secondary">
          <a href={links.first}>First page</a>
        </Button>
      ) : null}
      {links.next ? (
        <Button asChild size="sm">
          <a href={links.next}>Next page</a>
        </Button>
      ) : null}
    </nav>
  );
}
