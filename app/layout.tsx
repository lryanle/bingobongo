import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { SiteHeader } from "@/components/layout/siteheader";
import { Toaster as DefaultToaster } from "@/components/ui/toaster";
import { TailwindIndicator } from "@/components/layout/tailwind-indicator";
import { ThemeProvider } from "@/components/layout/providers";
import { Analytics } from "@/components/layout/analytics";
import { SiteFooter } from "@/components/layout/sitefooter";
import { Session, getServerSession } from "next-auth";
import NextAuthProvider from "@/components/layout/nextauth-provider";
import { authOptions } from "./api/auth/[...nextauth]/authOptions";

export const fontSans = FontSans({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
	title: {
		default: siteConfig.name,
		template: `%s - ${siteConfig.name}`,
	},
	metadataBase: new URL(siteConfig.url),
	description: siteConfig.description,
	keywords: [
		"Next.js",
		"React",
		"Tailwind CSS",
		"Server Components",
		"Radix UI",
		"MongoDB",
		"Prisma",
		"Typescript",
		"Bingo",
		"Bingo Bongo",
		"Multiplayer Bingo",
		"Customizable Bingo",
		"Advanced Bingo",
	],
	authors: [
		{
			name: "lryanle",
			url: "https://ryanlahlou.com",
		},
	],
	creator: "lryanle",
	openGraph: {
		type: "website",
		locale: "en_US",
		url: siteConfig.url,
		title: siteConfig.name,
		description: siteConfig.description,
		siteName: siteConfig.name,
		images: [
			{
				url: siteConfig.ogImage,
				width: 1200,
				height: 630,
				alt: siteConfig.name,
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: siteConfig.name,
		description: siteConfig.description,
		images: [siteConfig.ogImage],
		creator: "@lryanle",
	},
	icons: {
		icon: [
			{
				media: "(prefers-color-scheme: light)",
				url: "/images/favicon-light.png",
				href: "/images/favicon-light.png",
			},
			{
				media: "(prefers-color-scheme: dark)",
				url: "/images/favicon-dark.png",
				href: "/images/favicon-dark.png",
			},
		],
	},
	manifest: `${siteConfig.url}/site.webmanifest`,
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
	session: Session;
}>) {
	const session = await getServerSession(authOptions);

	return (
		<>
			<html lang="en" suppressHydrationWarning>
				<head />
				<body
					className={cn(
						"min-h-screen bg-background font-sans antialiased",
						fontSans.className
					)}
				>
					<NextAuthProvider session={session as Session}>
						<ThemeProvider
							attribute="class"
							defaultTheme="system"
							enableSystem
							disableTransitionOnChange
						>
							<div vaul-drawer-wrapper="">
								<div className="relative flex min-h-screen flex-col bg-background">
									<SiteHeader session={session} />
									<main className="flex-1">{children}</main>
									<SiteFooter />
								</div>
							</div>
							<TailwindIndicator />
							<Analytics />
							<DefaultToaster />
						</ThemeProvider>
					</NextAuthProvider>
				</body>
			</html>
		</>
	);
}
