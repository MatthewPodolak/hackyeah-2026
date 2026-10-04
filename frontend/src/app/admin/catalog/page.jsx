import CatalogAdmin from "@/views/admin/CatalogAdmin";
import { getServerT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getServerT();
  return { title: t("Katalog wiedzy") };
}

export default function Page() {
  return <CatalogAdmin />;
}
