import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CTASection() {
  return (
    <section className="border-t border-border/60 bg-card/40">
      <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28">
        <h2 className="font-serif text-4xl tracking-tight text-balance text-foreground sm:text-5xl">
          Your designer has an idea.
          <br />
          Let&apos;s give it a shop window.
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-pretty text-muted-foreground">
          Free to start. No setup fees. Publish your first product in an afternoon.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-12 rounded-full px-7 text-base">
            <Link href="/auth/sign-up">
              Start Designing
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className="h-12 rounded-full px-7 text-base font-normal">
            <Link href="/about">Read our story</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
