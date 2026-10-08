// Direct Turso HTTP API migration — bypasses libsql migration jobs API
const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
  process.exit(1);
}

// Convert libsql:// URL to https:// for the REST API
const httpsUrl = url.replace(/^libsql:\/\//, "https://");
const apiUrl = `${httpsUrl}/v2/pipeline`;

const statements = [
  `CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    is_active INTEGER DEFAULT 1 NOT NULL,
    created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
    updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    tenant_id TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'user' NOT NULL,
    is_active INTEGER DEFAULT 1 NOT NULL,
    created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
  )`,
  `CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY NOT NULL,
    tenant_id TEXT NOT NULL,
    unique_id TEXT NOT NULL,
    bundle_size_gb REAL NOT NULL,
    price_kobo INTEGER NOT NULL,
    phone_number TEXT NOT NULL,
    carrier TEXT NOT NULL,
    status TEXT NOT NULL,
    transaction_date INTEGER NOT NULL,
    raw_response TEXT,
    portal_name TEXT,
    processed_at INTEGER DEFAULT (unixepoch()) NOT NULL,
    image_url TEXT,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
  )`,
  `CREATE TABLE IF NOT EXISTS processing_jobs (
    id TEXT PRIMARY KEY NOT NULL,
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL,
    total_images INTEGER NOT NULL,
    processed_images INTEGER DEFAULT 0 NOT NULL,
    failed_images INTEGER DEFAULT 0 NOT NULL,
    extracted_transactions INTEGER DEFAULT 0 NOT NULL,
    error_message TEXT,
    image_urls TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
    completed_at INTEGER,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`,
  `CREATE INDEX IF NOT EXISTS jobs_tenant_idx ON processing_jobs (tenant_id)`,
  `CREATE INDEX IF NOT EXISTS jobs_user_idx ON processing_jobs (user_id)`,
  `CREATE INDEX IF NOT EXISTS transactions_tenant_idx ON transactions (tenant_id)`,
  `CREATE INDEX IF NOT EXISTS transactions_unique_id_idx ON transactions (unique_id)`,
  `CREATE INDEX IF NOT EXISTS transactions_tenant_unique_idx ON transactions (tenant_id, unique_id)`,
  `CREATE INDEX IF NOT EXISTS transactions_date_idx ON transactions (transaction_date)`,
  `CREATE INDEX IF NOT EXISTS users_tenant_idx ON users (tenant_id)`,
];

async function main() {
  console.log("🔗 Connecting to Turso via HTTP API:", httpsUrl);

  const body = JSON.stringify({
    requests: statements.map(sql => ({
      type: "execute",
      stmt: { sql },
    })).concat([{ type: "close" }]),
  });

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`❌ HTTP ${res.status}: ${text}`);
    process.exit(1);
  }

  const json = await res.json();

  json.results.forEach((result, i) => {
    const label = statements[i]?.trim().split("\n")[0].substring(0, 60) || "close";
    if (result.type === "ok") {
      console.log("✅", label);
    } else {
      console.error("❌", label, "\n  ", result.error?.message);
    }
  });

  console.log("\n🎉 All tables created successfully in Turso!");
}

main().catch(err => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
