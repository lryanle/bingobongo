import React from 'react'
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import Spotlight, { SpotlightCard } from '@/components/home/spotlight';
import Image from 'next/image';

import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Landing() {

  return (
    <div className="flex justify-center items-center flex-col my-16 h-full w-full">
      <div className="flex justify-center items-center flex-col gap-4 space-y-4">
        <span className="text-center text-primary font-bold tracking-tight text-[11vw] md:text-8xl flex flex-row justify-center items-center gap-4 text-nowrap">
          <Icons.logo className="w-[11vw] h-[11vw] md:w-24 md:h-24" />
          <span className="py-3 bg-clip-text text-transparent bg-[linear-gradient(to_right,theme(colors.slate.800),theme(colors.blue.950),theme(colors.stone.800),theme(colors.gray.800),theme(colors.indigo.950),theme(colors.neutral.800),theme(colors.sky.950),theme(colors.zinc.800),theme(colors.slate.800))] dark:bg-[linear-gradient(to_right,theme(colors.slate.200),theme(colors.blue.200),theme(colors.stone.200),theme(colors.gray.200),theme(colors.indigo.200),theme(colors.neutral.200),theme(colors.sky.200),theme(colors.zinc.200),theme(colors.slate.200))] bg-[length:200%_auto] animate-gradient">Bingo Bongo</span>
        </span>
        {/* <span className="text-center text-primary font-semibold tracking-normal text-4xl">Customizable Multiplayer Bingo<br />Made Simple and Elegant</span> */}
        <div className="flex justify-center items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-sm px-3">Multiplayer</Badge>
          <Badge variant="secondary" className="text-sm px-3">20+ Gamemodes</Badge>
          <Badge variant="secondary" className="text-sm px-3">Customizable</Badge>
          <Badge variant="secondary" className="text-sm px-3">Cosmetics</Badge>
          <Badge variant="secondary" className="text-sm px-3">Intuitive</Badge>
          <Badge variant="secondary" className="text-sm px-3">100% Free</Badge>
        </div>
      </div>
      <Spotlight className="flex flex-col md:flex-row justify-center items-center gap-6 mx-auto group mt-16">
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
              <Link href="/bingo/join" className={cn(buttonVariants({ variant: "default" }), "inline-flex justify-center items-center gap-2 whitespace-nowrap rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-50 hover:dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-800 dark:text-slate-300 focus-visible:outline-none focus-visible:ring focus-visible:ring-indigo-300 dark:focus-visible:ring-slate-600 transition-colors duration-150")}>
                <span>Join Bingo</span>
                <Icons.join className="fill-slate-500 w-5 h-5" />
              </Link>
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
              <Link href="/bingo/create" className={cn(buttonVariants({ variant: "default" }), "inline-flex justify-center items-center gap-2 whitespace-nowrap rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-50 hover:dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-800 dark:text-slate-300 focus-visible:outline-none focus-visible:ring focus-visible:ring-indigo-300 dark:focus-visible:ring-slate-600 transition-colors duration-150")}>
                <span>Create Bingo</span>
                <Icons.create className="fill-slate-500 w-5 h-5" />
              </Link>
            </div>
          </div>
        </SpotlightCard>
      </Spotlight>
    </div>
  )
}