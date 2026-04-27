import { NextResponse } from "next/server"
import { syncStripeConnectStatus } from "@/app/actions/stripe-connect"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const url = new URL(request.url)

  try {
    await syncStripeConnectStatus(id)
  } catch (err) {
    console.error("[v0] stripe-return sync failed:", err)
  }

  return NextResponse.redirect(`${url.origin}/dashboard/teams/${id}?stripe=returned`)
}
