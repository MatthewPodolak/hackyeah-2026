import ReportedProblems from "@/views/reported/ReportedProblems";
import { getServerT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getServerT();
  return { title: t("Zgłoszone problemy") };
}

export default function Page() {
  return <ReportedProblems />;
}
