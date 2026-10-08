import { NextRequest, NextResponse } from "next/server";
import { getScopedDb } from "@/db/client";

export async function GET(req: NextRequest) {
  try {
    const scopedDb = await getScopedDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const session = await scopedDb.getSavedSession(id);
      if (!session) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }
      return NextResponse.json({ session });
    }

    const sessions = await scopedDb.getSavedSessions();
    return NextResponse.json({ sessions });
  } catch (error: any) {
    console.error("Fetch session history error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch session history" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const scopedDb = await getScopedDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    await scopedDb.deleteSavedSession(id);
    return NextResponse.json({ success: true, message: "Saved session deleted" });
  } catch (error: any) {
    console.error("Delete session history error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete saved session" },
      { status: 500 }
    );
  }
}
