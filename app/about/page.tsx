import { SiteNav } from "@/components/site-nav"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export const metadata = {
  title: "About — Atelier Junior",
  description: "A family-run Australian studio empowering young designers to make and sell real products.",
}

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteNav />

      <main className="flex-1">
        <section className="border-b border-border/60">
          <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 sm:py-28">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Our story</span>
            <h1 className="mt-3 font-serif text-5xl tracking-tight text-balance text-foreground sm:text-6xl">
              A family workshop, turned into a platform.
            </h1>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="space-y-6 text-lg leading-relaxed text-foreground">
            <p>
              Atelier Junior started at our kitchen table in regional Australia. Our youngest kept sketching little
              animal pins, and we couldn&apos;t help noticing how seriously she took the work — the colours, the
              re-drafts, the tiny name labels on the back.
            </p>
            <p>
              The first few pins sold out at a local market. Then a school friend made earrings. Then a whole class
              wanted to try. That&apos;s when we realised something simple: young designers don&apos;t need a toy
              version of a business. They need a real one.
            </p>
            <p>
              Today, Atelier Junior is a small, family-owned studio and software platform. We help teams of school-age
              designers (plus a grown-up lead) publish handmade products, take real payments, and keep most of what
              they earn.
            </p>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60 md:grid-cols-3">
            <Stat label="Platform fee" value="10%" note="So young designers keep 90% of every sale" />
            <Stat label="Country" value="Australia" note="AUD pricing, local shipping" />
            <Stat label="Payouts" value="Via Stripe" note="Direct to your team's bank" />
          </div>

          <div className="mt-16 flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-center">
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
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="bg-background p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-serif text-3xl tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{note}</p>
    </div>
  )
}
