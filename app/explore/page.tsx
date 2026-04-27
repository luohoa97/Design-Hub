import { createClient } from "@/lib/supabase/server"
import { SiteNav } from "@/components/site-nav"
import { SiteFooter } from "@/components/site-footer"
import { DesignGrid } from "@/components/design-grid"
import { ExploreFilters } from "@/components/explore-filters"

export const metadata = {
  title: "Explore — Designly",
  description: "Discover original designs from the next generation of creators.",
}

const CATEGORIES = [
  "All",
  "Illustration",
  "Typography",
  "Pattern",
  "Photography",
  "Digital Art",
  "Branding",
  "Print",
  "Other",
]

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>
}) {
  const { q, category, sort } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from("designs")
    .select("id, slug, title, price_cents, preview_image_urls, like_count, purchase_count, creator:profiles(id, handle, display_name, full_name, avatar_url)")
    .eq("status", "published")

  if (q) {
    query = query.ilike("title", `%${q}%`)
  }

  if (category && category !== "All") {
    query = query.eq("category", category)
  }

  if (sort === "popular") {
    query = query.order("like_count", { ascending: false })
  } else if (sort === "purchases") {
    query = query.order("purchase_count", { ascending: false })
  } else {
    query = query.order("created_at", { ascending: false })
  }

  const { data: designs } = await query.limit(60)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteNav />

      <main className="flex-1">
        <div className="border-b border-border/60">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Explore
            </span>
            <h1 className="mt-3 font-serif text-4xl tracking-tight text-balance text-foreground sm:text-5xl">
              Made by you.
            </h1>
            <p className="mt-4 max-w-xl text-pretty leading-relaxed text-muted-foreground">
              Original designs from the next generation of creators. Every purchase supports a young designer directly.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <ExploreFilters categories={CATEGORIES} currentQ={q} currentCategory={category} currentSort={sort} />

          <div className="mt-8">
            <DesignGrid designs={designs ?? []} />
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
