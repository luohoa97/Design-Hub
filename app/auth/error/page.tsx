import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AlertCircle } from "lucide-react"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
          <Logo />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" aria-hidden="true" />
          </span>
          <h1 className="mt-6 font-serif text-3xl tracking-tight text-foreground">Something went wrong</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {params?.error ?? "We couldn't complete that authentication request. Please try again."}
          </p>
          <Button asChild className="mt-8 rounded-full">
            <Link href="/auth/login">Back to log in</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
