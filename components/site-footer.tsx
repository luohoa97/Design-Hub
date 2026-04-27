import Link from "next/link"
import { Logo } from "@/components/logo"

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              A family-run Australian studio giving young designers a real place to build, publish and sell.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-foreground">Explore</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>
                <Link href="/shop" className="hover:text-foreground">
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-foreground">
                  About
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium text-foreground">Account</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>
                <Link href="/auth/login" className="hover:text-foreground">
                  Log in
                </Link>
              </li>
              <li>
                <Link href="/auth/sign-up" className="hover:text-foreground">
                  Sign up
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-foreground">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border/60 pt-8 text-xs text-muted-foreground md:flex-row md:items-center">
          <p>&copy; {new Date().getFullYear()} Atelier Junior. Made with care in Australia.</p>
          <p>ABN pending — A small, family-owned studio.</p>
        </div>
      </div>
    </footer>
  )
}
