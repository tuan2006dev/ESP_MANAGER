import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  try {
    const { nextUrl } = req;

    const isApiRoute = nextUrl.pathname.startsWith("/api");
    const isPublicPage =
      nextUrl.pathname === "/" ||
      nextUrl.pathname === "/ranking" ||
      nextUrl.pathname.startsWith("/teams");

    // Immediately allow public pages and API routes without checking token
    if (isPublicPage || isApiRoute) {
      return NextResponse.next();
    }

    const isAuthPage =
      nextUrl.pathname.startsWith("/login") ||
      nextUrl.pathname.startsWith("/register");

    const isAdminPage = nextUrl.pathname.startsWith("/admin");
    const isCaptainPage = nextUrl.pathname.startsWith("/captain");

    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    const token = await getToken({ req, secret });
    const isLoggedIn = !!token;
    const userRole = token?.role as string | undefined;

    // Redirect logged-in users away from auth pages
    if (isLoggedIn && isAuthPage) {
      if (userRole === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", nextUrl));
      }
      if (userRole === "TEAM_CAPTAIN") {
        return NextResponse.redirect(new URL("/captain", nextUrl));
      }
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    // Redirect unauthenticated users to login
    if (!isLoggedIn && !isAuthPage) {
      return NextResponse.redirect(
        new URL(
          `/login?callbackUrl=${encodeURIComponent(nextUrl.pathname)}`,
          nextUrl
        )
      );
    }

    // Role-based access control
    if (isAdminPage && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    if (isCaptainPage && userRole !== "TEAM_CAPTAIN" && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
