import { UploadDashboard } from "@/components/dashboard/upload-dashboard";
import { requireUser } from "@/lib/auth";

export default async function UploadPage() {
  const user = await requireUser();

  return <UploadDashboard userEmail={user.email} userName={user.name} />;
}

