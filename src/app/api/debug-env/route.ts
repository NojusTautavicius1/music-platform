import { NextResponse } from "next/server"

export const runtime = "nodejs"

export function GET() {
  return NextResponse.json({
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL ?? null,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? null,
    DATABASE_URL: !!process.env.DATABASE_URL,
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM ?? null,
    NODE_ENV: process.env.NODE_ENV,
  })
}
