import { DashboardShell } from "@/components/dashboard/shell"
import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle2, ExternalLink, Package, Plus, Zap } from "lucide-react"
import { formatAUD, formatDate } from "@/lib/format"
import { StripeConnectActions } from "@/components/dashboard/stripe-connect-actions"
import { syncStripeConnectStatus } from "@/app/actions/stripe-connect"

export default async function TeamDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ stripe?: string }>
}) {
  const { id } = await params
  const { stripe: stripeParam } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: team } = await supabase
    .from("teams")
    .select("id, name, description, stripe_account_id, stripe_onboarding_complete, created_at")
    .eq("id", id)
    .single()

  if (!team) notFound()

  // If user just returned from Stripe, refresh the status
  if (stripeParam === "returned" && team.stripe_account_id) {
    try {
      const { ready } = await syncStripeConnectStatus(team.id)
      if (ready !== team.stripe_onboarding_complete) {
        team.stripe_onboarding_complete = ready
      }
    } catch (err) {
      console.error("[v0] sync stripe status failed:", err)
    }
  }

  // Membership + role check
  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", team.id)
    .eq("user_id", user.id)
    .single()

  if (!membership) notFound()
  const isOwner = membership.role === "owner"

  // Team members
  const { data: members } = await supabase
    .from("team_members")
    .select("id, role, user_id, created_at")
    .eq("team_id", team.id)
    .order("created_at", { ascending: true })

  // Team products
  const { data: products } = await supabase
    .from("products")
    .select("id, name, price_cents, status, created_at")
    .eq("team_id", team.id)
    .neq("status", "archived")
    .order("created_at", { ascending: false })

  return (
    <DashboardShell activePath="teams">
      <Link
        href="/dashboard/teams"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to teams
      </Link>

      <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{membership.role}</p>
          <h1 className="mt-1 font-serif text-4xl tracking-tight text-foreground">{team.name}</h1>
          {team.description && (
            <p className="mt-3 max-w-2xl text-pretty leading-relaxed text-muted-foreground">{team.description}</p>
          )}
        </div>
      </div>

      {/* Stripe Connect section */}
      <section className="mt-10">
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
          <div className="flex items-start gap-4 p-6">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                team.stripe_onboarding_complete ? "bg-emerald-100" : "bg-accent/15"
              }`}
            >
              {team.stripe_onboarding_complete ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-700" />
              ) : (
                <Zap className="h-5 w-5 text-accent" />
              )}
            </span>
            <div className="flex-1">
              <h2 className="font-serif text-xl tracking-tight text-foreground">
                {team.stripe_onboarding_complete ? "Payouts are active" : "Connect Stripe to start publishing"}
              </h2>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
                {team.stripe_onboarding_complete
                  ? "Every sale on this team's products is paid directly by Stripe to your connected account. We take a small platform fee to keep the studio running."
                  : "Stripe pays your team directly when a product sells. Complete a quick, one-time Stripe onboarding to publish products and receive payouts."}
              </p>

              {stripeParam === "returned" && !team.stripe_onboarding_complete && (
                <p className="mt-3 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                  Stripe still needs a few more details. Click &ldquo;Continue Stripe setup&rdquo; to finish.
                </p>
              )}

              {isOwner ? (
                <div className="mt-5">
                  <StripeConnectActions
                    teamId={team.id}
                    hasAccount={!!team.stripe_account_id}
                    onboardingComplete={team.stripe_onboarding_complete}
                  />
                </div>
              ) : (
                <p className="mt-4 text-xs text-muted-foreground">
                  Only the team owner can manage Stripe setup.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl tracking-tight text-foreground">Team products</h2>
          <Button asChild size="sm" variant="ghost" className="rounded-full font-normal">
            <Link href="/dashboard/products/new">
              <Plus className="mr-1 h-3.5 w-3.5" />
              New product
            </Link>
          </Button>
        </div>

        {!products || products.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border bg-card/40 p-8 text-center">
            <Package className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No products yet for this team.</p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60 bg-card">
            {products.map((product) => (
              <li key={product.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{product.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Created {formatDate(product.created_at)}</p>
                </div>
                <StatusBadge status={product.status} />
                <span className="w-20 text-right text-sm font-medium tabular-nums">
                  {formatAUD(product.price_cents)}
                </span>
                {product.status === "published" && (
                  <Button asChild variant="ghost" size="sm" className="h-8">
                    <Link href={`/shop/${product.id}`}>
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span className="sr-only">View in shop</span>
                    </Link>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Members */}
      <section className="mt-10">
        <h2 className="font-serif text-xl tracking-tight text-foreground">Members</h2>
        <ul className="mt-4 divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60 bg-card">
          {(members ?? []).map((member) => (
            <li key={member.id} className="flex items-center justify-between gap-4 px-5 py-4 text-sm">
              <span className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {member.user_id === user.id ? "You" : member.user_id.slice(0, 2).toUpperCase()}
                </span>
                <span className="text-foreground">
                  {member.user_id === user.id ? "You" : `Member ${member.user_id.slice(0, 8)}`}
                </span>
              </span>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">{member.role}</span>
            </li>
          ))}
        </ul>
      </section>
    </DashboardShell>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    published: "bg-emerald-100 text-emerald-900",
    draft: "bg-muted text-muted-foreground",
  }
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
        styles[status] ?? ""
      }`}
    >
      {status}
    </span>
  )
}
