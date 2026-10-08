import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/db/client";
import { tenants, users, transactions } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    await requireAdmin();

    const allTenants = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        isActive: tenants.isActive,
        createdAt: tenants.createdAt,
        userCount: sql<number>`(SELECT COUNT(*) FROM ${users} WHERE ${users.tenantId} = ${tenants.id})`,
        transactionCount: sql<number>`(SELECT COUNT(*) FROM ${transactions} WHERE ${transactions.tenantId} = ${tenants.id})`,
      })
      .from(tenants)
      .orderBy(sql`${tenants.createdAt} DESC`);

    return NextResponse.json({ tenants: allTenants });
  } catch (error) {
    console.error("Admin tenants error:", error);
    return NextResponse.json(
      { error: "Unauthorized or internal error" },
      { status: 403 }
    );
  }
}
