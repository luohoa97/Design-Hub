import { DashboardShell } from "@/components/dashboard/shell"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Package } from "lucide-react"
import { formatAUD, formatDate } from "@/lib/format"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { ProductRowActions } from "@/components/dashboard/product-row-actions"

export default async function DashboardProductsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: teams } = await supabase.from("teams").select("id, name, stripe_onboarding_complete")

  const { data: products } = await supabase
    .from("products")
    .select("id, name, description, price_cents, status, created_at, team:teams(id, name, stripe_onboarding_complete)")
    .in("team_id", teams?.map((t) => t.id) ?? [])
    .neq("status", "archived")
    .order("created_at", { ascending: false })

  const hasTeams = teams && teams.length > 0

  return (
    <DashboardShell activePath="products">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl tracking-tight text-foreground">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">Everything your teams have made.</p>
        </div>
        {hasTeams && (
          <Button asChild className="rounded-full">
            <Link href="/dashboard/products/new">
              <Plus className="mr-1 h-4 w-4" />
              New product
            </Link>
          </Button>
        )}
      </div>

      {!hasTeams ? (
        <Empty className="mt-10 rounded-xl border border-dashed border-border bg-card/40 py-16">
          <EmptyHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
            <EmptyTitle>Create a team first</EmptyTitle>
            <EmptyDescription>Products are owned by teams. Start by creating one.</EmptyDescription>
          </EmptyHeader>
          <Button asChild className="mt-4 rounded-full">
            <Link href="/dashboard/teams/new">Create team</Link>
          </Button>
        </Empty>
      ) : !products || products.length === 0 ? (
        <Empty className="mt-10 rounded-xl border border-dashed border-border bg-card/40 py-16">
          <EmptyHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
            <EmptyTitle>No products yet</EmptyTitle>
            <EmptyDescription>Create your first handmade product to get started.</EmptyDescription>
          </EmptyHeader>
          <Button asChild className="mt-4 rounded-full">
            <Link href="/dashboard/products/new">Create product</Link>
          </Button>
        </Empty>
      ) : (
        <div className="mt-8 overflow-hidden rounded-xl border border-border/60 bg-card">
          <table className="w-full">
            <thead className="border-b border-border/60 bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Team</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Created</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-sm">
              {products.map((product) => {
                const team = Array.isArray(product.team) ? product.team[0] : product.team
                return (
                  <tr key={product.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-5 py-4">
                      <p className="font-medium text-foreground">{product.name}</p>
                      {product.description && (
                        <p className="mt-0.5 line-clamp-1 max-w-sm text-xs text-muted-foreground">
                          {product.description}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{team?.name}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={product.status} />
                    </td>
                    <td className="px-5 py-4 text-right font-medium tabular-nums">
                      {formatAUD(product.price_cents)}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{formatDate(product.created_at)}</td>
                    <td className="px-5 py-4 text-right">
                      <ProductRowActions
                        productId={product.id}
                        status={product.status}
                        canPublish={!!team?.stripe_onboarding_complete}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    published: "bg-emerald-100 text-emerald-900",
    draft: "bg-muted text-muted-foreground",
    archived: "bg-muted text-muted-foreground",
  }
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${styles[status] ?? ""}`}
    >
      {status}
    </span>
  )
}
