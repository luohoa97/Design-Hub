"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createProduct(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  const name = String(formData.get("name") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const priceStr = String(formData.get("price") ?? "")
  const imageUrl = String(formData.get("image_url") ?? "").trim()
  const teamId = String(formData.get("team_id") ?? "").trim()
  const action = String(formData.get("action") ?? "draft") // "draft" | "publish"

  if (!name || !priceStr || !teamId) {
    throw new Error("Missing required fields")
  }

  const priceCents = Math.round(Number.parseFloat(priceStr) * 100)
  if (!Number.isFinite(priceCents) || priceCents <= 0) {
    throw new Error("Invalid price")
  }

  // Check team allows publishing (requires Stripe Connect complete)
  if (action === "publish") {
    const { data: team } = await supabase
      .from("teams")
      .select("stripe_onboarding_complete")
      .eq("id", teamId)
      .single()
    if (!team?.stripe_onboarding_complete) {
      throw new Error("Connect Stripe before publishing")
    }
  }

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      team_id: teamId,
      name,
      description: description || null,
      price_cents: priceCents,
      image_url: imageUrl || null,
      status: action === "publish" ? "published" : "draft",
      created_by: user.id,
    })
    .select("id")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/dashboard/products")
  revalidatePath("/shop")
  redirect(`/dashboard/products?created=${product.id}`)
}

export async function publishProduct(productId: string) {
  const supabase = await createClient()

  // Check team has Stripe Connect
  const { data: product } = await supabase
    .from("products")
    .select("team_id, team:teams(stripe_onboarding_complete)")
    .eq("id", productId)
    .single()

  const team = Array.isArray(product?.team) ? product.team[0] : product?.team
  if (!team?.stripe_onboarding_complete) {
    throw new Error("Connect Stripe before publishing")
  }

  const { error } = await supabase.from("products").update({ status: "published" }).eq("id", productId)
  if (error) throw new Error(error.message)

  revalidatePath("/dashboard/products")
  revalidatePath("/shop")
}

export async function archiveProduct(productId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("products").update({ status: "archived" }).eq("id", productId)
  if (error) throw new Error(error.message)

  revalidatePath("/dashboard/products")
  revalidatePath("/shop")
}

export async function unpublishProduct(productId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("products").update({ status: "draft" }).eq("id", productId)
  if (error) throw new Error(error.message)

  revalidatePath("/dashboard/products")
  revalidatePath("/shop")
}
