import NextAuth from "next-auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { authConfig } from "./auth.config"

const { auth } = NextAuth(authConfig)

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/verify-request",
  "/error",
  "/about",
  "/terms",
  "/privacy",
  "/browse",
  "/search",
]

const PUBLIC_PREFIXES = [
  "/p/",
  "/search/",
  "/api/auth/",
  "/api/og",
  "/_next/",
]

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export default auth((req: NextRequest & { auth: unknown }) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!(req as { auth?: { user?: unknown } }).auth?.user

  if (isLoggedIn && pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.nextUrl))
  }

  if (!isLoggedIn && !isPublic(pathname)) {
    const loginUrl = new URL("/login", req.nextUrl)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:ico|png|jpg|jpeg|svg|webp|woff2?|css|js)).*)"],
}
