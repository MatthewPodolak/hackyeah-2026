import InnovationsTabs from "@/views/innovations/InnovationsTabs";
import { getInnovations } from "@/lib/innovations";

export default async function Innovations() {
  const innovations = await getInnovations();

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl px-4 pt-18 pb-10 md:px-8">
        <header className="mb-4">
          <h1 className="font-heading text-3xl font-bold tracking-tight">Biblioteka innowacji</h1>
          <p className="text-muted-foreground">
            Sprawdzone rozwiązania z Biblioteki Innowacji Społecznych ROPS Kraków
          </p>
        </header>

        <InnovationsTabs innovations={innovations} />
      </div>
    </div>
  );
}
