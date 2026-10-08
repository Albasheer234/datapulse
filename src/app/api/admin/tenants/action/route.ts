import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/db/client";
import { tenants, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { tenantId, action } = body;

    if (!tenantId || !action) {
      return NextResponse.json(
        { error: "Missing tenantId or action" },
        { status: 400 }
      );
    }

    if (action === "revoke") {
      await db
        .update(tenants)
        .set({ isActive: false })
        .where(eq(tenants.id, tenantId));

      // Also revoke all users in tenant
      await db
        .update(users)
        .set({ isActive: false })
        .where(eq(users.tenantId, tenantId));

      return NextResponse.json({
        success: true,
        message: "Tenant and all users revoked",
      });
    }

    if (action === "activate") {
      await db
        .update(tenants)
        .set({ isActive: true })
        .where(eq(tenants.id, tenantId));

      return NextResponse.json({
        success: true,
        message: "Tenant activated",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Tenant action error:", error);
    return NextResponse.json(
      { error: "Failed to perform action" },
      { status: 500 }
    );
  }
}
