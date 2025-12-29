import React from 'react'
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import BingoSelect from '@/components/home/bingoselect';
import { Meteors } from './meteor';
import { Session } from '@/lib/auth';

type Props = {
  session: Session;
};

export default function Landing({session}: Props) {

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
      <BingoSelect session={session} className="mt-16" />
      <Meteors number={10} />
    </div>
  )
}