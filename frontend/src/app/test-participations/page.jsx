import TestParticipationsAdmin from "@/views/community/TestParticipationsAdmin";
import { getServerT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getServerT();
  return { title: t("Zgłoszenia do testów") };
}

export default function Page() {
  return <TestParticipationsAdmin />;
}
