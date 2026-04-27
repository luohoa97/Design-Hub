"use server"

import { getStripe, calcFees } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export async function createDesignCheckout(designId: string) {
  const supabase = await createClient()

  const { data: design, error } = await supabase
    .from("designs")
    .select("id, slug, title, description, price_cents, currency, licence_type, creator_id, team_id, status, team:teams(id, name, stripe_account_id, stripe_onboarding_complete)")
    .eq("id", designId)
    .eq("status", "published")
    .maybeSingle()

  if (error || !design) throw new Error("Design not found or not available")

  const team = Array.isArray(design.team) ? design.team[0] : design.team

  if (!team?.stripe_account_id || !team?.stripe_onboarding_complete) {
    throw new Error("This creator has not completed payment setup")
  }

  const headersList = await headers()
  const host = headersList.get("host")
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
  const origin = `${protocol}://${host}`

  const { platformFeeCents, creatorAmountCents, impactAllocationCents } = calcFees(design.price_cents)

  // Get buyer info
  const { data: { user } } = await supabase.auth.getUser()

  const stripe = getStripe()

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: design.currency ?? "aud",
          product_data: {
            name: design.title,
            description: design.description ?? undefined,
          },
          unit_amount: design.price_cents,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: platformFeeCents,
      transfer_data: {
        destination: team.stripe_account_id,
      },
    },
    metadata: {
      design_id: design.id,
      creator_id: design.creator_id,
      team_id: team.id ?? "",
      buyer_id: user?.id ?? "",
      licence_type: design.licence_type,
      platform_fee_cents: String(platformFeeCents),
      creator_amount_cents: String(creatorAmountCents),
      impact_allocation_cents: String(impactAllocationCents),
    },
    success_url: `${origin}/library?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/designs/${design.slug}`,
  })

  if (!session.url) throw new Error("Failed to create checkout session")

  // Create a pending purchase record for tracking
  await supabase.from("purchases").insert({
    buyer_id: user?.id ?? null,
    design_id: design.id,
    creator_id: design.creator_id,
    team_id: design.team_id ?? null,
    stripe_checkout_session_id: session.id,
    amount_cents: design.price_cents,
    platform_fee_cents: platformFeeCents,
    creator_amount_cents: creatorAmountCents,
    impact_allocation_cents: impactAllocationCents,
    currency: design.currency ?? "aud",
    licence_type: design.licence_type,
    status: "pending",
  })

  redirect(session.url)
}
