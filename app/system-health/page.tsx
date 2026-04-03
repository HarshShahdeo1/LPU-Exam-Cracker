import { SystemHealthDashboard } from "@/components/system-health/system-health-dashboard";
import { requireSystemHealthAccess } from "@/lib/auth";
import { getSystemHealthSnapshot } from "@/lib/system-health";

export default async function SystemHealthPage() {
  const user = await requireSystemHealthAccess();
  const snapshot = await getSystemHealthSnapshot();

  return <SystemHealthDashboard snapshot={snapshot} userEmail={user.email} />;
}
