import { NextResponse } from "next/server"

export async function GET() {
  try {
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || "sellah-zgqvh"
    return NextResponse.json({ tenantId })
  } catch (error) {
    console.error("Error providing tenant ID:", error)
    return NextResponse.json({ error: "Failed to provide tenant ID" }, { status: 500 })
  }
}
