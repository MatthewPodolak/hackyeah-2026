import IdeaWorkspace from "@/views/ideas/IdeaWorkspace";
import { getServerT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getServerT();
  return { title: t("Rozwijanie pomysłu") };
}

export default async function Page({ params, searchParams }) {
  const { token } = await params;
  const { tab, call } = await searchParams;
  return <IdeaWorkspace token={decodeURIComponent(token)} initialTab={tab} initialCallId={call ? Number(call) : null} />;
}
