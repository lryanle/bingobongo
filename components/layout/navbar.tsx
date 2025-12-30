"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import { Icons } from "@/components/icons"

export default function Navbar() {
  const pathname = usePathname()

  return (
    <div className="mr-4 flex">
      <Link href="/" className="mr-6 flex items-center space-x-2">
        <div className="w-6 h-6">
          <Icons.Logo className="h-6 w-6" />
        </div>
        <span className="font-bold sm:inline-block">
          {siteConfig.name.replace(/ /g, "\u00a0")}
        </span>
      </Link>
      <nav className="md:flex hidden items-center gap-6 text-sm">
        <Link
          href="/"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname === "/" ? "text-foreground" : "text-foreground/60"
          )}
        >
          Home
        </Link>
        <Link
          href="/matches"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname?.startsWith("/matches")
              ? "text-foreground"
              : "text-foreground/60"
          )}
        >
          Matches
        </Link>
        <Link
          href="/bingo/create"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname?.startsWith("/bingo/create")
              ? "text-foreground"
              : "text-foreground/60"
          )}
        >
          Create Bingo
        </Link>
      </nav>
    </div>
  )
}
