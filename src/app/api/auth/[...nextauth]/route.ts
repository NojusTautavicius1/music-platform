import { handlers } from "@/lib/auth"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET(req: Request) {
  try {
    return await handlers.GET(req)
  } catch (err) {
    console.error("[AUTH GET]", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    return await handlers.POST(req)
  } catch (err) {
    console.error("[AUTH POST]", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
