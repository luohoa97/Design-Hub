import { LogoMark } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { LayoutGrid, Package, Users, Settings, Search } from "lucide-react"

export function DashboardPreview() {
  return (
    <section className="relative">
      <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-28">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_1px_0_rgba(0,0,0,0.04),0_30px_80px_-20px_rgba(60,40,20,0.15)]">
          {/* Dashboard top bar */}
          <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-5 py-3">
            <div className="flex items-center gap-2">
              <LogoMark className="h-5 w-5" />
              <span className="font-serif text-sm font-medium">Atelier Junior</span>
              <span className="ml-3 rounded-md bg-background px-2 py-0.5 text-xs text-muted-foreground">
                Acorn Studio
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <div className="h-6 w-6 rounded-full bg-accent/80" aria-hidden="true" />
            </div>
          </div>

          <div className="grid grid-cols-[180px_1fr]">
            {/* Sidebar */}
            <aside className="border-r border-border/60 bg-card py-4 text-sm">
              <nav className="flex flex-col gap-0.5 px-2" aria-label="Dashboard example">
                <SidebarItem icon={LayoutGrid} label="Overview" />
                <SidebarItem icon={Package} label="Products" active />
                <SidebarItem icon={Users} label="Teams" />
                <SidebarItem icon={Settings} label="Settings" />
              </nav>
            </aside>

            {/* Content */}
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif text-xl tracking-tight text-foreground">Products</h3>
                  <p className="mt-1 text-xs text-muted-foreground">3 published, 1 draft</p>
                </div>
                <Button size="sm" className="h-8 rounded-md text-xs">
                  Publish product
                </Button>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <ProductCard title="Sunny Tote" designer="By Mia, 11" price="$24" tone="bg-[oklch(0.9_0.04_70)]" />
                <ProductCard title="Fox Pin" designer="By Theo, 9" price="$8" tone="bg-[oklch(0.88_0.05_45)]" />
                <ProductCard
                  title="Wave Print"
                  designer="By Acorn Studio"
                  price="$18"
                  tone="bg-[oklch(0.88_0.03_200)]"
                />
              </div>

              <div className="mt-4 flex items-center justify-between rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-xs">
                <span className="text-muted-foreground">Stripe payouts</span>
                <span className="flex items-center gap-1.5 text-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                  Connected — earnings go to your team
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function SidebarItem({
  icon: Icon,
  label,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  active?: boolean
}) {
  return (
    <span
      className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs ${
        active ? "bg-muted text-foreground" : "text-muted-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  )
}

function ProductCard({
  title,
  designer,
  price,
  tone,
}: {
  title: string
  designer: string
  price: string
  tone: string
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border/60 bg-background">
      <div className={`aspect-square ${tone}`} aria-hidden="true" />
      <div className="p-2.5">
        <p className="truncate text-xs font-medium text-foreground">{title}</p>
        <div className="mt-0.5 flex items-center justify-between">
          <p className="truncate text-[10px] text-muted-foreground">{designer}</p>
          <p className="text-xs font-medium tabular-nums">{price}</p>
        </div>
      </div>
    </div>
  )
}
