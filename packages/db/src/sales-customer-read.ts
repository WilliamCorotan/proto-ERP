import type { Prisma, PrismaClient } from "@prisma/client";
import {
  SalesCustomerReadError,
  type Customer,
  type SalesCustomerPage,
  type SalesCustomerPageQuery,
  type SalesCustomerReadPort,
} from "@erp/sales";

export class PrismaSalesCustomerReadAdapter implements SalesCustomerReadPort {
  constructor(private readonly prisma: PrismaClient) {}

  async listCustomers(
    tenantId: string,
    query: SalesCustomerPageQuery,
  ): Promise<SalesCustomerPage> {
    const where = customerWhere(tenantId, query);
    if (query.after) {
      const cursor = await this.prisma.customer.findFirst({
        where: { ...where, id: query.after },
        select: { id: true },
      });
      if (!cursor) {
        throw new SalesCustomerReadError(
          "INVALID_CURSOR",
          "Customer cursor is not available for this tenant and filter.",
        );
      }
    }

    const records = await this.prisma.customer.findMany({
      where,
      orderBy: { id: "asc" },
      take: query.limit + 1,
      ...(query.after ? { cursor: { id: query.after }, skip: 1 } : {}),
    });
    const hasNextPage = records.length > query.limit;
    const pageRecords = records.slice(0, query.limit);
    const items = pageRecords.map(mapCustomer);

    return {
      items,
      pageInfo: {
        endCursor: items.at(-1)?.id ?? null,
        hasNextPage,
        limit: query.limit,
      },
    };
  }
}

function customerWhere(
  tenantId: string,
  query: SalesCustomerPageQuery,
): Prisma.CustomerWhereInput {
  return {
    tenantId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? {
          OR: ["code", "email", "name"].map((field) => ({
            [field]: { contains: query.search, mode: "insensitive" },
          })),
        }
      : {}),
  };
}

function mapCustomer(record: {
  id: string;
  code: string;
  name: string;
  status: "active" | "paused";
  owner: string;
  email: string;
  creditLimit: Prisma.Decimal;
  currency: string;
  customData: Prisma.JsonValue | null;
}): Customer {
  return {
    id: record.id,
    code: record.code,
    name: record.name,
    status: record.status,
    owner: record.owner,
    email: record.email,
    creditLimit: {
      amount: Number(record.creditLimit),
      currency: record.currency,
    },
    customFields: normalizeCustomFields(record.customData),
  };
}

function normalizeCustomFields(
  value: Prisma.JsonValue | null,
): Customer["customFields"] {
  if (!value || Array.isArray(value) || typeof value !== "object") return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string | number | boolean | null] => {
        const field = entry[1];
        return (
          field === null ||
          typeof field === "string" ||
          typeof field === "number" ||
          typeof field === "boolean"
        );
      },
    ),
  );
}
