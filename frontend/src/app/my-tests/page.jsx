import MyTests from "@/views/community/MyTests";
import { getServerT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getServerT();
  return { title: t("Moje testy") };
}

export default function Page() {
  return <MyTests />;
}
