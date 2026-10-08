import { NextRequest, NextResponse } from "next/server";
import { getScopedDb } from "@/db/client";

export async function GET(req: NextRequest) {
  try {
    const scopedDb = await getScopedDb();
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId") || undefined;
    const isCommitted = searchParams.get("isCommitted") === "true";

    // Get dashboard stats
    const stats = await scopedDb.getDashboardStats(isCommitted, sessionId);

    // Get detailed summary by carrier and bundle size
    const summary = await scopedDb.getSummary(isCommitted, sessionId);

    // Transform into frontend-friendly format
    const carriers = ["MTN", "AIRTEL", "GLO", "9MOBILE"];
    const bundleSizes = [0.5, 1, 2, 3, 5, 10];

    const formattedSummary = carriers.map((carrier) => {
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
        bundles, // Include all bundle sizes (0.5, 1, 2, 3, 5, 10)
        totalSuccessful,
        totalFailed,
        totalTransactions: totalSuccessful + totalFailed,
      };
    });

    return NextResponse.json({
      stats,
      summary: formattedSummary.filter((s) => s.totalTransactions > 0),
      carrierBreakdown: formattedSummary,
    });
  } catch (error) {
    console.error("Summary error:", error);
    return NextResponse.json(
      { error: "Failed to fetch summary" },
      { status: 500 }
    );
  }
}
