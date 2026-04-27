import { cn } from "@/lib/utils"
import Link from "next/link"

interface LogoProps {
  className?: string
  href?: string
  showWordmark?: boolean
}

export function Logo({ className, href = "/", showWordmark = true }: LogoProps) {
  const content = (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className="h-7 w-7" />
      {showWordmark && (
        <span className="font-serif text-lg font-medium tracking-tight text-foreground">Atelier Junior</span>
      )}
    </span>
  )

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center" aria-label="Atelier Junior home">
        {content}
      </Link>
    )
  }

  return content
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-foreground", className)}
      aria-hidden="true"
    >
      {/* Circular badge with a stylised 'A' pencil/brush mark */}
      <circle cx="16" cy="16" r="15" fill="currentColor" />
      <path
        d="M10 22 L16 8 L22 22 M12.5 17 L19.5 17"
        stroke="var(--color-background)"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="24" cy="10" r="1.75" fill="var(--color-accent)" />
    </svg>
  )
}
