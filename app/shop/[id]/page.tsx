import { createClient } from "@/lib/supabase/server"
import { SiteNav } from "@/components/site-nav"
import { SiteFooter } from "@/components/site-footer"
import { notFound } from "next/navigation"
import { formatAUD } from "@/lib/format"
import { createCheckoutSession } from "@/app/actions/stripe"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from("products")
    .select("id, name, description, price_cents, image_url, team:teams(id, name, description)")
    .eq("id", id)
    .eq("status", "published")
    .single()

  if (!product) {
    notFound()
  }

  const team = Array.isArray(product.team) ? product.team[0] : product.team

  async function handleBuy() {
    "use server"
    await createCheckoutSession(id)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteNav />

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to shop
          </Link>
        </div>

        <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24">
          <div className="grid gap-10 md:grid-cols-2 md:gap-16">
            {/* Image */}
            <div className="overflow-hidden rounded-xl border border-border/60 bg-muted">
              <div className="aspect-square">
                {product.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image_url || "/placeholder.svg"}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center bg-[oklch(0.9_0.04_70)]"
                    aria-hidden="true"
                  />
                )}
              </div>
            </div>

            {/* Details */}
            <div className="flex flex-col">
              {team && (
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  By {team.name}
                </p>
              )}
              <h1 className="mt-3 font-serif text-4xl tracking-tight text-balance text-foreground sm:text-5xl">
                {product.name}
              </h1>
              <p className="mt-6 text-2xl font-medium tabular-nums text-foreground">
                {formatAUD(product.price_cents)}
              </p>

              {product.description && (
                <p className="mt-6 whitespace-pre-wrap text-pretty leading-relaxed text-muted-foreground">
                  {product.description}
                </p>
              )}

              <form action={handleBuy} className="mt-8">
                <Button type="submit" size="lg" className="h-12 w-full rounded-full px-7 text-base sm:w-auto">
                  Buy now — {formatAUD(product.price_cents)}
                </Button>
              </form>

              <div className="mt-8 space-y-3 rounded-xl border border-border/60 bg-card p-5 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-muted-foreground">Handmade in</span>
                  <span className="font-medium text-foreground">Australia</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-muted-foreground">Ships from</span>
                  <span className="font-medium text-foreground">The team&apos;s home studio</span>
                </div>
                {team?.description && (
                  <div className="border-t border-border/60 pt-3">
                    <p className="text-muted-foreground">About {team.name}</p>
                    <p className="mt-1 text-foreground">{team.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
