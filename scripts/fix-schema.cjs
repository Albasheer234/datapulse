const { createClient } = require("@libsql/client");

const client = createClient({
  url: "https://dataprofit-db-bashir234.aws-eu-west-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQwNzAyMjYsImlkIjoiMDE5ZjYyZGQtMTUwMS03OWJkLWFhNmUtMGQwYjZkZTE2NzI4Iiwia2lkIjoicjJyRmhPTHpadWx2czVoSnNfZzJ3djU4RHRFYlFIUzhVcDJ0OW1IUVItMCIsInJpZCI6ImM0MTQyZDg4LTEzMmMtNDYyYi05ZTBmLWI3ODU1ZmYyY2M5ZSJ9.3AnVYwZwPoMw5sLseyN8AKPf2N3kXRfhPIdW4MjIfQGVydZ8L-qPBR4s5PN6ZG6ozJ_mI1zOdNJDiMjouX4kBQ",
});

async function main() {
  // Check actual table schema
  const schema = await client.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='transactions'");
  console.log("Transactions table DDL:\n", schema.rows[0]?.sql);
  console.log("\n---\n");

  // Check for unique constraints specifically
  const indexes = await client.execute("SELECT name, sql FROM sqlite_master WHERE type='index' AND tbl_name='transactions'");
  console.log("Indexes on transactions:");
  indexes.rows.forEach(r => console.log(r.name, "=>", r.sql));

  // Add missing unique constraint
  console.log("\n\nAdding UNIQUE constraint for (tenant_id, unique_id)...");
  try {
    await client.execute("CREATE UNIQUE INDEX IF NOT EXISTS transactions_tenant_unique_uidx ON transactions (tenant_id, unique_id)");
    console.log("DONE! Unique constraint added.");
  } catch (e) {
    console.error("Error adding constraint:", e.message);
  }
}

main().catch(console.error);
