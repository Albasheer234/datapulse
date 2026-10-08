import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { inngest } from "@/inngest/client";
import { getScopedDb } from "@/db/client";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const scopedDb = await getScopedDb();

    const formData = await req.formData();
    const files = formData.getAll("images") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    // Validate file types
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.type}. Only JPEG, PNG, WebP allowed.` },
          { status: 400 }
        );
      }
    }

    // Upload images to temporary storage (Vercel Blob or similar)
    // For this implementation, we'll use base64 for simplicity
    // In production, use Vercel Blob or Cloudflare R2
    const imageUrls: string[] = [];
    const imageBase64s: string[] = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString("base64");
      imageBase64s.push(base64);
      // In production: upload to blob storage and get URL
      imageUrls.push(`data:${file.type};base64,${base64}`);
    }

    // Create processing job record
    const jobId = uuidv4();
    await scopedDb.createJob({
      id: jobId,
      status: "pending",
      totalImages: files.length,
      imageUrls: JSON.stringify(imageUrls),
    });

    // Trigger Inngest event for batch processing
    await inngest.send({
      name: "app/screenshot.batch.uploaded",
      data: {
        jobId,
        tenantId: (scopedDb as any).tenantId,
        userId,
        imageUrls,
      },
    });

    return NextResponse.json({
      success: true,
      jobId,
      message: `${files.length} image(s) queued for processing`,
      totalImages: files.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process upload" },
      { status: 500 }
    );
  }
}
