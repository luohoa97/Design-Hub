import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const url = new URL(request.url)
  // Stripe calls this when the onboarding link expires — send the owner back
  // to the team page so they can click "Continue" and generate a fresh link.
  return NextResponse.redirect(`${url.origin}/dashboard/teams/${id}?stripe=refresh`)
}
