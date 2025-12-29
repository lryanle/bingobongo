'use client'

import { Session } from "@/lib/auth";

export default function AuthProvider ({
  children,
  session
}: {
  readonly children: React.ReactNode
  readonly session: Session | null
}): React.ReactNode {
  // Better Auth's SessionProvider doesn't need session prop - it fetches it automatically
  return (
    <>
      {children}
    </>
  )
}

