"use client"

import { Session } from "@/lib/auth";
import UserDropdown from "./signin-user-modal";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export interface UserNavProps {
  session: Session | null;
}

export function UserNav({session}: UserNavProps) {
  return (
    session ? (
      <UserDropdown session={session} />
    ) : (
      <Button
        size="sm"
        onClick={async () => await signIn.social({ provider: "google" })}
      >
        Sign In
      </Button>
    )
  )
}