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

    const body = await req.json();
    const { imageBase64, imageUrl, mimeType = "image/jpeg" } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: "No image data provided" }, { status: 400 });
    }

    const scopedDb = await getScopedDb();

    // Trigger Inngest single image processing event
    await inngest.send({
      name: "app/screenshot.uploaded",
      data: {
        tenantId: (scopedDb as any).tenantId,
        userId,
        imageBase64,
        imageUrl: imageUrl || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Image queued for processing",
    });
  } catch (error) {
    console.error("Process error:", error);
    return NextResponse.json(
      { error: "Failed to queue image for processing" },
      { status: 500 }
    );
  }
}
