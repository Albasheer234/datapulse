const { createClient } = require("@libsql/client");

const client = createClient({
  url: "https://dataprofit-db-bashir234.aws-eu-west-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQwNzAyMjYsImlkIjoiMDE5ZjYyZGQtMTUwMS03OWJkLWFhNmUtMGQwYjZkZTE2NzI4Iiwia2lkIjoicjJyRmhPTHpadWx2czVoSnNfZzJ3djU4RHRFYlFIUzhVcDJ0OW1IUVItMCIsInJpZCI6ImM0MTQyZDg4LTEzMmMtNDYyYi05ZTBmLWI3ODU1ZmYyY2M5ZSJ9.3AnVYwZwPoMw5sLseyN8AKPf2N3kXRfhPIdW4MjIfQGVydZ8L-qPBR4s5PN6ZG6ozJ_mI1zOdNJDiMjouX4kBQ",
});

async function main() {
  const res = await client.execute("UPDATE processing_jobs SET status = 'failed', error_message = 'Job timed out during initial testing' WHERE status IN ('pending', 'processing')");
  console.log("Cleaned up stale jobs count:", res.rowsAffected);
}

main().catch(console.error);
