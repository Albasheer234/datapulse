import { NextRequest, NextResponse } from "next/server";
import { getScopedDb } from "@/db/client";

export async function GET(req: NextRequest) {
  try {
    const scopedDb = await getScopedDb();

    const { searchParams } = new URL(req.url);
    const carrier = searchParams.get("carrier");
    const status = searchParams.get("status");
    const bundleSize = searchParams.get("bundleSize");
    const sessionId = searchParams.get("sessionId");
    const isCommitted = searchParams.get("isCommitted");

    const filters: any = {};
    if (carrier) filters.carrier = carrier;
    if (status) filters.status = status;
    if (bundleSize) filters.bundleSize = parseFloat(bundleSize);
    if (sessionId) filters.sessionId = sessionId;
    if (isCommitted !== null) filters.isCommitted = isCommitted === "true";

    const transactions = await scopedDb.getTransactions(filters);

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("Transactions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
