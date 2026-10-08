import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhook(.*)",
  "/api/inngest(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  const session = await auth();
  const userId = session.userId;

  if (!userId) {
    // If it's an API route, return 401 JSON instead of an HTML redirect
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // If it's a frontend route, redirect to sign in
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // Pass default headers downstream
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-tenant-id", `tenant-${userId}`);
  requestHeaders.set("x-user-id", userId);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

