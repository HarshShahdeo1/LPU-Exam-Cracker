import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { getAdminAuth } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { idToken?: string };

    if (!body.idToken) {
      return NextResponse.json({ error: "Missing Firebase ID token." }, { status: 400 });
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await getAdminAuth().createSessionCookie(body.idToken, {
      expiresIn
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionCookie,
      httpOnly: true,
      maxAge: expiresIn / 1000,
      path: "/",
      sameSite: "lax",
      secure: process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https") ?? false
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to create an authenticated session."
      },
      { status: 401 }
    );
  }
}
