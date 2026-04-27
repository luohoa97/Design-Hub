"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
    + "-" + Math.random().toString(36).slice(2, 7)
}

export async function createDesign(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const title = String(formData.get("title") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const category = String(formData.get("category") ?? "uncategorized").trim()
  const tagsRaw = String(formData.get("tags") ?? "").trim()
  const priceStr = String(formData.get("price") ?? "0")
  const currency = String(formData.get("currency") ?? "aud")
  const licenceType = String(formData.get("licence_type") ?? "personal")
  const licenceSummary = String(formData.get("licence_summary") ?? "").trim()
  const previewImagesRaw = String(formData.get("preview_image_urls") ?? "").trim()
  const assetUrl = String(formData.get("asset_url") ?? "").trim()
  const teamId = String(formData.get("team_id") ?? "").trim() || null
  const action = String(formData.get("action") ?? "draft")

  if (!title) throw new Error("Title is required")

  const priceCents = Math.round(Number.parseFloat(priceStr) * 100)
  if (!Number.isFinite(priceCents) || priceCents < 0) throw new Error("Invalid price")

  const tags = tagsRaw ? tagsRaw.split(",").map(t => t.trim()).filter(Boolean) : []
  const previewImageUrls = previewImagesRaw
    ? previewImagesRaw.split("\n").map(u => u.trim()).filter(Boolean)
    : []

  const slug = generateSlug(title)

  if (action === "publish" && teamId) {
    const { data: team } = await supabase
      .from("teams")
      .select("stripe_onboarding_complete")
      .eq("id", teamId)
      .single()
    if (!team?.stripe_onboarding_complete) {
      throw new Error("Connect Stripe before publishing")
    }
  }

  const { data: design, error } = await supabase
    .from("designs")
    .insert({
      creator_id: user.id,
      team_id: teamId || null,
      title,
      slug,
      description: description || null,
      category,
      tags,
      preview_image_urls: previewImageUrls,
      asset_url: assetUrl || null,
      price_cents: priceCents,
      currency,
      licence_type: licenceType,
      licence_summary: licenceSummary || null,
      status: action === "publish" ? "published" : "draft",
    })
    .select("id, slug")
    .single()

  if (error) throw new Error(error.message)

  // Ensure creator profile is marked as creator
  await supabase
    .from("profiles")
    .update({ is_creator: true })
    .eq("id", user.id)

  revalidatePath("/explore")
  revalidatePath("/dashboard/designs")
  redirect(`/dashboard/designs?created=${design.id}`)
}

export async function updateDesign(designId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const title = String(formData.get("title") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const category = String(formData.get("category") ?? "uncategorized").trim()
  const tagsRaw = String(formData.get("tags") ?? "").trim()
  const priceStr = String(formData.get("price") ?? "0")
  const licenceType = String(formData.get("licence_type") ?? "personal")
  const licenceSummary = String(formData.get("licence_summary") ?? "").trim()
  const previewImagesRaw = String(formData.get("preview_image_urls") ?? "").trim()
  const assetUrl = String(formData.get("asset_url") ?? "").trim()
  const teamId = String(formData.get("team_id") ?? "").trim() || null

  if (!title) throw new Error("Title is required")

  const priceCents = Math.round(Number.parseFloat(priceStr) * 100)
  if (!Number.isFinite(priceCents) || priceCents < 0) throw new Error("Invalid price")

  const tags = tagsRaw ? tagsRaw.split(",").map(t => t.trim()).filter(Boolean) : []
  const previewImageUrls = previewImagesRaw
    ? previewImagesRaw.split("\n").map(u => u.trim()).filter(Boolean)
    : []

  const { error } = await supabase
    .from("designs")
    .update({
      title,
      description: description || null,
      category,
      tags,
      preview_image_urls: previewImageUrls,
      asset_url: assetUrl || null,
      price_cents: priceCents,
      licence_type: licenceType,
      licence_summary: licenceSummary || null,
      team_id: teamId || null,
    })
    .eq("id", designId)
    .eq("creator_id", user.id)

  if (error) throw new Error(error.message)

  revalidatePath("/explore")
  revalidatePath("/dashboard/designs")
  redirect(`/dashboard/designs?updated=${designId}`)
}

export async function publishDesign(designId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data: design } = await supabase
    .from("designs")
    .select("team_id, team:teams(stripe_onboarding_complete)")
    .eq("id", designId)
    .eq("creator_id", user.id)
    .maybeSingle()

  if (!design) throw new Error("Design not found")

  const team = Array.isArray(design.team) ? design.team[0] : design.team
  if (design.team_id && !team?.stripe_onboarding_complete) {
    throw new Error("Connect Stripe before publishing")
  }

  const { error } = await supabase
    .from("designs")
    .update({ status: "published" })
    .eq("id", designId)
    .eq("creator_id", user.id)

  if (error) throw new Error(error.message)

  revalidatePath("/explore")
  revalidatePath("/dashboard/designs")
}

export async function unpublishDesign(designId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { error } = await supabase
    .from("designs")
    .update({ status: "draft" })
    .eq("id", designId)
    .eq("creator_id", user.id)

  if (error) throw new Error(error.message)

  revalidatePath("/explore")
  revalidatePath("/dashboard/designs")
}

export async function archiveDesign(designId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { error } = await supabase
    .from("designs")
    .update({ status: "archived" })
    .eq("id", designId)
    .eq("creator_id", user.id)

  if (error) throw new Error(error.message)

  revalidatePath("/dashboard/designs")
}

export async function toggleLike(designId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data: existing } = await supabase
    .from("design_likes")
    .select("id")
    .eq("user_id", user.id)
    .eq("design_id", designId)
    .maybeSingle()

  if (existing) {
    await supabase.from("design_likes").delete().eq("id", existing.id)
    await supabase.from("designs").update({ like_count: supabase.rpc }).eq("id", designId)
    // Decrement
    await supabase.rpc("decrement_like_count", { design_id: designId })
  } else {
    await supabase.from("design_likes").insert({ user_id: user.id, design_id: designId })
    await supabase.rpc("increment_like_count", { design_id: designId })
  }

  revalidatePath(`/designs`)
}

