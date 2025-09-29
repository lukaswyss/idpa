import { destroySession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  await destroySession();
  return NextResponse.redirect(new URL("/", request.url));
}


