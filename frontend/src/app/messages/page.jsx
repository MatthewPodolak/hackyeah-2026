import Messages from "@/views/community/Messages";
import { getServerT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getServerT();
  return { title: t("Wiadomości") };
}

export default function Page() {
  return <Messages />;
}
