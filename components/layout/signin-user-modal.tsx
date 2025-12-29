"use client";

import { Popover } from "@/components/ui/popover";
import { LayoutDashboard, LogOut, MoonIcon, SunIcon } from "lucide-react";
import { Session } from "@/lib/auth";
import { signOut } from "@/lib/auth-client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Avatar, AvatarImage } from "../ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

export default function UserDropdown({ session }: { session: Session }) {
  const { email, image, name } = session?.user || {};
  const router = useRouter();

  if (!email) return null;

  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirect after successful sign out
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Error signing out:", error);
      // Still redirect even on error to ensure user sees the logged out state
      router.push("/");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="rounded-full p-0">
        <Button variant="ghost" className="w-9 h-9 px-0">
          <Avatar
            className="flex cursor-pointer h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-accent transition-all duration-75 focus:outline-none active:scale-95"
          >
            <AvatarImage
              alt={email}
              src={image || `https://avatars.dicebear.com/api/micah/${email}.svg`}
              width={40}
              height={40}
            />
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          {session?.user?.name && (
            <p className="truncate text-sm font-medium text-primary">
              {session?.user?.name}
            </p>
          )}
          <p className="truncate text-sm text-muted-foreground font-normal">
            {session?.user?.email}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/settings")} className="gap-2 cursor-pointer">
          <LayoutDashboard className="h-4 w-4" />
          <p className="text-sm">Settings</p>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut} className="gap-2 cursor-pointer">
          <LogOut className="h-4 w-4" />
          <p className="text-sm">Logout</p>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
