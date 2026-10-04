import MyIdeas from "@/views/ideas/MyIdeas";

export const metadata = { title: "Moje propozycje" };

export default async function Page({ searchParams }) {
  const { call } = await searchParams;
  return <MyIdeas callId={call ? Number(call) : null} />;
}
