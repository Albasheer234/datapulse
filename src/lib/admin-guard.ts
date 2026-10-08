
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const userRecord = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!userRecord.length || userRecord[0].role !== "admin") {
    redirect("/dashboard");
  }

  return userRecord[0];
}
