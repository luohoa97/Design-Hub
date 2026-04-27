import { DashboardShell } from "@/components/dashboard/shell"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { NewProductForm } from "@/components/dashboard/new-product-form"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"

export default async function NewProductPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, stripe_onboarding_complete")
    .order("created_at", { ascending: true })

  return (
    <DashboardShell activePath="products">
      <Link
        href="/dashboard/products"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to products
      </Link>

      <div className="mt-4 max-w-2xl">
        <h1 className="font-serif text-3xl tracking-tight text-foreground">Publish a new product</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Describe the handmade item. You can save as a draft and polish it later.
        </p>
      </div>

      <div className="mt-8 max-w-2xl">
        {!teams || teams.length === 0 ? (
          <Empty className="rounded-xl border border-dashed border-border bg-card/40 py-16">
            <EmptyHeader>
              <EmptyTitle>Create a team first</EmptyTitle>
              <EmptyDescription>Products belong to teams. Start by creating one.</EmptyDescription>
            </EmptyHeader>
            <Button asChild className="mt-4 rounded-full">
              <Link href="/dashboard/teams/new">Create team</Link>
            </Button>
          </Empty>
        ) : (
          <NewProductForm teams={teams} />
        )}
      </div>
    </DashboardShell>
  )
}
