import { notFound } from "next/navigation";
import InnovationDetails from "@/views/innovations/InnovationDetails";
import { getInnovation } from "@/lib/innovations";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const innovation = await getInnovation(id);
  return { title: innovation?.name ?? "Nie znaleziono innowacji" };
}

export default async function Page({ params }) {
  const { id } = await params;
  const innovation = await getInnovation(id);
  if (!innovation) notFound();

  return (
    <InnovationDetails innovation={innovation} />
  );
}
