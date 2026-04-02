import { ResultsShell } from "@/components/results/results-shell";
import { requireUser } from "@/lib/auth";
import { getLatestUserReport, getUserReport } from "@/lib/reports";

export default async function ResultsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const reportIdParam = params?.reportId;
  const reportId = Array.isArray(reportIdParam) ? reportIdParam[0] : reportIdParam;
  const report = reportId
    ? await getUserReport(user.uid, reportId)
    : await getLatestUserReport(user.uid);

  return <ResultsShell record={report} userEmail={user.email} />;
}
