import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

export type PrismaClientLike = {
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
};

export function createPrismaClient(
  databaseUrl = process.env.DATABASE_URL ?? "postgresql://erp:erp@localhost:5432/erp?schema=public"
): PrismaClient {
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({ adapter });
}

export async function verifyDatabaseConnection(client: PrismaClientLike): Promise<boolean> {
  try {
    await client.$connect();
    return true;
  } finally {
    await client.$disconnect();
  }
}
