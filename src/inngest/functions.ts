import { inngest } from "./client";
import { db } from "@/db/client";
import { transactions, processingJobs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { v4 as uuidv4 } from "uuid";

// ─── GEMINI VISION EXTRACTION ──────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const EXTRACTION_PROMPT = `
You are an expert, high-precision data extraction system for Nigerian mobile data reseller portals.
Your job is to read screenshot images of transaction logs and extract 100% of the visible transaction rows into a structured JSON array.

CRITICAL ACCURACY INSTRUCTIONS:
1. Scan the table row-by-row from top to bottom. Do NOT skip any rows, even if they look similar or repeated.
2. Extract ALL visible rows in the table. If there are 20 rows, you MUST return exactly 20 objects.
3. For each transaction row, accurately extract:
   - unique_id: The ID column value (e.g., "Data81839525948918735361")
   - plan: The Plan column value (e.g., "1000.0", "0.5", "2000.0") 
   - plan_amount: The Plan amount column value (e.g., "₦500.0", "₦290.0")
   - phone_number: The Number column value (e.g., "08037042922")
   - date: The Date column value (e.g., "June 23, 2026, 10:03 p.m.")
   - status: The Status column value ("successful" or "failed")
   - api_response: The API RESP column value (the full text response)

Return ONLY a valid JSON array like this:
[
  {
    "unique_id": "Data81839525948918735361",
    "plan": "1000.0",
    "plan_amount": "₦500.0",
    "phone_number": "08037042922",
    "date": "June 23, 2026, 10:03 p.m.",
    "status": "successful",
    "api_response": "Y'ello! You..."
  }
]

If no transactions are found, return an empty array [].
`;

function isTransientError(error: any): boolean {
  const msg = (error?.message || String(error)).toLowerCase();
  return (
    msg.includes("503") ||
    msg.includes("429") ||
    msg.includes("high demand") ||
    msg.includes("service unavailable") ||
    msg.includes("fetch failed") ||
    msg.includes("enotfound") ||
    msg.includes("econnreset") ||
    msg.includes("etimedout") ||
    msg.includes("socket") ||
    msg.includes("network")
  );
}

// Active high-performance model pool tested & verified for JSON extraction
const GEMINI_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-3.5-flash",
];

async function extractFromImage(imageBase64: string, mimeType = "image/jpeg", maxRetries = 2): Promise<any[]> {
  let lastError: any = null;

  for (let modelIdx = 0; modelIdx < GEMINI_MODELS.length; modelIdx++) {
    const modelName = GEMINI_MODELS[modelIdx];
    const model = genAI.getGenerativeModel({ model: modelName });

    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        const result = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [
                { text: EXTRACTION_PROMPT },
                {
                  inlineData: {
                    mimeType,
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.0, // Strict deterministic mode (eliminates random skipping)
            maxOutputTokens: 8192, // Prevents truncating response on 20+ row tables
            responseMimeType: "application/json",
          },
        });

        const response = await result.response;
        const text = response.text().trim();
        console.log(`[EXTRACT] (${modelName}) Attempt ${attempt + 1} raw output (${text.length} chars):`, text.substring(0, 300));

        // If response is empty, treat as transient error and retry
        if (!text || text === '[]' || text === 'null') {
          attempt++;
          console.warn(`[EXTRACT] (${modelName}) Empty response on attempt ${attempt}, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
          continue;
        }

        try {
          const parsed = JSON.parse(text);
          // Handle case where Gemini wraps it in an object instead of array
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
             // Find the first array value inside the object
             const arr = Object.values(parsed).find(val => Array.isArray(val));
             if (arr) return arr as any[];
          }
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          // Fallback: try to extract JSON array from text
          const jsonMatch = text.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            try { return JSON.parse(jsonMatch[0]); } catch { /* fall through */ }
          }
          attempt++;
          console.warn(`[EXTRACT] (${modelName}) JSON parse failed on attempt ${attempt}, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }
      } catch (error: any) {
        attempt++;
        lastError = error;
        const msg = (error?.message || String(error)).toLowerCase();
        console.error(`Gemini API (${modelName}) attempt ${attempt} failed:`, error.message);

        // If quota limit or 429 hit for this model, immediately switch to next model in pool
        if (msg.includes("429") || msg.includes("quota") || msg.includes("resourceexhausted") || msg.includes("too many requests")) {
          console.warn(`[EXTRACT] Rate/quota limit on ${modelName}, switching to next model in pool...`);
          break; // Break attempt loop to try next model immediately
        }

        // If not a retryable error, switch model
        if (attempt >= maxRetries || !isTransientError(error)) {
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
  }

  if (lastError) {
    throw lastError;
  }
  return [];
}

// ─── CARRIER DETECTION ─────────────────────────────────
function detectCarrier(phoneNumber: string): "MTN" | "AIRTEL" | "GLO" | "9MOBILE" | "UNKNOWN" {
  const prefix = phoneNumber.substring(0, 4);
  const mtnPrefixes = ["0803", "0806", "0703", "0706", "0813", "0816", "0810", "0814", "0903", "0906", "0913", "0916"];
  const airtelPrefixes = ["0802", "0808", "0708", "0812", "0902", "0901", "0907", "0912"];
  const gloPrefixes = ["0805", "0807", "0705", "0815", "0811", "0905", "0915"];
  const nineMobilePrefixes = ["0809", "0817", "0818", "0908", "0909", "0918"];

  if (mtnPrefixes.includes(prefix)) return "MTN";
  if (airtelPrefixes.includes(prefix)) return "AIRTEL";
  if (gloPrefixes.includes(prefix)) return "GLO";
  if (nineMobilePrefixes.includes(prefix)) return "9MOBILE";
  return "UNKNOWN";
}

// ─── NORMALIZATION ENGINE ────────────────────────────────
function normalizeBundleSize(planValue: string): number {
  const clean = planValue.replace(/[^0-9.]/g, "");
  const num = parseFloat(clean);
  if (isNaN(num)) return 0;

  // Handle known patterns
  if (num === 0.5) return 0.5; // 500MB
  if (num === 1000) return 1.0; // 1GB
  if (num === 2000) return 2.0; // 2GB
  if (num === 3000) return 3.0; // 3GB
  if (num === 5000) return 5.0; // 5GB
  if (num === 10000) return 10.0; // 10GB

  // If already in GB (e.g., 1.0, 2.0, 5.0)
  if (num <= 10 && num >= 0.1) return num;

  // Default: assume it's in MB and convert
  return num / 1000;
}

function normalizePrice(amountStr: string): number {
  const clean = amountStr.replace(/[^0-9.]/g, "");
  const num = parseFloat(clean);
  if (isNaN(num)) return 0;
  // Convert to kobo (Nigerian currency smallest unit)
  return Math.round(num * 100);
}

function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  try {
    // Clean up common Nigerian date strings (e.g., "12:55 p.m." -> "12:55 PM")
    const cleanDate = dateStr
      .replace(/p\.m\./i, "PM")
      .replace(/a\.m\./i, "AM")
      .replace(/pm/i, "PM")
      .replace(/am/i, "AM");

    const parsed = new Date(cleanDate);
    // If it's an Invalid Date, getTime() returns NaN
    if (isNaN(parsed.getTime())) {
      return new Date(); // Fallback to now
    }
    return parsed;
  } catch {
    return new Date();
  }
}

// ─── INNGEST FUNCTION: PROCESS IMAGE BATCH ─────────────
export const processImageBatch = inngest.createFunction(
  {
    id: "process-image-batch",
    name: "Process Screenshot Batch",
    // Retry config for Gemini API failures
    retries: 3,
    // Concurrency: process 2 batches at a time per tenant
    concurrency: {
      limit: 2,
      key: "event.data.tenantId",
    },
  },
  { event: "app/screenshot.batch.uploaded" },
  async ({ event, step }) => {
    const { jobId, tenantId, userId, imageUrls } = event.data;

    let totalExtracted = 0;
    let processedCount = 0;
    let failedCount = 0;

    // Fetch images from database if not passed in event payload (protects against Inngest 512KB payload limit)
    let images: string[] = imageUrls || [];
    if (!images || images.length === 0) {
      const jobRecord = await step.run("fetch-job-images", async () => {
        const jobs = await db
          .select()
          .from(processingJobs)
          .where(eq(processingJobs.id, jobId))
          .limit(1);
        return jobs[0] || null;
      });

      if (jobRecord && jobRecord.imageUrls) {
        try {
          images = JSON.parse(jobRecord.imageUrls);
        } catch {
          images = [];
        }
      }
    }

    // Process each image
    for (let i = 0; i < images.length; i++) {
      const imageUrl = images[i];

      const result = await step.run(
        `process-image-${i}`,
        async () => {
          try {
            // Extract base64 and mimeType (support data: URLs directly without fetch)
            let base64 = "";
            let mimeType = "image/jpeg";

            if (imageUrl.startsWith("data:")) {
              const matches = imageUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
              if (matches) {
                mimeType = matches[1];
                base64 = matches[2];
              } else {
                const parts = imageUrl.split(",");
                base64 = parts[1] || parts[0];
              }
            } else {
              const imageResponse = await fetch(imageUrl);
              const imageBuffer = await imageResponse.arrayBuffer();
              base64 = Buffer.from(imageBuffer).toString("base64");
              const contentType = imageResponse.headers.get("content-type");
              if (contentType) mimeType = contentType;
            }

            // Extract transactions with Gemini
            const extracted = await extractFromImage(base64, mimeType);

            if (!extracted || extracted.length === 0) {
              return { success: true, extracted: 0, transactions: [] };
            }

            // Normalize and insert each transaction
            const normalizedTransactions = extracted.map((tx: any) => ({
              id: uuidv4(),
              tenantId,
              uniqueId: tx.unique_id || `unknown-${uuidv4()}`,
              bundleSizeGb: normalizeBundleSize(tx.plan || "0"),
              priceKobo: normalizePrice(tx.plan_amount || "0"),
              phoneNumber: tx.phone_number || "",
              carrier: detectCarrier(tx.phone_number || ""),
              status: (tx.status || "pending").toLowerCase() as "successful" | "failed" | "pending",
              transactionDate: parseDate(tx.date),
              rawResponse: tx.api_response || null,
              portalName: null,
              imageUrl,
              isCommitted: false,
            }));

            // Insert with deduplication (INSERT OR IGNORE via onConflictDoNothing)
            let inserted = 0;
            for (const tx of normalizedTransactions) {
              try {
                await db
                  .insert(transactions)
                  .values(tx)
                  .onConflictDoNothing();
                inserted++;
              } catch (err) {
                console.error("Insert error:", err);
              }
            }

            return {
              success: true,
              extracted: extracted.length,
              inserted,
            };
          } catch (error) {
            console.error(`Failed to process image ${i}:`, error);
            
            // If it's a transient network/API error, THROW the error 
            // so Inngest's automatic step retry system kicks in.
            if (isTransientError(error)) {
              throw error; 
            }
            
            const errMsg = error instanceof Error ? error.message : "Unknown error";
            return {
              success: false,
              error: errMsg,
            };
          }
        }
      );

      let lastErrorMessage = null;

      if (result.success) {
        processedCount++;
        totalExtracted += (result as any).inserted || 0;
      } else {
        failedCount++;
        lastErrorMessage = (result as any).error || "Unknown error";
      }

        // Update job progress
        await step.run(`update-progress-${i}`, async () => {
          await db
            .update(processingJobs)
            .set({
              processedImages: processedCount,
              failedImages: failedCount,
              extractedTransactions: totalExtracted,
              errorMessage: lastErrorMessage,
            })
            .where(eq(processingJobs.id, jobId));
        });

        // Gentle spacing between images in batch to prevent burst rate limits
        if (i < images.length - 1) {
          await step.sleep(`pause-before-next-${i}`, "1.5s");
        }
      }

    // Mark job as completed
    await step.run("finalize-job", async () => {
      await db
        .update(processingJobs)
        .set({
          status: failedCount > 0 && processedCount === 0 ? "failed" : "completed",
          processedImages: processedCount,
          failedImages: failedCount,
          extractedTransactions: totalExtracted,
          completedAt: new Date(),
        })
        .where(eq(processingJobs.id, jobId));
    });

    return {
      success: true,
      jobId,
      totalImages: imageUrls.length,
      processed: processedCount,
      failed: failedCount,
      extracted: totalExtracted,
    };
  }
);

// ─── INNGEST FUNCTION: SINGLE IMAGE PROCESSING ─────────
export const processSingleImage = inngest.createFunction(
  {
    id: "process-single-image",
    name: "Process Single Screenshot",
    retries: 3,
  },
  { event: "app/screenshot.uploaded" },
  async ({ event, step }) => {
    const { tenantId, userId, imageBase64, imageUrl } = event.data;

    return step.run("extract-and-save", async () => {
      const extracted = await extractFromImage(imageBase64);

      if (!extracted || extracted.length === 0) {
        return { success: false, message: "No transactions found" };
      }

      let inserted = 0;
      for (const tx of extracted) {
        const normalized = {
          id: uuidv4(),
          tenantId,
          uniqueId: tx.unique_id || `unknown-${uuidv4()}`,
          bundleSizeGb: normalizeBundleSize(tx.plan || "0"),
          priceKobo: normalizePrice(tx.plan_amount || "0"),
          phoneNumber: tx.phone_number || "",
          carrier: detectCarrier(tx.phone_number || ""),
          status: (tx.status || "pending").toLowerCase() as "successful" | "failed" | "pending",
          transactionDate: parseDate(tx.date),
          rawResponse: tx.api_response || null,
          portalName: null,
          imageUrl,
          isCommitted: false,
        };

        try {
          await db
            .insert(transactions)
            .values(normalized)
            .onConflictDoNothing({
              target: [transactions.tenantId, transactions.uniqueId],
            });
          inserted++;
        } catch (err) {
          console.error("Insert error:", err);
        }
      }

      return {
        success: true,
        extracted: extracted.length,
        inserted,
      };
    });
  }
);
