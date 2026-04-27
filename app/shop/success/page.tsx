import { SiteNav } from "@/components/site-nav"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Check } from "lucide-react"

export const metadata = {
  title: "Thanks — Atelier Junior",
}

export default function SuccessPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteNav />

      <main className="flex flex-1 items-center justify-center px-4 py-20 sm:px-6">
        <div className="w-full max-w-md text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/15">
            <Check className="h-7 w-7 text-accent" aria-hidden="true" />
          </span>
          <h1 className="mt-6 font-serif text-4xl tracking-tight text-balance text-foreground">
            Thank you for your order.
          </h1>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
            A young designer just made a sale. We&apos;ve sent a confirmation to your email, and the team will be in
            touch to arrange delivery.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="h-11 rounded-full px-6">
              <Link href="/shop">Keep browsing</Link>
            </Button>
            <Button asChild variant="ghost" className="h-11 rounded-full px-6 font-normal">
              <Link href="/">Back home</Link>
            </Button>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
