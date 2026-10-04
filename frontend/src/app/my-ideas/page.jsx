import MyIdeas from "@/views/ideas/MyIdeas";
import { getServerT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getServerT();
  return { title: t("Moje propozycje") };
}

export default async function Page({ searchParams }) {
  const { call } = await searchParams;
  return <MyIdeas callId={call ? Number(call) : null} />;
}
