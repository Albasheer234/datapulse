import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { users, tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const { userId, orgId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch user details from Clerk to get the email address & name
  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress || "user@example.com";
  const name = clerkUser?.firstName
    ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`.trim()
    : "My Workspace";

  // Check if user exists in our DB
  let userRecord = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!userRecord.length) {
    const tenantId = orgId || `tenant-${userId}`;

    // Ensure tenant exists
    const tenantRecord = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenantRecord.length) {
      await db.insert(tenants).values({
        id: tenantId,
        name: orgId ? `Organization Workspace` : `${name}'s Workspace`,
        isActive: true,
      }).onConflictDoNothing();
    }


    // Insert user (admin check by ADMIN_EMAIL env)
    const isAdmin = email === process.env.ADMIN_EMAIL;

    await db.insert(users).values({
      id: userId,
      tenantId: tenantId,
      email: email,
      role: isAdmin ? "admin" : "user",
      isActive: true,
    }).onConflictDoNothing();

    // Re-fetch user record
    userRecord = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
  }

  const currentUserRecord = userRecord[0];

  return (
    <DashboardClient
      user={{
        id: currentUserRecord.id,
        email: currentUserRecord.email,
        role: currentUserRecord.role,
        tenantId: currentUserRecord.tenantId,
      }}
    />
  );
}

