"use server"

import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

async function getOrigin() {
  const headersList = await headers()
  const host = headersList.get("host")
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
  return `${protocol}://${host}`
}

/**
 * Creates (or reuses) a Stripe Express connected account for the team and
 * returns an Account Link the owner can use to complete onboarding.
 */
export async function startStripeConnect(teamId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  // Verify owner membership
  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .single()

  if (!membership || membership.role !== "owner") {
    throw new Error("Only team owners can connect Stripe")
  }

  // Load team
  const { data: team } = await supabase.from("teams").select("id, name, stripe_account_id").eq("id", teamId).single()

  if (!team) throw new Error("Team not found")

  let accountId = team.stripe_account_id

  // Create account if missing
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "AU",
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        name: team.name,
        product_description: "Handmade products designed by young Australian creators",
      },
      metadata: {
        team_id: team.id,
      },
    })

    accountId = account.id

    const { error: updateError } = await supabase
      .from("teams")
      .update({ stripe_account_id: accountId })
      .eq("id", team.id)

    if (updateError) throw new Error(updateError.message)
  }

  const origin = await getOrigin()

  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/dashboard/teams/${teamId}/stripe-refresh`,
    return_url: `${origin}/dashboard/teams/${teamId}/stripe-return`,
    type: "account_onboarding",
  })

  redirect(link.url)
}

/**
 * Refreshes the onboarding status of a team by reading the live Stripe account
 * and writing the result back to Supabase.
 */
export async function syncStripeConnectStatus(teamId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data: team } = await supabase
    .from("teams")
    .select("id, stripe_account_id")
    .eq("id", teamId)
    .single()

  if (!team?.stripe_account_id) {
    return { ready: false }
  }

  const account = await stripe.accounts.retrieve(team.stripe_account_id)
  const ready = account.details_submitted && account.charges_enabled && account.payouts_enabled

  const { error } = await supabase
    .from("teams")
    .update({ stripe_onboarding_complete: ready })
    .eq("id", teamId)

  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/teams/${teamId}`)
  revalidatePath("/dashboard/teams")
  revalidatePath("/dashboard")

  return { ready }
}

/**
 * Creates a one-time Express dashboard login link so a team owner can view
 * earnings and payouts inside Stripe.
 */
export async function createStripeDashboardLink(teamId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data: team } = await supabase
    .from("teams")
    .select("stripe_account_id")
    .eq("id", teamId)
    .single()

  if (!team?.stripe_account_id) {
    throw new Error("Stripe not connected for this team")
  }

  const link = await stripe.accounts.createLoginLink(team.stripe_account_id)
  redirect(link.url)
}
