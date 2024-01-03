import prisma from "@/lib/prisma";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string
    })
  ],
  callbacks: {
    async session({ session, token, user }) {
      if (!session.user) {
        throw new Error("No session");
      }

      session.user.name = user.name;
      session.user.email = user.email;
      session.user.image = user.image;
      session.user.id = user.id;
      
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}