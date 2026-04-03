import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { getOptionalEnvList } from "@/lib/env";
import { getAdminAuth } from "@/lib/firebase-admin";

export type SessionUser = {
  uid: string;
  email: string | null;
  name: string | null;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const decodedToken = await getAdminAuth().verifySessionCookie(sessionCookie, true);

    return {
      uid: decodedToken.uid,
      email: decodedToken.email ?? null,
      name: decodedToken.name ?? null
    };
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  return user;
}

export function canAccessSystemHealth(email: string | null) {
  const adminEmails = getOptionalEnvList("ADMIN_EMAILS").map((entry) => entry.toLowerCase());

  if (!adminEmails.length) {
    return true;
  }

  return !!email && adminEmails.includes(email.toLowerCase());
}

export async function requireSystemHealthAccess() {
  const user = await requireUser();

  if (!canAccessSystemHealth(user.email)) {
    notFound();
  }

  return user;
}

export async function requireRequestUser(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const decodedToken = await getAdminAuth().verifySessionCookie(sessionCookie, true);

    return {
      uid: decodedToken.uid,
      email: decodedToken.email ?? null,
      name: decodedToken.name ?? null
    };
  } catch {
    return null;
  }
}
