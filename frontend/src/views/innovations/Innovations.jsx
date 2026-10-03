import { InnovationCard } from "@/components/innovation-card";
import { getInnovations } from "@/lib/innovations";

export default async function Innovations() {
  const innovations = await getInnovations();

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl px-4 pt-14 pb-10 md:px-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="font-heading text-2xl font-semibold">Biblioteka innowacji</h1>
            <p className="text-muted-foreground">
              Sprawdzone rozwiązania z Biblioteki Innowacji Społecznych ROPS Kraków
            </p>
          </div>
          <p className="text-sm text-muted-foreground">{innovations.length} innowacji</p>
        </header>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {innovations.map((innovation) => (
            <li key={innovation.id}>
              <InnovationCard innovation={innovation} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
