import { NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get("stripe-signature")

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
  }

  const stripe = getStripe()
  let event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 })
  }

  // Use service role client to bypass RLS for webhook writes
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  if (event.type === "checkout.session.completed") {
    const session = event.data.object

    // Idempotency: check if already processed
    const { data: existing } = await supabase
      .from("purchases")
      .select("id, status")
      .eq("stripe_checkout_session_id", session.id)
      .maybeSingle()

    if (existing?.status === "completed") {
      return NextResponse.json({ received: true })
    }

    const meta = session.metadata ?? {}
    const designId = meta.design_id
    const creatorId = meta.creator_id
    const teamId = meta.team_id || null
    const buyerId = meta.buyer_id || null
    const licenceType = meta.licence_type || "personal"
    const platformFeeCents = parseInt(meta.platform_fee_cents || "0", 10)
    const creatorAmountCents = parseInt(meta.creator_amount_cents || "0", 10)
    const impactAllocationCents = parseInt(meta.impact_allocation_cents || "0", 10)
    const amountTotal = session.amount_total ?? 0
    const currency = session.currency ?? "aud"
    const paymentIntentId = typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null

    if (existing) {
      // Update existing pending purchase
      await supabase
        .from("purchases")
        .update({
          status: "completed",
          purchased_at: new Date().toISOString(),
          stripe_payment_intent_id: paymentIntentId,
          platform_fee_cents: platformFeeCents,
          creator_amount_cents: creatorAmountCents,
          impact_allocation_cents: impactAllocationCents,
        })
        .eq("id", existing.id)

      // Create impact allocation ledger entry
      await supabase.from("impact_allocations").insert({
        purchase_id: existing.id,
        amount_cents: impactAllocationCents,
        currency,
        cause: "young_designers_africa",
        status: "allocated",
      })

      // Increment design purchase_count
      await supabase.rpc("increment_purchase_count", { design_id: designId })
    } else {
      // Insert new completed purchase (edge case: webhook before action completes)
      const { data: purchase } = await supabase
        .from("purchases")
        .insert({
          buyer_id: buyerId,
          design_id: designId,
          creator_id: creatorId,
          team_id: teamId,
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: paymentIntentId,
          amount_cents: amountTotal,
          platform_fee_cents: platformFeeCents,
          creator_amount_cents: creatorAmountCents,
          impact_allocation_cents: impactAllocationCents,
          currency,
          licence_type: licenceType,
          status: "completed",
          purchased_at: new Date().toISOString(),
        })
        .select("id")
        .single()

      if (purchase) {
        await supabase.from("impact_allocations").insert({
          purchase_id: purchase.id,
          amount_cents: impactAllocationCents,
          currency,
          cause: "young_designers_africa",
          status: "allocated",
        })

        await supabase.rpc("increment_purchase_count", { design_id: designId })
      }
    }
  }

  return NextResponse.json({ received: true })
}
