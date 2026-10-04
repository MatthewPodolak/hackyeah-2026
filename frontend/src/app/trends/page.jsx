import Trends from "@/views/admin/Trends";
import { getServerT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getServerT();
  return { title: t("Trendy i potrzeby") };
}

export default function Page() {
  return <Trends />;
}
