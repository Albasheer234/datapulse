import { NextRequest, NextResponse } from "next/server";
import { getScopedDb } from "@/db/client";

export async function POST(req: NextRequest) {
  try {
    const scopedDb = await getScopedDb();
    const body = await req.json().catch(() => ({}));
    const { name, carrierBreakdown, stats } = body;

    const saved = await scopedDb.saveActiveSession(name, carrierBreakdown, stats);

    return NextResponse.json({
      success: true,
      message: `Session "${saved.name}" successfully saved to database!`,
      session: saved,
    });
  } catch (error: any) {
    console.error("Save session error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to save session" },
      { status: 500 }
    );
  }
}
