import Innovations from "@/views/innovations/Innovations";
import { getServerT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await getServerT();
  return { title: t("Biblioteka innowacji") };
}

export default function Page() {

  return (
    <Innovations />
  );
}
