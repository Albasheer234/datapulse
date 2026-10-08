import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/db/client";
import { users, tenants } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    await requireAdmin();

    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        tenantId: users.tenantId,
        tenantName: tenants.name,
        createdAt: users.createdAt,
      })
      .from(users)
      .leftJoin(tenants, eq(users.tenantId, tenants.id))
      .orderBy(sql`${users.createdAt} DESC`);

    return NextResponse.json({ users: allUsers });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json(
      { error: "Unauthorized or internal error" },
      { status: 403 }
    );
  }
}
