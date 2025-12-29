import BingoSelect from "@/components/home/bingoselect";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { Session } from "@/lib/auth";
import React from "react";

export default async function BingoSelectPage() {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });

	return (
		<div className="flex justify-center items-center flex-col my-32 h-full w-full gap-8">
			<div className="flex justify-center items-center flex-col gap-4 space-y-4">
				<span className="text-center text-primary font-bold tracking-tight text-[11vw] md:text-6xl flex flex-row justify-center items-center gap-4 text-nowrap">
					<span className="py-3 bg-clip-text text-transparent bg-[linear-gradient(to_right,theme(colors.slate.800),theme(colors.blue.950),theme(colors.stone.800),theme(colors.gray.800),theme(colors.indigo.950),theme(colors.neutral.800),theme(colors.sky.950),theme(colors.zinc.800),theme(colors.slate.800))] dark:bg-[linear-gradient(to_right,theme(colors.slate.200),theme(colors.blue.200),theme(colors.stone.200),theme(colors.gray.200),theme(colors.indigo.200),theme(colors.neutral.200),theme(colors.sky.200),theme(colors.zinc.200),theme(colors.slate.200))] bg-[length:200%_auto] animate-gradient">
						Let&apos;s Play Some Bingo...
					</span>
				</span>
			</div>
			<BingoSelect session={session as Session} />
		</div>
	);
}
