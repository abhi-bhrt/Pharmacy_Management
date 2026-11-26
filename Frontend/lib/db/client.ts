// lib/db/client.ts
import { Prisma, PrismaClient } from "@prisma/client";
import { env } from "@/config/env";

export type DbExecutor = PrismaClient | Prisma.TransactionClient;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: env.DATABASE_URL } },
    log: env.isDevelopment ? ["error", "warn"] : ["error"],
  });

if (!env.isProduction) {
  globalForPrisma.prisma = prisma;
}

export async function withTransaction<T>(
  callback: (client: Prisma.TransactionClient) => Promise<T>,
  executor: DbExecutor = prisma
): Promise<T> {
  if ("$transaction" in executor) {
    return executor.$transaction(callback);
  }
  return callback(executor);
}