import { PrismaClient } from "@prisma/client";
import { PrismaNeonHTTP } from "@prisma/adapter-neon";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

const isDev = process.env.NODE_ENV === "development";
const databaseUrl = isDev ? (process.env.DEV_DATABASE_URL || process.env.DATABASE_URL) : process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(isDev ? "DEV_DATABASE_URL or DATABASE_URL is not set" : "DATABASE_URL is not set");
}

// Use default TLS trust store (no custom CA overrides)

const adapter = new PrismaNeonHTTP(databaseUrl, {});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
