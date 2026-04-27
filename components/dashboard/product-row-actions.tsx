"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import { archiveProduct, publishProduct, unpublishProduct } from "@/app/actions/products"
import { useTransition } from "react"
import { useRouter } from "next/navigation"

interface ProductRowActionsProps {
  productId: string
  status: string
  canPublish: boolean
}

export function ProductRowActions({ productId, status, canPublish }: ProductRowActionsProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const run = (fn: () => Promise<void>) =>
    startTransition(async () => {
      try {
        await fn()
        router.refresh()
      } catch (err) {
        console.error("[v0] product action error:", err)
        alert(err instanceof Error ? err.message : "Something went wrong")
      }
    })

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={isPending}>
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {status === "draft" && (
          <DropdownMenuItem disabled={!canPublish} onClick={() => run(() => publishProduct(productId))}>
            {canPublish ? "Publish to shop" : "Connect Stripe to publish"}
          </DropdownMenuItem>
        )}
        {status === "published" && (
          <DropdownMenuItem onClick={() => run(() => unpublishProduct(productId))}>
            Unpublish (move to draft)
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => run(() => archiveProduct(productId))}>Archive</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
