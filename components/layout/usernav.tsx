"use client"

import { Session } from "next-auth";
import UserDropdown from "./signin-user-modal";
import { signIn } from "next-auth/react";
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
        onClick={() => signIn("google")}
      >
        Sign In
      </Button>
    )
  )
}