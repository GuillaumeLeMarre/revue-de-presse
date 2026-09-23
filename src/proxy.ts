import { NextRequest, NextResponse } from "next/server";
import { unsealData } from "iron-session";
import type { SessionData } from "@/lib/session";

const COOKIE_NAME = "rvp_session";
const PUBLIC_PATHS = ["/login"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  const secret = process.env.SESSION_SECRET;

  if (!cookie || !secret) {
    return redirectToLogin(request);
  }

  try {
    const { authenticated } = await unsealData<SessionData>(cookie, {
      password: secret,
    });
    if (!authenticated) {
      return redirectToLogin(request);
    }
  } catch {
    return redirectToLogin(request);
  }

  return NextResponse.next();
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!api/cron|api/digest).*)"],
};
