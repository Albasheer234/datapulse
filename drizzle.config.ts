import type { Config } from "drizzle-kit";

const rawUrl = process.env.TURSO_DATABASE_URL || "file:local.db";
const dbUrl = rawUrl.startsWith("libsql://")
  ? rawUrl.replace("libsql://", "https://")
  : rawUrl;

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  driver: "turso",
  dbCredentials: {
    url: dbUrl,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
} satisfies Config;


