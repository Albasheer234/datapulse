import { sqliteTable, text, integer, real, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ─── TENANTS ─────────────────────────────────────────────
export const tenants = sqliteTable("tenants", {
  id: text("id").primaryKey(), // Clerk org_id
  name: text("name").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

// ─── USERS ───────────────────────────────────────────────
export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // Clerk user_id
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  email: text("email").notNull(),
  role: text("role", { enum: ["admin", "user"] }).notNull().default("user"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
}, (table) => ({
  tenantIdx: index("users_tenant_idx").on(table.tenantId),
}));

// ─── TRANSACTIONS ────────────────────────────────────────
export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  uniqueId: text("unique_id").notNull(), // Portal transaction ID (e.g., Data818395...)
  bundleSizeGb: real("bundle_size_gb").notNull(),
  priceKobo: integer("price_kobo").notNull(),
  phoneNumber: text("phone_number").notNull(),
  carrier: text("carrier", { enum: ["MTN", "AIRTEL", "GLO", "9MOBILE", "UNKNOWN"] }).notNull(),
  status: text("status", { enum: ["successful", "failed", "pending"] }).notNull(),
  transactionDate: integer("transaction_date", { mode: "timestamp_ms" }).notNull(),
  rawResponse: text("raw_response"),
  portalName: text("portal_name"),
  processedAt: integer("processed_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  imageUrl: text("image_url"), // Reference to stored screenshot
  isCommitted: integer("is_committed", { mode: "boolean" }).notNull().default(false), // Draft session vs Committed
  sessionId: text("session_id"), // Optional link to saved_sessions.id
}, (table) => ({
  tenantIdx: index("transactions_tenant_idx").on(table.tenantId),
  uniqueIdIdx: index("transactions_unique_id_idx").on(table.uniqueId),
  tenantUniqueIdx: uniqueIndex("transactions_tenant_unique_uidx").on(table.tenantId, table.uniqueId),
  dateIdx: index("transactions_date_idx").on(table.transactionDate),
  committedIdx: index("transactions_committed_idx").on(table.tenantId, table.isCommitted),
}));

// ─── PROCESSING JOBS ─────────────────────────────────────
export const processingJobs = sqliteTable("processing_jobs", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  userId: text("user_id").notNull().references(() => users.id),
  status: text("status", { enum: ["pending", "processing", "completed", "failed"] }).notNull().default("pending"),
  totalImages: integer("total_images").notNull(),
  processedImages: integer("processed_images").notNull().default(0),
  failedImages: integer("failed_images").notNull().default(0),
  extractedTransactions: integer("extracted_transactions").notNull().default(0),
  errorMessage: text("error_message"),
  imageUrls: text("image_urls").notNull(), // JSON array of image URLs
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  completedAt: integer("completed_at", { mode: "timestamp_ms" }),
}, (table) => ({
  tenantIdx: index("jobs_tenant_idx").on(table.tenantId),
  userIdx: index("jobs_user_idx").on(table.userId),
}));

// ─── SAVED SESSIONS (RECONCILIATION HISTORY) ────────────
export const savedSessions = sqliteTable("saved_sessions", {
  id: text("id").primaryKey(), // UUID
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(), // User custom session name / date title
  totalAmountKobo: integer("total_amount_kobo").notNull().default(0),
  totalTransactions: integer("total_transactions").notNull().default(0),
  successfulCount: integer("successful_count").notNull().default(0),
  failedCount: integer("failed_count").notNull().default(0),
  carrierBreakdownJson: text("carrier_breakdown_json").notNull(), // Full 0.5G-5G breakdown
  statsJson: text("stats_json").notNull(), // Summary stats
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  savedAt: integer("saved_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
}, (table) => ({
  tenantIdx: index("saved_sessions_tenant_idx").on(table.tenantId),
  savedAtIdx: index("saved_sessions_saved_at_idx").on(table.savedAt),
}));


