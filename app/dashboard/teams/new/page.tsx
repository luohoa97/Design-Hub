import { DashboardShell } from "@/components/dashboard/shell"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createTeam } from "@/app/actions/teams"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function NewTeamPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  return (
    <DashboardShell activePath="teams">
      <Link
        href="/dashboard/teams"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to teams
      </Link>

      <div className="mt-4 max-w-xl">
        <h1 className="font-serif text-3xl tracking-tight text-foreground">Start a new team</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A team is a small group of young designers — often with a parent or teacher as the owner.
        </p>
      </div>

      <form action={createTeam} className="mt-8 flex max-w-xl flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Team name</Label>
          <Input id="name" name="name" required placeholder="Acorn Studio" maxLength={60} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            name="description"
            rows={4}
            placeholder="Who&apos;s on the team? What kind of things do you like to make?"
            maxLength={500}
          />
        </div>

        <div className="rounded-lg border border-border/60 bg-muted/40 p-4 text-sm text-muted-foreground">
          After creating your team, you&apos;ll connect a Stripe account so sales can be paid out directly to your
          team. You only do this once.
        </div>

        <div className="flex justify-end">
          <Button type="submit" className="rounded-full">
            Create team
          </Button>
        </div>
      </form>
    </DashboardShell>
  )
}
