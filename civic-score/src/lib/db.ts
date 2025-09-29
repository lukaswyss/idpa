import { PrismaClient } from "@prisma/client";
import { PrismaNeonHTTP } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import fs from "node:fs";
import path from "node:path";
import { Agent, fetch as undiciFetch } from "undici";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

// Configure Neon to use a custom fetch with corporate Root CAs
// Looks for certs in NODE_EXTRA_CA_CERTS, then ../certs and ./certs relative to the app cwd
(() => {
  try {
    const candidateFiles: string[] = [];

    const fromEnv = process.env.NODE_EXTRA_CA_CERTS?.trim();
    if (fromEnv && fs.existsSync(fromEnv) && fs.statSync(fromEnv).isFile()) {
      candidateFiles.push(fromEnv);
    }

    const candidateDirs = [
      path.resolve(process.cwd(), "./certs"),
      path.resolve(process.cwd(), "../certs"),
      path.resolve(process.cwd(), "../../certs"),
    ];

    for (const dir of candidateDirs) {
      if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
        const files = fs
          .readdirSync(dir)
          .filter((f) => /\.(crt|pem|cer)$/i.test(f))
          .map((f) => path.join(dir, f));
        candidateFiles.push(...files);
      }
    }

    const caBundle = candidateFiles
      .filter((filePath) => {
        try {
          return fs.statSync(filePath).isFile();
        } catch {
          return false;
        }
      })
      .map((filePath) => {
        try {
          return fs.readFileSync(filePath, "utf8");
        } catch {
          return "";
        }
      })
      .filter(Boolean)
      .join("\n");

    const allowInsecure = /^(1|true)$/i.test(process.env.ALLOW_INSECURE_TLS ?? "");
    if (allowInsecure) {
      const dispatcher = new Agent({ connect: { rejectUnauthorized: false } });
      neonConfig.fetchFunction = (input: any, init?: any) =>
        undiciFetch(input as any, { ...(init as any), dispatcher } as any);
    } else if (caBundle) {
      const dispatcher = new Agent({ connect: { ca: caBundle } });
      neonConfig.fetchFunction = (input: any, init?: any) =>
        undiciFetch(input as any, { ...(init as any), dispatcher } as any);
    }
  } catch {}
})();

const adapter = new PrismaNeonHTTP(databaseUrl, {});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
