import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { users, tenants } from "@/db/schema";
import { eq } from "drizzle-orm";

// ─── WEBHOOK SIGNATURE VERIFICATION ──────────────────────
// Verifies the request is genuinely from Clerk using the webhook secret.
async function verifyClerkWebhook(req: NextRequest): Promise<{
  valid: boolean;
  payload: any;
}> {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  // If no secret configured, skip verification (dev-only fallback)
  if (!webhookSecret) {
    console.warn("CLERK_WEBHOOK_SECRET not set — skipping signature verification.");
    const payload = await req.json();
    return { valid: true, payload };
  }

  // Try to use svix for signature verification if available
  try {
    const { Webhook } = await import("svix");
    const body = await req.text();
    const svixId = req.headers.get("svix-id");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixSignature = req.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return { valid: false, payload: null };
    }

    const wh = new Webhook(webhookSecret);
    const payload = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });

    return { valid: true, payload };
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return { valid: false, payload: null };
  }
}

// ─── WEBHOOK HANDLER ─────────────────────────────────────
export async function POST(req: NextRequest) {
  const { valid, payload } = await verifyClerkWebhook(req);

  if (!valid || !payload) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  const { type, data } = payload;

  try {
    // ─── USER CREATED ──────────────────────────────────
    if (type === "user.created") {
      const userId = data.id as string;
      const email =
        data.email_addresses?.[0]?.email_address || "unknown@example.com";
      const firstName = data.first_name || "";
      const lastName = data.last_name || "";
      const name = `${firstName} ${lastName}`.trim() || "My Workspace";

      // Derive tenantId — use primary org if available, else user-scoped
      const tenantId = `tenant-${userId}`;
      const isAdmin = email === process.env.ADMIN_EMAIL;

      // Ensure tenant exists
      const existingTenant = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);

      if (!existingTenant.length) {
        await db.insert(tenants).values({
          id: tenantId,
          name: `${name}'s Organization`,
          isActive: true,
        }).onConflictDoNothing();
      }

      // Insert user record
      await db.insert(users).values({
        id: userId,
        tenantId,
        email,
        role: isAdmin ? "admin" : "user",
        isActive: true,
      }).onConflictDoNothing();

      console.log(`[Webhook] Provisioned user ${email} → tenant ${tenantId}`);
      return NextResponse.json({ success: true, event: "user.created" });
    }

    // ─── USER DELETED ──────────────────────────────────
    if (type === "user.deleted") {
      const userId = data.id as string;

      await db
        .update(users)
        .set({ isActive: false })
        .where(eq(users.id, userId));

      console.log(`[Webhook] Deactivated user ${userId}`);
      return NextResponse.json({ success: true, event: "user.deleted" });
    }

    // ─── OTHER EVENTS (ignored gracefully) ────────────
    return NextResponse.json({ success: true, event: type, ignored: true });
  } catch (error) {
    console.error("[Webhook] Handler error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
