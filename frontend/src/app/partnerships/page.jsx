import Partnerships from "@/views/community/Partnerships";
import { getServerT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getServerT();
  return { title: t("Partnerstwa") };
}

export default function Page() {
  return <Partnerships />;
}
