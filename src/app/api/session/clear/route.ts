import { NextRequest, NextResponse } from "next/server";
import { getScopedDb } from "@/db/client";

export async function POST(req: NextRequest) {
  try {
    const scopedDb = await getScopedDb();
    await scopedDb.clearActiveSession();

    return NextResponse.json({
      success: true,
      message: "Active dashboard session cleared. Ready for fresh calculation.",
    });
  } catch (error: any) {
    console.error("Clear session error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to clear session" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  return POST(req);
}
