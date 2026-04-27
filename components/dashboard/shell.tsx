import Link from "next/link"
import { Logo } from "@/components/logo"
import { LayoutGrid, Package, Users, Settings } from "lucide-react"
import { UserMenu } from "@/components/dashboard/user-menu"
import { createClient } from "@/lib/supabase/server"

interface DashboardShellProps {
  children: React.ReactNode
  activePath?: "overview" | "products" | "teams" | "settings"
}

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid, id: "overview" as const },
  { href: "/dashboard/products", label: "Products", icon: Package, id: "products" as const },
  { href: "/dashboard/teams", label: "Teams", icon: Users, id: "teams" as const },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, id: "settings" as const },
]

export async function DashboardShell({ children, activePath = "overview" }: DashboardShellProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo href="/dashboard" />
            <span className="hidden text-xs text-muted-foreground sm:inline">Dashboard</span>
          </div>
          <UserMenu email={user?.email ?? ""} />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-0 px-4 sm:px-6">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-56 shrink-0 py-6 md:block">
          <nav className="flex flex-col gap-0.5" aria-label="Dashboard">
            {navItems.map((item) => {
              const active = item.id === activePath
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    active ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        <main className="flex-1 py-6 md:border-l md:border-border/60 md:pl-8">{children}</main>
      </div>
    </div>
  )
}
