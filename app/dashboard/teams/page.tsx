import { DashboardShell } from "@/components/dashboard/shell"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Users, ArrowRight } from "lucide-react"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"

export default async function TeamsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Teams the user belongs to + their role
  const { data: memberships } = await supabase
    .from("team_members")
    .select("role, team:teams(id, name, description, stripe_onboarding_complete, created_at)")
    .eq("user_id", user.id)

  const teams = (memberships ?? []).map((m) => ({
    ...(Array.isArray(m.team) ? m.team[0] : m.team),
    role: m.role,
  }))

  return (
    <DashboardShell activePath="teams">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl tracking-tight text-foreground">Teams</h1>
          <p className="mt-1 text-sm text-muted-foreground">Teams own products. Connect Stripe to get paid.</p>
        </div>
        <Button asChild className="rounded-full">
          <Link href="/dashboard/teams/new">
            <Plus className="mr-1 h-4 w-4" />
            New team
          </Link>
        </Button>
      </div>

      {teams.length === 0 ? (
        <Empty className="mt-10 rounded-xl border border-dashed border-border bg-card/40 py-16">
          <EmptyHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <EmptyTitle>No teams yet</EmptyTitle>
            <EmptyDescription>Create a team so you can publish products and receive payouts.</EmptyDescription>
          </EmptyHeader>
          <Button asChild className="mt-4 rounded-full">
            <Link href="/dashboard/teams/new">Create team</Link>
          </Button>
        </Empty>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {teams.map((team) => (
            <li key={team.id}>
              <Link
                href={`/dashboard/teams/${team.id}`}
                className="flex h-full flex-col justify-between gap-4 rounded-xl border border-border/60 bg-card p-5 transition-colors hover:border-border"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-serif text-xl tracking-tight text-foreground">{team.name}</h2>
                      <p className="mt-0.5 text-xs uppercase tracking-wide text-muted-foreground">{team.role}</p>
                    </div>
                    <StripeStatus connected={team.stripe_onboarding_complete} />
                  </div>
                  {team.description && (
                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {team.description}
                    </p>
                  )}
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
                  Manage team
                  <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashboardShell>
  )
}

function StripeStatus({ connected }: { connected: boolean }) {
  if (connected) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-900">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
        Stripe connected
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
      Setup required
    </span>
  )
}
