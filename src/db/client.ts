import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Convert libsql:// → https:// so the HTTP client is used instead of the
// WebSocket/migration-jobs client, which fails with 400 on free Turso plans.
const rawUrl = process.env.TURSO_DATABASE_URL || "file:local.db";
const dbUrl = rawUrl.startsWith("libsql://")
  ? rawUrl.replace("libsql://", "https://")
  : rawUrl;
const dbToken = process.env.TURSO_AUTH_TOKEN;

export const rawClient = createClient({
  url: dbUrl,
  authToken: dbToken,
});

export const db = drizzle(rawClient, { schema });


// ─── SCOPED DB CLIENT ────────────────────────────────────
// This is the ONLY way to query the database in API routes.
// It automatically injects tenant_id into every query.

import { eq, and, sql, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export class ScopedDbClient {
  private tenantId: string;
  private userId: string;
  private userRole: string;

  constructor(tenantId: string, userId: string, userRole: string = "user") {
    this.tenantId = tenantId;
    this.userId = userId;
    this.userRole = userRole;
  }

  // ─── TRANSACTIONS ──────────────────────────────────────
  async getTransactions(filters?: {
    carrier?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    bundleSize?: number;
    isCommitted?: boolean;
    sessionId?: string;
  }) {
    const conditions = [eq(schema.transactions.tenantId, this.tenantId)];

    // Default to uncommitted (live draft session) unless specified
    if (filters?.isCommitted !== undefined) {
      conditions.push(eq(schema.transactions.isCommitted, filters.isCommitted));
    } else if (filters?.sessionId) {
      conditions.push(eq(schema.transactions.sessionId, filters.sessionId));
    } else {
      conditions.push(eq(schema.transactions.isCommitted, false));
    }

    if (filters?.carrier) {
      conditions.push(eq(schema.transactions.carrier, filters.carrier as any));
    }
    if (filters?.status) {
      conditions.push(eq(schema.transactions.status, filters.status as any));
    }
    if (filters?.bundleSize !== undefined) {
      conditions.push(eq(schema.transactions.bundleSizeGb, filters.bundleSize));
    }
    if (filters?.startDate) {
      conditions.push(
        sql`${schema.transactions.transactionDate} >= ${filters.startDate.getTime()}`
      );
    }
    if (filters?.endDate) {
      conditions.push(
        sql`${schema.transactions.transactionDate} <= ${filters.endDate.getTime()}`
      );
    }

    return db
      .select()
      .from(schema.transactions)
      .where(and(...conditions))
      .orderBy(sql`${schema.transactions.transactionDate} DESC`);
  }

  async insertTransaction(data: typeof schema.transactions.$inferInsert) {
    // ENFORCE tenant scoping
    return db
      .insert(schema.transactions)
      .values({
        ...data,
        tenantId: this.tenantId, // CANNOT be overridden
        isCommitted: data.isCommitted ?? false,
      })
      .onConflictDoNothing()
      .returning();
  }

  async getSummary(isCommitted: boolean = false, sessionId?: string) {
    // Aggregate by carrier + bundle size + status
    const conditions = [eq(schema.transactions.tenantId, this.tenantId)];
    if (sessionId) {
      conditions.push(eq(schema.transactions.sessionId, sessionId));
    } else {
      conditions.push(eq(schema.transactions.isCommitted, isCommitted));
    }

    const result = await db
      .select({
        carrier: schema.transactions.carrier,
        bundleSizeGb: schema.transactions.bundleSizeGb,
        status: schema.transactions.status,
        count: sql<number>`COUNT(*)`,
        totalAmount: sql<number>`SUM(${schema.transactions.priceKobo})`,
      })
      .from(schema.transactions)
      .where(and(...conditions))
      .groupBy(
        schema.transactions.carrier,
        schema.transactions.bundleSizeGb,
        schema.transactions.status
      );

    return result;
  }

  async getDashboardStats(isCommitted: boolean = false, sessionId?: string) {
    const baseConditions = [eq(schema.transactions.tenantId, this.tenantId)];
    if (sessionId) {
      baseConditions.push(eq(schema.transactions.sessionId, sessionId));
    } else {
      baseConditions.push(eq(schema.transactions.isCommitted, isCommitted));
    }

    const [totalTxns, successfulTxns, failedTxns, totalAmount] = await Promise.all([
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(schema.transactions)
        .where(and(...baseConditions)),
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(schema.transactions)
        .where(
          and(
            ...baseConditions,
            eq(schema.transactions.status, "successful")
          )
        ),
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(schema.transactions)
        .where(
          and(
            ...baseConditions,
            eq(schema.transactions.status, "failed")
          )
        ),
      db
        .select({ total: sql<number>`SUM(${schema.transactions.priceKobo})` })
        .from(schema.transactions)
        .where(and(...baseConditions)),
    ]);

    return {
      totalTransactions: totalTxns[0]?.count ?? 0,
      successful: successfulTxns[0]?.count ?? 0,
      failed: failedTxns[0]?.count ?? 0,
      totalAmountKobo: totalAmount[0]?.total ?? 0,
    };
  }

  // ─── SESSIONS & COMMITS ──────────────────────────────────
  async saveActiveSession(sessionName?: string, carrierBreakdown?: any, customStats?: any) {
    const stats = customStats || (await this.getDashboardStats(false));
    const summary = await this.getSummary(false);

    // Format carrier breakdown if not provided
    const carriers = ["MTN", "AIRTEL", "GLO", "9MOBILE"];
    const bundleSizes = [0.5, 1, 2, 3, 5, 10];

    const formattedBreakdown = carrierBreakdown || carriers.map((carrier) => {
      const carrierData = summary.filter((s) => s.carrier === carrier);
      const bundles = bundleSizes.map((size) => {
        const successCount =
          carrierData.find(
            (d) => d.bundleSizeGb === size && d.status === "successful"
          )?.count || 0;
        const failedCount =
          carrierData.find(
            (d) => d.bundleSizeGb === size && d.status === "failed"
          )?.count || 0;

        return {
          size: `${size}GB`,
          sizeValue: size,
          successful: successCount,
          failed: failedCount,
          total: successCount + failedCount,
        };
      });

      const totalSuccessful = bundles.reduce((sum, b) => sum + b.successful, 0);
      const totalFailed = bundles.reduce((sum, b) => sum + b.failed, 0);

      return {
        carrier,
        bundles,
        totalSuccessful,
        totalFailed,
        totalTransactions: totalSuccessful + totalFailed,
      };
    });

    const sessionId = uuidv4();
    const defaultTitle = `Session ${new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}`;

    const newSession = {
      id: sessionId,
      tenantId: this.tenantId,
      userId: this.userId,
      name: sessionName?.trim() || defaultTitle,
      totalAmountKobo: stats.totalAmountKobo || 0,
      totalTransactions: stats.totalTransactions || 0,
      successfulCount: stats.successful || 0,
      failedCount: stats.failed || 0,
      carrierBreakdownJson: JSON.stringify(formattedBreakdown),
      statsJson: JSON.stringify(stats),
      createdAt: new Date(),
      savedAt: new Date(),
    };

    // 1. Insert saved session
    await db.insert(schema.savedSessions).values(newSession);

    // 2. Mark active draft transactions as committed and link to session
    await db
      .update(schema.transactions)
      .set({
        isCommitted: true,
        sessionId: sessionId,
      })
      .where(
        and(
          eq(schema.transactions.tenantId, this.tenantId),
          eq(schema.transactions.isCommitted, false)
        )
      );

    // 3. Clear pending/completed jobs from active queue
    await this.clearJobs(["completed", "failed", "pending", "processing"]);

    return newSession;
  }

  async clearActiveSession() {
    // 1. Delete all uncommitted draft transactions
    await db
      .delete(schema.transactions)
      .where(
        and(
          eq(schema.transactions.tenantId, this.tenantId),
          eq(schema.transactions.isCommitted, false)
        )
      );

    // 2. Delete all active batch jobs for this tenant
    await this.clearJobs(["completed", "failed", "pending", "processing"]);

    return { success: true };
  }

  async getSavedSessions() {
    return db
      .select()
      .from(schema.savedSessions)
      .where(eq(schema.savedSessions.tenantId, this.tenantId))
      .orderBy(desc(schema.savedSessions.savedAt));
  }

  async getSavedSession(id: string) {
    const records = await db
      .select()
      .from(schema.savedSessions)
      .where(
        and(
          eq(schema.savedSessions.id, id),
          eq(schema.savedSessions.tenantId, this.tenantId)
        )
      );
    return records[0] || null;
  }

  async deleteSavedSession(id: string) {
    // Delete associated transactions
    await db
      .delete(schema.transactions)
      .where(
        and(
          eq(schema.transactions.tenantId, this.tenantId),
          eq(schema.transactions.sessionId, id)
        )
      );

    // Delete session record
    return db
      .delete(schema.savedSessions)
      .where(
        and(
          eq(schema.savedSessions.id, id),
          eq(schema.savedSessions.tenantId, this.tenantId)
        )
      );
  }

  // ─── JOBS ────────────────────────────────────────────────
  async createJob(data: Omit<typeof schema.processingJobs.$inferInsert, "tenantId" | "userId">) {
    return db
      .insert(schema.processingJobs)
      .values({
        ...data,
        tenantId: this.tenantId,
        userId: this.userId,
      })
      .returning();
  }

  async getJobs() {
    return db
      .select()
      .from(schema.processingJobs)
      .where(eq(schema.processingJobs.tenantId, this.tenantId))
      .orderBy(sql`${schema.processingJobs.createdAt} DESC`);
  }

  async updateJobStatus(
    jobId: string,
    updates: Partial<typeof schema.processingJobs.$inferInsert>
  ) {
    return db
      .update(schema.processingJobs)
      .set(updates)
      .where(
        and(
          eq(schema.processingJobs.id, jobId),
          eq(schema.processingJobs.tenantId, this.tenantId)
        )
      );
  }

  async deleteJob(jobId: string) {
    return db
      .delete(schema.processingJobs)
      .where(
        and(
          eq(schema.processingJobs.id, jobId),
          eq(schema.processingJobs.tenantId, this.tenantId)
        )
      );
  }

  async clearJobs(statuses: string[] = ["failed", "pending", "processing"]) {
    const statusConditions = statuses.map((s) => eq(schema.processingJobs.status, s as any));
    const statusClause = statusConditions.length === 1 
      ? statusConditions[0] 
      : sql`(${schema.processingJobs.status} IN (${sql.join(statuses.map((s) => sql`${s}`), sql`, `)}))`;

    return db
      .delete(schema.processingJobs)
      .where(
        and(
          eq(schema.processingJobs.tenantId, this.tenantId),
          statusClause
        )
      );
  }

  // ─── ADMIN ONLY ──────────────────────────────────────
  async getAllTenants() {
    if (this.userRole !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }
    return db.select().from(schema.tenants);
  }

  async revokeTenant(tenantId: string) {
    if (this.userRole !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }
    return db
      .update(schema.tenants)
      .set({ isActive: false })
      .where(eq(schema.tenants.id, tenantId));
  }
}

// Helper to create scoped client from auth context
import { auth } from "@clerk/nextjs/server";

export async function getScopedDb() {
  const session = await auth();
  if (!session.userId) {
    throw new Error("Unauthorized");
  }

  const userId = session.userId;
  // tenantId is tied to the user (solo reseller model = 1 user per tenant)
  const tenantId = `tenant-${userId}`;

  // Auto-register tenant if it doesn't exist yet
  await db
    .insert(schema.tenants)
    .values({
      id: tenantId,
      name: `Tenant for ${userId}`,
      isActive: true,
    })
    .onConflictDoNothing();

  // Auto-register user if they don't exist yet
  await db
    .insert(schema.users)
    .values({
      id: userId,
      tenantId,
      email: session.sessionClaims?.email as string ?? "",
      role: "admin",
      isActive: true,
    })
    .onConflictDoNothing();

  return new ScopedDbClient(tenantId, userId, "admin");
}
