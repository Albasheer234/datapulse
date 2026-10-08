const { createClient } = require("@libsql/client");

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
  process.exit(1);
}

// Ensure we are using the HTTP URL for compatibility
const dbUrl = url.startsWith("libsql://") ? url.replace("libsql://", "https://") : url;

const client = createClient({
  url: dbUrl,
  authToken: authToken,
});

async function checkDatabaseHealth() {
  console.log("⏱️ Testing Turso connection...");
  const startTime = Date.now();
  
  try {
    const result = await client.execute("SELECT 1 AS health_check");
    const latency = Date.now() - startTime;
    
    if (result.rows.length > 0) {
      console.log(`✅ Connection successful!`);
      console.log(`⚡ Latency: ${latency}ms`);
      
      if (latency > 5000) {
        console.warn("⚠️ Warning: Latency is unusually high (> 5 seconds). The app may still be slow or time out.");
      } else {
        console.log("🚀 The database is healthy and responding fast!");
      }
    }
  } catch (error) {
    const latency = Date.now() - startTime;
    console.error(`❌ Connection failed after ${latency}ms.`);
    console.error("Error details:", error.message);
    
    if (error.message.includes("fetch failed") || error.message.includes("Timeout")) {
      console.error("\n💡 Diagnosis: Your internet connection is blocking the request, or Turso is temporarily rate-limiting this database.");
    }
  }
}

checkDatabaseHealth();
