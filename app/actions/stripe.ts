"use server"

import { stripe, PLATFORM_FEE_PERCENT } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export async function createCheckoutSession(productId: string) {
  const supabase = await createClient()

  // Fetch product with team information
  const { data: product, error } = await supabase
    .from("products")
    .select("id, name, description, price_cents, status, team:teams(id, name, stripe_account_id, stripe_onboarding_complete)")
    .eq("id", productId)
    .eq("status", "published")
    .single()

  if (error || !product) {
    throw new Error("Product not found or not available")
  }

  // Handle array vs single team (Supabase sometimes returns as array)
  const team = Array.isArray(product.team) ? product.team[0] : product.team

  if (!team?.stripe_account_id || !team?.stripe_onboarding_complete) {
    throw new Error("This team has not completed payment setup")
  }

  const headersList = await headers()
  const host = headersList.get("host")
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
  const origin = `${protocol}://${host}`

  // Calculate platform application fee
  const applicationFeeAmount = Math.round(product.price_cents * PLATFORM_FEE_PERCENT)

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "aud",
          product_data: {
            name: product.name,
            description: product.description ?? undefined,
          },
          unit_amount: product.price_cents,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: applicationFeeAmount,
      transfer_data: {
        destination: team.stripe_account_id,
      },
    },
    metadata: {
      product_id: product.id,
      team_id: team.id,
    },
    success_url: `${origin}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/shop/${product.id}`,
  })

  if (!session.url) {
    throw new Error("Failed to create checkout session")
  }

  redirect(session.url)
}
