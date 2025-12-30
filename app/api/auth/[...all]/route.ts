import { getAuth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const auth = await getAuth();
    if (!auth) {
      return NextResponse.json(
        { error: "Auth not initialized" },
        { status: 500 }
      );
    }
    return toNextJsHandler(auth).GET(request);
  } catch (error) {
    console.error("Error in auth GET handler:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuth();
    if (!auth) {
      return NextResponse.json(
        { error: "Auth not initialized" },
        { status: 500 }
      );
    }
    return toNextJsHandler(auth).POST(request);
  } catch (error) {
    console.error("Error in auth POST handler:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

