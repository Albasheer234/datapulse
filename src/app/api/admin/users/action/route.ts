import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { userId, action, role } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { error: "Missing userId or action" },
        { status: 400 }
      );
    }

    if (action === "revoke") {
      await db
        .update(users)
        .set({ isActive: false })
        .where(eq(users.id, userId));

      return NextResponse.json({
        success: true,
        message: "User revoked",
      });
    }

    if (action === "activate") {
      await db
        .update(users)
        .set({ isActive: true })
        .where(eq(users.id, userId));

      return NextResponse.json({
        success: true,
        message: "User activated",
      });
    }

    if (action === "changeRole" && role) {
      await db
        .update(users)
        .set({ role })
        .where(eq(users.id, userId));

      return NextResponse.json({
        success: true,
        message: `User role changed to ${role}`,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("User action error:", error);
    return NextResponse.json(
      { error: "Failed to perform action" },
      { status: 500 }
    );
  }
}
