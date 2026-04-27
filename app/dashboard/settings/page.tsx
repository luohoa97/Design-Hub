import { DashboardShell } from "@/components/dashboard/shell"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("full_name, created_at").eq("id", user.id).single()

  return (
    <DashboardShell activePath="settings">
      <div>
        <h1 className="font-serif text-3xl tracking-tight text-foreground">Account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your personal details.</p>
      </div>

      <div className="mt-8 max-w-xl space-y-1 rounded-xl border border-border/60 bg-card p-6">
        <Row label="Name" value={profile?.full_name ?? "Not set"} />
        <Row label="Email" value={user.email ?? ""} />
        <Row label="User ID" value={user.id} mono />
        <Row
          label="Joined"
          value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-AU") : "Today"}
        />
      </div>
    </DashboardShell>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0 [&+*]:border-t [&+*]:border-border/60">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm text-foreground ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  )
}
