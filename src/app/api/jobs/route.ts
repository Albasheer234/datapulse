import { NextRequest, NextResponse } from "next/server";
import { getScopedDb } from "@/db/client";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const scopedDb = await getScopedDb();
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");

    if (jobId) {
      // Get specific job
      const jobs = await scopedDb.getJobs();
      const job = jobs.find((j) => j.id === jobId);

      if (!job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }

      return NextResponse.json({ job });
    }

    // Get all jobs for tenant
    const jobs = await scopedDb.getJobs();
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Jobs API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const scopedDb = await getScopedDb();
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");
    const statusParam = searchParams.get("status");

    if (jobId) {
      await scopedDb.deleteJob(jobId);
      return NextResponse.json({ success: true, message: `Job ${jobId} deleted` });
    }

    let statuses = ["failed", "pending", "processing"];
    if (statusParam) {
      statuses = statusParam.split(",").map((s) => s.trim());
    }

    await scopedDb.clearJobs(statuses);
    return NextResponse.json({
      success: true,
      message: `Cleared jobs with status: ${statuses.join(", ")}`,
    });
  } catch (error) {
    console.error("Delete jobs API error:", error);
    return NextResponse.json(
      { error: "Failed to delete jobs" },
      { status: 500 }
    );
  }
}
