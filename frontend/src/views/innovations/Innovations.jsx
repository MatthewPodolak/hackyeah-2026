import InnovationsTabs from "@/views/innovations/InnovationsTabs";
import { getInnovations } from "@/lib/innovations";
import { PageHeader } from "@/components/page-header";
import { LibraryIcon } from "@hugeicons/core-free-icons";

export default async function Innovations() {
  const innovations = await getInnovations();

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl px-4 pt-18 pb-10 md:px-8">
        <PageHeader
          icon={LibraryIcon}
          title="Biblioteka innowacji"
          description="Sprawdzone rozwiązania z Biblioteki Innowacji Społecznych ROPS Kraków"
        />

        <InnovationsTabs innovations={innovations} />
      </div>
    </div>
  );
}
