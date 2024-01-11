"use client"

import React, { useState } from 'react'
import { Icons } from '@/components/icons';
import Spotlight, { SpotlightCard } from '@/components/home/spotlight';

import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Session } from 'next-auth';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type BingoSelectProps = {
  children?: React.ReactNode,
  className?: string,
  props?: React.HTMLAttributes<HTMLElement>,
  session: Session,
}


export default function BingoSelect({
  children,
  className = '',
  props,
  session
}: BingoSelectProps) {
  const signedin = session?.user ? true : false;
  const [joinCode, setJoinCode] = useState<string>("");

  return (
    <Spotlight className={cn(className,"flex flex-col md:flex-row justify-center items-center gap-6 mx-auto group")} {...props}>
      {/* Card #1 */}
      <SpotlightCard className="w-[80vw] h-max md:w-[22rem] md:h-[11rem]">
        <div className="flex items-center justify-center relative h-full bg-slate-50 dark:bg-slate-900 p-6 pb-8 rounded-[inherit] z-20 overflow-hidden">
          {/* Radial gradient */}
          <div className="absolute bottom-0 translate-y-1/2 left-1/2 -translate-x-1/2 pointer-events-none -z-10 w-1/2 aspect-square" aria-hidden="true">
            <div className="absolute inset-0 translate-z-0 bg-slate-200 dark:bg-slate-800 rounded-full blur-[80px]"></div>
          </div>
          <div className="flex flex-col items-center text-center">
            {/* Image */}
            <div className="relative inline-flex">
              <div className="w-[40%] h-[40%] absolute inset-0 m-auto -translate-y-[10%] blur-3xl -z-10 rounded-full bg-blue-400 dark:bg-blue-600" aria-hidden="true"></div>
            </div>
            {/* Text */}
            <div className="mb-5">
              <h2 className="text-xl text-primary dark:text-slate-200 font-bold mb-1">Play With Friends</h2>
              <p className="text-sm text-muted-foreground dark:text-slate-500">Join and play bingo with friends through an invite code or sharable link.</p>
            </div>
            {signedin ? (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="default" className="inline-flex justify-center items-center gap-2 whitespace-nowrap rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-50 hover:dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-800 dark:text-slate-300 focus-visible:outline-none focus-visible:ring focus-visible:ring-indigo-300 dark:focus-visible:ring-slate-600 transition-colors duration-150">
                    <span>Join Bingo</span>
                    <Icons.join className="fill-slate-500 w-5 h-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Join Bingo</DialogTitle>
                    <DialogDescription>
                      Enter a valid invite code or sharable link to join a bingo game.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="w-full h-full flex justify-center items-center">
                      <Input id="joincode" className="w-full" onChange={(e) => setJoinCode(e.target.value)}  autoCorrect='false' autoCapitalize='false' aria-autocomplete='none' autoComplete='off'/>
                  </div>
                  <DialogFooter>
                    <Link type="submit" href={`/play?=${encodeURIComponent(joinCode)}`} className={cn(buttonVariants({ variant: "default" }))}>Join Game</Link>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : (
              <Button disabled className={cn(buttonVariants({ variant: "default" }), "inline-flex justify-center items-center gap-2 whitespace-nowrap rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-50 hover:dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-800 dark:text-slate-300 focus-visible:outline-none focus-visible:ring focus-visible:ring-indigo-300 dark:focus-visible:ring-slate-600 transition-colors duration-150")}>
                <span>Join Bingo — Sign In Required</span>
              </Button>
            )}
            
          </div>
        </div>
      </SpotlightCard>
      {/* Card #2 */}
      <SpotlightCard className="w-[80vw] h-max md:w-[22rem] md:h-[11rem]">
        <div className="flex items-center justify-center relative h-full bg-slate-50 dark:bg-slate-900 p-6 pb-8 rounded-[inherit] z-20 overflow-hidden">
          {/* Radial gradient */}
          <div className="absolute bottom-0 translate-y-1/2 left-1/2 -translate-x-1/2 pointer-events-none -z-10 w-1/2 aspect-square" aria-hidden="true">
            <div className="absolute inset-0 translate-z-0 bg-slate-200 dark:bg-slate-800 rounded-full blur-[80px]"></div>
          </div>
          <div className="flex flex-col items-center text-center">
            {/* Image */}
            <div className="relative inline-flex">
              <div className="w-[40%] h-[40%] absolute inset-0 m-auto -translate-y-[10%] blur-3xl -z-10 rounded-full bg-blue-400 dark:bg-blue-600" aria-hidden="true"></div>
            </div>
            {/* Text */}
            <div className="mb-5">
              <h2 className="text-xl text-primary dark:text-slate-200 font-bold mb-1">Start a New Game</h2>
              <p className="text-sm text-muted-foreground dark:text-slate-500">Start and share your bingo addiction with friends using any of our 20+ gamemodes.</p>
            </div>
            {signedin ? (
              <Link href="/bingo/create" className={cn(buttonVariants({ variant: "default" }), "inline-flex justify-center items-center gap-2 whitespace-nowrap rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-50 hover:dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-800 dark:text-slate-300 focus-visible:outline-none focus-visible:ring focus-visible:ring-indigo-300 dark:focus-visible:ring-slate-600 transition-colors duration-150")}>
                <span>Create Bingo</span>
                <Icons.create className="fill-slate-500 w-5 h-5" />
              </Link>
            ) : (
              <Button disabled className={cn(buttonVariants({ variant: "default" }), "inline-flex justify-center items-center gap-2 whitespace-nowrap rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-50 hover:dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-800 dark:text-slate-300 focus-visible:outline-none focus-visible:ring focus-visible:ring-indigo-300 dark:focus-visible:ring-slate-600 transition-colors duration-150")}>
                <span>Create Bingo — Sign In Required</span>
              </Button>
            )}
          </div>
        </div>
      </SpotlightCard>
    </Spotlight>
  )
}