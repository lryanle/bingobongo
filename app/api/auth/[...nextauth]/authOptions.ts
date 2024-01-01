import NextAuth from "next-auth"
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import clientPromise from "@/lib/mongodb";

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
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