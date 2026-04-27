import Link from "next/link"
import { formatAUD } from "@/lib/format"

interface ProductCardProps {
  id: string
  name: string
  priceInCents: number
  imageUrl?: string | null
  teamName?: string
}

export function ProductCard({ id, name, priceInCents, imageUrl, teamName }: ProductCardProps) {
  return (
    <Link
      href={`/shop/${id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card transition-colors hover:border-border"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl || "/placeholder.svg"}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-[oklch(0.9_0.04_70)]"
            aria-hidden="true"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-serif text-lg tracking-tight text-foreground">{name}</h3>
        {teamName && <p className="mt-0.5 text-xs text-muted-foreground">By {teamName}</p>}
        <p className="mt-3 text-sm font-medium tabular-nums text-foreground">{formatAUD(priceInCents)}</p>
      </div>
    </Link>
  )
}
