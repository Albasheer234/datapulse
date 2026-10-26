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

    // Validate file types (flexible for mobile browsers)
    const isImageFile = (file: File) => {
      const type = file.type?.toLowerCase() || "";
      const name = file.name?.toLowerCase() || "";
      return (
        type.startsWith("image/") ||
        /\.(jpe?g|png|webp|heic|heif|bmp)$/i.test(name)
      );
    };

    for (const file of files) {
      if (!isImageFile(file)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.type || file.name}. Please upload an image.` },
          { status: 400 }
        );
      }
    }

    // Convert images to base64 data URLs for database storage
    const imageUrls: string[] = [];
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString("base64");
      const mime = file.type && file.type.startsWith("image/") ? file.type : "image/jpeg";
      imageUrls.push(`data:${mime};base64,${base64}`);
    }

    // Create processing job record in database
    const jobId = uuidv4();
    await scopedDb.createJob({
      id: jobId,
      status: "pending",
      totalImages: files.length,
      imageUrls: JSON.stringify(imageUrls),
    });

    // Trigger Inngest event for batch processing.
    // NOTE: We do NOT pass the massive base64 array in the Inngest event payload
    // because Inngest has a strict 512KB event size limit. The worker fetches
    // the imageUrls directly from the database record using jobId.
    try {
      await inngest.send({
        name: "app/screenshot.batch.uploaded",
        data: {
          jobId,
          tenantId: (scopedDb as any).tenantId,
          userId,
        },
      });
    } catch (inngestError) {
      console.error("Inngest dispatch warning:", inngestError);
      // Non-fatal: Job is created and recorded in DB
    }

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