export async function toggleSave(designId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data: existing } = await supabase
    .from("design_saves")
    .select("id")
    .eq("user_id", user.id)
    .eq("design_id", designId)
    .maybeSingle()

  if (existing) {
    await supabase.from("design_saves").delete().eq("id", existing.id)
    await supabase.rpc("decrement_save_count", { design_id: designId })
  } else {
    await supabase.from("design_saves").insert({ user_id: user.id, design_id: designId })
    await supabase.rpc("increment_save_count", { design_id: designId })
  }

  revalidatePath(`/designs`)
}

export async function toggleFollow(creatorId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data: existing } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("creator_id", creatorId)
    .maybeSingle()

  if (existing) {
    await supabase.from("follows").delete().eq("id", existing.id)
  } else {
    await supabase.from("follows").insert({ follower_id: user.id, creator_id: creatorId })
  }

  revalidatePath(`/creators`)
}

export async function addComment(designId: string, body: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  if (!body.trim()) throw new Error("Comment cannot be empty")

  const { error } = await supabase.from("comments").insert({
    design_id: designId,
    user_id: user.id,
    body: body.trim(),
  })

  if (error) throw new Error(error.message)

  revalidatePath(`/designs`)
}

export async function reportDesign(designId: string, reason: string, details?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    design_id: designId,
    reason,
    details: details || null,
  })

  if (error) throw new Error(error.message)
}

export async function updateCreatorProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const handle = String(formData.get("handle") ?? "").trim().toLowerCase()
  const displayName = String(formData.get("display_name") ?? "").trim()
  const bio = String(formData.get("bio") ?? "").trim()
  const websiteUrl = String(formData.get("website_url") ?? "").trim()
  const instagramUrl = String(formData.get("instagram_url") ?? "").trim()
  const avatarUrl = String(formData.get("avatar_url") ?? "").trim()

  if (handle && !/^[a-z0-9_-]{2,30}$/.test(handle)) {
    throw new Error("Handle must be 2-30 characters (letters, numbers, _ or -)")
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      handle: handle || null,
      display_name: displayName || null,
      bio: bio || null,
      website_url: websiteUrl || null,
      instagram_url: instagramUrl || null,
      avatar_url: avatarUrl || null,
      is_creator: true,
    })
    .eq("id", user.id)

  if (error) {
    if (error.code === "23505") throw new Error("That handle is already taken")
    throw new Error(error.message)
  }

  revalidatePath("/dashboard/creator")
}
