import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-5xl px-4 pt-20 pb-16 sm:px-6 sm:pt-28 sm:pb-24">
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-xs tracking-wide text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Family-owned. Proudly Australian.
          </span>

          <h1 className="mt-8 font-serif text-5xl leading-[1.05] tracking-tight text-balance text-foreground sm:text-6xl md:text-7xl">
            Real products,
            <br />
            designed by kids.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">
            Atelier Junior gives school-age designers a place to imagine, handcraft, and sell their first products — with
            a little help from their team, and their family.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-full px-7 text-base">
              <Link href="/auth/sign-up">
                Start Designing
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="h-12 rounded-full px-7 text-base font-normal">
              <Link href="/shop">Browse the shop</Link>
            </Button>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            Free to start. Young designers keep the credit — and most of the earnings.
          </p>
        </div>
      </div>
    </section>
  )
}
