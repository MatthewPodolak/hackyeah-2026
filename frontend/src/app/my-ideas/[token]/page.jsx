import IdeaWorkspace from "@/views/ideas/IdeaWorkspace";

export const metadata = { title: "Rozwijanie pomysłu" };

export default async function Page({ params, searchParams }) {
  const { token } = await params;
  const { tab, call } = await searchParams;
  return <IdeaWorkspace token={decodeURIComponent(token)} initialTab={tab} initialCallId={call ? Number(call) : null} />;
}
