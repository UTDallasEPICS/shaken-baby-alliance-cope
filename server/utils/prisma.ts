import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "#prisma-client";
import { resolve } from "node:path";

const rawUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const dbPath = rawUrl.startsWith("file:") ? rawUrl.slice(5) : rawUrl;
// Normalize to forward slashes so the file: URL is valid on Windows
const absoluteUrl = `file:${resolve(dbPath).replace(/\\/g, "/")}`;

const adapter = new PrismaBetterSqlite3({ url: absoluteUrl });
const prisma = new PrismaClient({ adapter });

export { prisma };
