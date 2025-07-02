import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password", "/about"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes immediately without any checks
  if (PUBLIC_ROUTES.includes(pathname)) {
    const response = NextResponse.next()
    // Clear any logout flags for public routes
    response.headers.set("x-clear-logout-flags", "true")
    return response
  }

  // For protected routes, check logout flags
  const wasLoggedOut =
    request.cookies.get("wasLoggedOut")?.value === "true" || request.headers.get("x-was-logged-out") === "true"

  if (wasLoggedOut) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("session", "expired")
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|images).*)",
  ],
}
