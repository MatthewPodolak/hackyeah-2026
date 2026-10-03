import IdeaWorkspace from "@/views/ideas/IdeaWorkspace";

export const metadata = { title: "Rozwijanie pomysłu" };

export default async function Page({ params }) {
  const { token } = await params;
  return <IdeaWorkspace token={decodeURIComponent(token)} />;
}
