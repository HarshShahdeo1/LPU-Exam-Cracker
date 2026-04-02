import { redirect } from "next/navigation";

import { AuthLanding } from "@/components/auth/auth-landing";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/upload");
  }

  return <AuthLanding />;
}

