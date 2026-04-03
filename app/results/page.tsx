import { ResultsShell } from "@/components/results/results-shell";
import { canAccessSystemHealth, requireUser } from "@/lib/auth";
import { getLatestUserReport, getUserReport, getUserReports } from "@/lib/reports";

export default async function ResultsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const reportIdParam = params?.reportId;
  const reportId = Array.isArray(reportIdParam) ? reportIdParam[0] : reportIdParam;
  const libraryReports = await getUserReports(user.uid);
  const report = reportId
    ? await getUserReport(user.uid, reportId)
    : libraryReports[0] ?? (await getLatestUserReport(user.uid));

  return (
    <ResultsShell
      record={report}
      libraryReports={libraryReports}
      userEmail={user.email}
      showSystemHealthLink={canAccessSystemHealth(user.email)}
    />
  );
}
