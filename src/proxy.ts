import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken } from "@/lib/auth"

// Next.js 16 uses proxy.ts (renamed from middleware.ts)
// This file is the route protection middleware.
export function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value
  const { pathname } = request.nextUrl

  const isApiRoute = pathname.startsWith("/api/")
  const isAdminRoute = pathname.startsWith("/admin")
  const isDashboardRoute = pathname.startsWith("/dashboard")

  if (!token && (isDashboardRoute || isAdminRoute)) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (token) {
    const payload = verifyToken(token)
    if (!payload) {
      if (isApiRoute) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 })
      }
      return NextResponse.redirect(new URL("/login", request.url))
    }

    if (isAdminRoute && payload.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
}
