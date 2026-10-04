import { notFound } from "next/navigation";
import InnovationDetails from "@/views/innovations/InnovationDetails";
import { getInnovation } from "@/lib/innovations";
import { getServerT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const innovation = await getInnovation(id);
  const { t } = await getServerT();
  return { title: innovation?.name ?? t("Nie znaleziono innowacji") };
}

export default async function Page({ params }) {
  const { id } = await params;
  const innovation = await getInnovation(id);
  if (!innovation) notFound();

  return (
    <InnovationDetails innovation={innovation} />
  );
}
