import { UploadDashboard } from "@/components/dashboard/upload-dashboard";
import { canAccessSystemHealth, requireUser } from "@/lib/auth";
import { getUserReports } from "@/lib/reports";

export default async function UploadPage() {
  const user = await requireUser();
  const reports = await getUserReports(user.uid);
  const recentReports = reports.slice(0, 5).map((report) => ({
    id: report.id,
    fileName: report.fileName,
    courseTitle: report.report.courseTitle,
    createdAt: report.createdAt
  }));

  return (
    <UploadDashboard
      userEmail={user.email}
      userName={user.name}
      showSystemHealthLink={canAccessSystemHealth(user.email)}
      recentReports={recentReports}
    />
  );
}
