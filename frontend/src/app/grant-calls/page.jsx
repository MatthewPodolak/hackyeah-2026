import GrantCallsAdmin from "@/views/grants/GrantCallsAdmin";
import { getServerT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getServerT();
  return { title: t("Nabory grantowe") };
}

export default function Page() {
  return <GrantCallsAdmin />;
}
