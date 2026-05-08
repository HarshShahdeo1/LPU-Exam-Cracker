import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

import { getAdminAuth } from "@/lib/firebase-admin";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

export type SessionUser = {
  uid: string;
  email: string;
  name: string;
};

/**
 * For use in API route handlers (app/api/**).
 * Reads the session cookie directly from the incoming NextRequest and verifies it.
 * Returns a SessionUser or null if unauthenticated.
 */
export async function requireRequestUser(request: NextRequest): Promise<SessionUser | null> {
  try {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return null;
    }

    const decodedClaims = await getAdminAuth().verifySessionCookie(
      sessionCookie,
      true // checkRevoked
    );

    return {
      uid: decodedClaims.uid,
      email: decodedClaims.email ?? "",
      name: decodedClaims.name ?? decodedClaims.email ?? "User",
    };
  } catch {
    return null;
  }
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return null;
    }

    const decodedClaims = await getAdminAuth().verifySessionCookie(
      sessionCookie,
      true // checkRevoked
    );

    return decodedClaims;
  } catch {
    return null;
  }
}

/**
 * Like getCurrentUser but redirects to "/" if not authenticated.
 * Returns a user object with uid, email, and name.
 */
export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  return {
    uid: user.uid,
    email: user.email ?? "",
    name: user.name ?? user.email ?? "User",
  };
}

/**
 * Returns true if the given email is in the ADMIN_EMAILS env list.
 */
export function canAccessSystemHealth(email: string): boolean {
  return ADMIN_EMAILS.includes(email);
}

/**
 * Requires the user to be logged in AND in the ADMIN_EMAILS list.
 * Redirects to "/" if not authenticated, or "/upload" if not an admin.
 */
export async function requireSystemHealthAccess() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  const email = user.email ?? "";

  if (!canAccessSystemHealth(email)) {
    redirect("/upload");
  }

  return {
    uid: user.uid,
    email,
    name: user.name ?? email ?? "Admin",
  };
}
