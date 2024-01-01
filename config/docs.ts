import { MainNavItem, SidebarNavItem } from "@/types/nav"

interface DocsConfig {
  mainNav: MainNavItem[]
  sidebarNav: SidebarNavItem[]
}

export const docsConfig: DocsConfig = {
  mainNav: [
    {
      title: "Home",
      href: "/",
    },
    {
      title: "Matches",
      href: "/matches",
    },
    {
      title: "Bingo",
      href: "/bingo",
    },
    {
      title: "New Bingo",
      href: "/bingo?new=true",
    },
    {
      title: "GitHub",
      href: "https://github.com/lryanle/bingobongo",
      external: true,
    },
  ],
  sidebarNav: [
    {
      title: "Bingo History",
      items: [
      ],
    },
  ],
}
