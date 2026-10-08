require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@libsql/client");

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const dbUrl = url.startsWith("libsql://") ? url.replace("libsql://", "https://") : url;

const client = createClient({
  url: dbUrl,
  authToken: authToken,
});

async function checkJobs() {
  const result = await client.execute("SELECT id, status, error_message, processed_images, extracted_transactions, created_at FROM processing_jobs ORDER BY created_at DESC LIMIT 5");
  console.log("Last 5 Jobs:");
  console.table(result.rows);
}

checkJobs();
