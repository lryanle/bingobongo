import Landing from "@/components/home/landing";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { Session } from "@/lib/auth";

export default async function Home() {
	const auth = await getAuth();
	const session = await auth.api.getSession({ headers: await headers() });

	return (
		<main className="h-full w-full">
			<div className="h-full w-full">
				<Landing session={session as Session} />
			</div>
		</main>
	);
}
