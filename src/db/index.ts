import { mkdirSync } from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// DATABASE_URL examples:
//   file:./data/app.db                      local file (dev, or a VPS)
//   libsql://your-db.turso.io + DATABASE_AUTH_TOKEN   hosted (Vercel)
const url = process.env.DATABASE_URL ?? "file:./data/app.db";

if (url.startsWith("file:")) {
  mkdirSync(path.dirname(path.resolve(url.slice("file:".length))), { recursive: true });
}

// Keep one client across hot reloads in development.
const globalForDb = globalThis as unknown as { __db?: ReturnType<typeof drizzle<typeof schema>> };

export const db =
  globalForDb.__db ??
  drizzle(createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN }), { schema });

if (process.env.NODE_ENV !== "production") globalForDb.__db = db;

export * from "./schema";
