import { DashboardShell } from "@/components/dashboard/shell"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Package, Users, Plus, ArrowRight, AlertCircle } from "lucide-react"
import { formatAUD } from "@/lib/format"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Get teams
  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, stripe_onboarding_complete")
    .order("created_at", { ascending: true })

  // Get products
  const { data: products } = await supabase
    .from("products")
    .select("id, name, price_cents, status, team:teams(name)")
    .in("team_id", teams?.map((t) => t.id) ?? [])
    .order("created_at", { ascending: false })
    .limit(5)

  const publishedCount = products?.filter((p) => p.status === "published").length ?? 0
  const draftCount = products?.filter((p) => p.status === "draft").length ?? 0
  const teamsNeedingConnect = (teams ?? []).filter((t) => !t.stripe_onboarding_complete)

  return (
    <DashboardShell activePath="overview">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl tracking-tight text-foreground">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Here&apos;s a quick look at your studio.</p>
        </div>
        <Button asChild className="rounded-full">
          <Link href="/dashboard/products/new">
            <Plus className="mr-1 h-4 w-4" />
            New product
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Teams" value={teams?.length ?? 0} icon={Users} href="/dashboard/teams" />
        <StatCard label="Published" value={publishedCount} icon={Package} href="/dashboard/products" />
        <StatCard label="Drafts" value={draftCount} icon={Package} href="/dashboard/products" />
      </div>

      {/* Stripe Connect notice */}
      {teamsNeedingConnect.length > 0 && (
        <div className="mt-8 flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/5 p-5">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-medium text-foreground">
              {teamsNeedingConnect.length === 1
                ? `${teamsNeedingConnect[0].name} needs to connect Stripe`
                : `${teamsNeedingConnect.length} teams need to connect Stripe`}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Connect a Stripe account to publish products and receive payments directly.
            </p>
            <Button asChild variant="ghost" className="mt-3 h-8 rounded-full px-3 text-xs font-normal">
              <Link href="/dashboard/teams">
                Set up payouts
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Recent products */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl tracking-tight text-foreground">Recent products</h2>
          <Link
            href="/dashboard/products"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            View all
          </Link>
        </div>

        {!products || products.length === 0 ? (
          <Empty className="mt-4 rounded-xl border border-dashed border-border bg-card/40 py-12">
            <EmptyHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
              <EmptyTitle>No products yet</EmptyTitle>
              <EmptyDescription>
                {teams && teams.length > 0
                  ? "Create your first product to start selling."
                  : "Start by creating a team to group your products."}
              </EmptyDescription>
            </EmptyHeader>
            <Button asChild className="mt-4 rounded-full">
              <Link href={teams && teams.length > 0 ? "/dashboard/products/new" : "/dashboard/teams/new"}>
                {teams && teams.length > 0 ? "Create product" : "Create team"}
              </Link>
            </Button>
          </Empty>
        ) : (
          <ul className="mt-4 divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60 bg-card">
            {products.map((product) => {
              const team = Array.isArray(product.team) ? product.team[0] : product.team
              return (
                <li key={product.id}>
                  <Link
                    href="/dashboard/products"
                    className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{product.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{team?.name}</p>
                    </div>
                    <StatusBadge status={product.status} />
                    <span className="w-20 text-right text-sm font-medium tabular-nums">
                      {formatAUD(product.price_cents)}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </DashboardShell>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  href,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  href: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-xl border border-border/60 bg-card p-5 transition-colors hover:border-border"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-5 w-5 text-foreground" />
      </span>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-0.5 font-serif text-2xl tabular-nums text-foreground">{value}</p>
      </div>
    </Link>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    published: "bg-emerald-100 text-emerald-900",
    draft: "bg-muted text-muted-foreground",
    archived: "bg-muted text-muted-foreground line-through",
  }
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${styles[status] ?? ""}`}>
      {status}
    </span>
  )
}
