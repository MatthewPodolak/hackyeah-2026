import MyReports from "@/views/problems/MyReports";
import { getServerT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getServerT();
  return { title: t("Moje zgłoszenia") };
}

export default function Page() {
  return <MyReports />;
}
