import { createClient } from "@/lib/supabase/server"
import { SiteNav } from "@/components/site-nav"
import { SiteFooter } from "@/components/site-footer"
import { ProductCard } from "@/components/product-card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Package } from "lucide-react"

export const metadata = {
  title: "Shop — Atelier Junior",
  description: "Handmade products designed by young Australian creators.",
}

export default async function ShopPage() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from("products")
    .select("id, name, price_cents, image_url, team:teams(name)")
    .eq("status", "published")
    .order("created_at", { ascending: false })

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteNav />

      <main className="flex-1">
        <div className="border-b border-border/60">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">The Shop</span>
            <h1 className="mt-3 font-serif text-4xl tracking-tight text-balance text-foreground sm:text-5xl">
              Handmade by young designers.
            </h1>
            <p className="mt-4 max-w-xl text-pretty leading-relaxed text-muted-foreground">
              Every piece here was made by a real young designer, in a small team, somewhere in Australia. Each sale
              goes straight to their team.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          {!products || products.length === 0 ? (
            <Empty className="py-16">
              <EmptyHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Package className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                </div>
                <EmptyTitle>No products yet</EmptyTitle>
                <EmptyDescription>
                  Young designers are hard at work. Check back soon — or start a team of your own.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <a
                  href="/auth/sign-up"
                  className="inline-flex items-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Start a team
                </a>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => {
                const team = Array.isArray(product.team) ? product.team[0] : product.team
                return (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    priceInCents={product.price_cents}
                    imageUrl={product.image_url}
                    teamName={team?.name}
                  />
                )
              })}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
