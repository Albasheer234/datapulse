const { createClient } = require("@libsql/client");
const fs = require("fs");
const path = require("path");

let url = process.env.TURSO_DATABASE_URL;
let authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  try {
    const envContent = fs.readFileSync(path.resolve(process.cwd(), ".env.local"), "utf-8");
    envContent.split("\n").forEach((line) => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, "");
        if (key === "TURSO_DATABASE_URL") url = value;
        if (key === "TURSO_AUTH_TOKEN") authToken = value;
      }
    });
  } catch (err) {
    console.warn("Could not read .env.local:", err.message);
  }
}

const dbUrl = (url || "file:local.db").startsWith("libsql://")
  ? url.replace("libsql://", "https://")
  : url;

const client = createClient({
  url: dbUrl,
  authToken: authToken,
});

async function main() {
  console.log("Migrating database schema for Sessions feature...");

  // 1. Check & Add is_committed to transactions
  try {
    await client.execute(`ALTER TABLE transactions ADD COLUMN is_committed INTEGER DEFAULT 0;`);
    console.log("Added is_committed column to transactions");
  } catch (err) {
    if (err.message.includes("duplicate column") || err.message.includes("already exists")) {
      console.log("is_committed column already exists in transactions");
    } else {
      console.error("Error adding is_committed:", err.message);
    }
  }

  // 2. Check & Add session_id to transactions
  try {
    await client.execute(`ALTER TABLE transactions ADD COLUMN session_id TEXT;`);
    console.log("Added session_id column to transactions");
  } catch (err) {
    if (err.message.includes("duplicate column") || err.message.includes("already exists")) {
      console.log("session_id column already exists in transactions");
    } else {
      console.error("Error adding session_id:", err.message);
    }
  }

  // 3. Create saved_sessions table if not exists
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS saved_sessions (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL REFERENCES tenants(id),
        user_id TEXT NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        total_amount_kobo INTEGER NOT NULL DEFAULT 0,
        total_transactions INTEGER NOT NULL DEFAULT 0,
        successful_count INTEGER NOT NULL DEFAULT 0,
        failed_count INTEGER NOT NULL DEFAULT 0,
        carrier_breakdown_json TEXT NOT NULL,
        stats_json TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        saved_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
      );
    `);
    console.log("Created saved_sessions table successfully");
  } catch (err) {
    console.error("Error creating saved_sessions table:", err.message);
  }

  // 4. Create indexes
  try {
    await client.execute(`CREATE INDEX IF NOT EXISTS saved_sessions_tenant_idx ON saved_sessions(tenant_id);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS saved_sessions_saved_at_idx ON saved_sessions(saved_at);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS transactions_committed_idx ON transactions(tenant_id, is_committed);`);
    console.log("Indexes created successfully");
  } catch (err) {
    console.error("Error creating indexes:", err.message);
  }

  console.log("Migration complete!");
}

main().catch(console.error);
