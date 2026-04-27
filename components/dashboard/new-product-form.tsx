"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createProduct } from "@/app/actions/products"
import { AlertCircle } from "lucide-react"
import { useState, useTransition } from "react"
import Link from "next/link"

interface Team {
  id: string
  name: string
  stripe_onboarding_complete: boolean
}

export function NewProductForm({ teams }: { teams: Team[] }) {
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id ?? "")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const selectedTeam = teams.find((t) => t.id === selectedTeamId)
  const canPublish = selectedTeam?.stripe_onboarding_complete ?? false

  const submit = async (formData: FormData, action: "draft" | "publish") => {
    setError(null)
    formData.set("action", action)
    formData.set("team_id", selectedTeamId)

    startTransition(async () => {
      try {
        await createProduct(formData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong")
      }
    })
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
        const action = (submitter?.value as "draft" | "publish") ?? "draft"
        submit(formData, action)
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="team_select">Team</Label>
        <Select value={selectedTeamId} onValueChange={setSelectedTeamId} required>
          <SelectTrigger id="team_select">
            <SelectValue placeholder="Select a team" />
          </SelectTrigger>
          <SelectContent>
            {teams.map((team) => (
              <SelectItem key={team.id} value={team.id}>
                {team.name}
                {team.stripe_onboarding_complete ? "" : " — Stripe not connected"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Product name</Label>
        <Input id="name" name="name" required placeholder="Sunny Tote" maxLength={80} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          placeholder="Tell the story of this piece — who designed it, what it's made from, why it's special."
          maxLength={1000}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="price">Price (AUD)</Label>
          <Input id="price" name="price" type="number" step="0.01" min="1" required placeholder="24.00" />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="image_url">Image URL (optional)</Label>
          <Input id="image_url" name="image_url" type="url" placeholder="https://..." />
        </div>
      </div>

      {!canPublish && selectedTeam && (
        <div className="flex items-start gap-3 rounded-lg border border-accent/30 bg-accent/5 p-4 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-medium text-foreground">Connect Stripe to publish</p>
            <p className="mt-1 text-muted-foreground">
              {selectedTeam.name} needs to complete Stripe onboarding before publishing products.{" "}
              <Link href={`/dashboard/teams/${selectedTeam.id}`} className="font-medium text-foreground underline">
                Set up now
              </Link>
            </p>
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="submit" name="action" value="draft" variant="ghost" className="rounded-full font-normal" disabled={isPending}>
          Save as draft
        </Button>
        <Button type="submit" name="action" value="publish" className="rounded-full" disabled={isPending || !canPublish}>
          {canPublish ? "Publish to shop" : "Stripe required to publish"}
        </Button>
      </div>
    </form>
  )
}
