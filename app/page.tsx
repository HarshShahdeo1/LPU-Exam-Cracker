import { Suspense } from "react";
import { redirect } from "next/navigation";

import { AuthLanding } from "@/components/auth/auth-landing";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/upload");
  }

  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#f8f9fa]"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[#22000f] border-t-transparent" /></div>}>
      <AuthLanding />
    </Suspense>
  );
}

