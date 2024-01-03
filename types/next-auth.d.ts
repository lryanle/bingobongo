import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    accessToken?: any;
    user: {
      id?: any;
    } & DefaultSession["user"];
  }

  interface User {
    // access_token: any
    // id: any
    // & DefaultSession["user"]
  }
}