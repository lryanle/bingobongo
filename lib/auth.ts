import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import clientPromise from "./mongodb";

async function initAuth() {
  const client = await clientPromise;
  const db = client.db();
  
  return betterAuth({
    database: mongodbAdapter(db, {
      client,
    }),
    emailAndPassword: {
      enabled: false,
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      },
    },
    secret: process.env.BETTER_AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000",
    basePath: "/api/auth",
  });
}

// Cache the auth instance
let authInstance: Awaited<ReturnType<typeof initAuth>> | null = null;

export async function getAuth() {
  authInstance ??= await initAuth();
  return authInstance;
}

// Export auth for server-side usage
export const auth = {
  api: {
    getSession: async (options: { headers: Headers | Promise<Headers> }) => {
      const instance = await getAuth();
      const headers = await Promise.resolve(options.headers);
      return instance.api.getSession({ headers });
    },
  },
};

export type Session = Awaited<ReturnType<typeof getAuth>>["$Infer"]["Session"];

