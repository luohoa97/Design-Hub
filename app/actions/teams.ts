"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createTeam(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  const name = String(formData.get("name") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()

  if (!name) {
    throw new Error("Team name is required")
  }

  // Create team
  const { data: team, error } = await supabase
    .from("teams")
    .insert({
      name,
      description: description || null,
    })
    .select("id")
    .single()

  if (error || !team) {
    throw new Error(error?.message ?? "Could not create team")
  }

  // Add current user as owner
  const { error: memberError } = await supabase.from("team_members").insert({
    team_id: team.id,
    user_id: user.id,
    role: "owner",
  })

  if (memberError) {
    throw new Error(memberError.message)
  }

  revalidatePath("/dashboard/teams")
  redirect(`/dashboard/teams/${team.id}`)
}
