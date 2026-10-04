import InnovationsTabs from "@/views/innovations/InnovationsTabs";
import { getInnovations } from "@/lib/innovations";
import { PageHeader } from "@/components/page-header";
import { LibraryIcon } from "@hugeicons/core-free-icons";
import { getServerT } from "@/lib/i18n/server";

export default async function Innovations() {
  const innovations = await getInnovations();
  const { t } = await getServerT();

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl px-4 pt-18 pb-10 md:px-8">
        <PageHeader
          icon={LibraryIcon}
          title={t("Biblioteka innowacji")}
          description={t("Sprawdzone rozwiązania z Biblioteki Innowacji Społecznych ROPS Kraków")}
        />

        <InnovationsTabs innovations={innovations} />
      </div>
    </div>
  );
}
