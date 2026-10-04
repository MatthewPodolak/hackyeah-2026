import ReportedInnovations from "@/views/reported/ReportedInnovations";
import { getServerT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getServerT();
  return { title: t("Zgłoszone innowacje") };
}

export default function Page() {
  return <ReportedInnovations />;
}
