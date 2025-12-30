import Link from "next/link";
import { siteConfig } from "@/config/site"
import { CommandMenu } from "@/components/layout/command-menu"
import { Icons } from "@/components/icons"
import Navbar from "@/components/layout/navbar"
import { MobileNavbar } from "@/components/layout/mobile-navbar"
import { ModeToggle } from "./mode-toggle";
import { UserNav } from "./usernav";
import { Session } from "@/lib/auth";

export function SiteHeader({ session }: Readonly<{ session: Session | null }>) {
  return (
      <header className="sticky top-0 z-50 w-full md:flex justify-center border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl justify-between md:justify-center items-center px-4">
        <Navbar />
        <div className="md:flex flex-1 items-center justify-between space-x-2 hidden md:justify-end">
          <div className="w-full flex-1 hidden md:w-auto md:flex md:flex-none">
            <CommandMenu />
          </div>
          <nav className="items-center hidden md:flex">
          </nav>
          <Link href="/" className="mr-6 flex items-center space-x-2 md:hidden">
            <div className="w-6 h-6">
              <Icons.Logo className="h-6 w-6" />
            </div>
            <span className="font-bold sm:inline-block">
              {siteConfig.name}
            </span>
          </Link>
          <ModeToggle className="hidden md:flex" />
          <UserNav session={session} />
        </div>

        <MobileNavbar />
      </div>
    </header>
  )
}
