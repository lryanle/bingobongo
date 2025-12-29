"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes"

import { TooltipProvider } from "@/components/ui/tooltip"

export function ThemeProvider({ children, ...props }: Readonly<ThemeProviderProps>) {
  return (
    <NextThemesProvider
      {...props}
      storageKey="theme"
      enableColorScheme={false}
    >
      <TooltipProvider>{children}</TooltipProvider>
    </NextThemesProvider>
  )
}
