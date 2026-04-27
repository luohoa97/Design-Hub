"use client"

import { Button } from "@/components/ui/button"
import { startStripeConnect, createStripeDashboardLink, syncStripeConnectStatus } from "@/app/actions/stripe-connect"
import { useTransition } from "react"
import { ExternalLink, RefreshCcw } from "lucide-react"
import { useRouter } from "next/navigation"

interface Props {
  teamId: string
  hasAccount: boolean
  onboardingComplete: boolean
}

export function StripeConnectActions({ teamId, hasAccount, onboardingComplete }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleConnect = () => {
    startTransition(async () => {
      try {
        await startStripeConnect(teamId)
      } catch (err) {
        console.error("[v0] stripe connect error:", err)
        alert(err instanceof Error ? err.message : "Could not start Stripe setup")
      }
    })
  }

  const handleDashboard = () => {
    startTransition(async () => {
      try {
        await createStripeDashboardLink(teamId)
      } catch (err) {
        console.error("[v0] stripe dashboard error:", err)
        alert(err instanceof Error ? err.message : "Could not open Stripe dashboard")
      }
    })
  }

  const handleSync = () => {
    startTransition(async () => {
      try {
        await syncStripeConnectStatus(teamId)
        router.refresh()
      } catch (err) {
        console.error("[v0] stripe sync error:", err)
      }
    })
  }

  if (onboardingComplete) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleDashboard} disabled={isPending} className="rounded-full">
          Open Stripe dashboard
          <ExternalLink className="ml-1 h-3.5 w-3.5" />
        </Button>
        <Button onClick={handleSync} disabled={isPending} variant="ghost" className="rounded-full font-normal">
          <RefreshCcw className="mr-1 h-3.5 w-3.5" />
          Sync status
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={handleConnect} disabled={isPending} className="rounded-full">
        {hasAccount ? "Continue Stripe setup" : "Connect with Stripe"}
        <ExternalLink className="ml-1 h-3.5 w-3.5" />
      </Button>
      {hasAccount && (
        <Button onClick={handleSync} disabled={isPending} variant="ghost" className="rounded-full font-normal">
          <RefreshCcw className="mr-1 h-3.5 w-3.5" />
          Sync status
        </Button>
      )}
    </div>
  )
}
