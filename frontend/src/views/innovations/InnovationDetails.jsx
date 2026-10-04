import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, Download04Icon, File02Icon, LinkSquare02Icon, Pdf01Icon } from "@hugeicons/core-free-icons";

import { buttonVariants } from "@/components/ui/button";
import { InnovationBadges, InnovationCover } from "@/components/innovation-card";
import { getDisabilityType, getYoutubeEmbedUrl } from "@/lib/innovations";
import InnovationTesting from "@/components/innovation-testing";

// Fields come straight from the ROPS innovation pages (sections 1–5); empty ones are skipped
const SECTIONS = [
  { field: "description", title: "Na czym polega?" },
  { field: "problem", title: "Jaki problem rozwiązuje?" },
  { field: "targetGroupDescription", title: "Dla kogo?" },
  { field: "whoCanImplement", title: "Kto może wdrożyć?" },
  { field: "effectiveness", title: "Czy to działa?" },
];

const MATERIALS = [
  { key: "leaflet", label: "Ulotka (PDF)", icon: Pdf01Icon },
  { key: "materials", label: "Materiały do pobrania (ZIP)", icon: Download04Icon },
  { key: "usageRules", label: "Zasady wykorzystania", icon: File02Icon },
  { key: "details", label: "Strona innowacji w ROPS", icon: LinkSquare02Icon },
];

export default function InnovationDetails({ innovation }) {
  const videoUrl = getYoutubeEmbedUrl(innovation);
  const materials = MATERIALS.filter(({ key }) => innovation.links[key]);
  const disabilityTypes = innovation.disabilityTypes.map(getDisabilityType);

  return (
    <div className="flex-1 overflow-y-auto">
      <article className="mx-auto w-full max-w-3xl px-4 pt-18 pb-12 md:px-8">
        <Link
          href="/innovations"
          className={buttonVariants({ variant: "ghost", size: "sm", className: "mb-4 -ml-3" })}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} aria-hidden="true" /> Wróć do listy
        </Link>

        <div className="mb-8 overflow-hidden rounded-3xl border border-border shadow-elevation-2">
          {videoUrl ? (
            <iframe
              src={videoUrl}
              title={`Film o innowacji: ${innovation.name}`}
              className="aspect-video w-full"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          ) : (
            <InnovationCover innovation={innovation} />
          )}
        </div>

        <header className="mb-8 space-y-3">
          <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">{innovation.name}</h1>
          {innovation.shortDescription && (
            <p className="text-lg text-muted-foreground">{innovation.shortDescription}</p>
          )}
          <InnovationBadges innovation={innovation} />
          {disabilityTypes.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Rodzaj niepełnosprawności: {disabilityTypes.join(", ")}
            </p>
          )}
          {innovation.disseminationProgram && (
            <p className="text-sm">
              <span aria-hidden="true">⭐</span> Innowacja wybrana do upowszechniania w projekcie „
              {innovation.disseminationProgram.toLowerCase()}”
            </p>
          )}
        </header>

        <div className="flex flex-col gap-4">
          {SECTIONS.filter(({ field }) => innovation[field]).map(({ field, title }) => (
            <section key={field} aria-labelledby={`section-${field}`} className="rounded-2xl border border-border bg-card p-5 shadow-elevation-1 sm:p-6">
              <h2 id={`section-${field}`} className="mb-2 font-heading text-lg font-semibold tracking-tight">
                {title}
              </h2>
              <p className="leading-relaxed whitespace-pre-line">{innovation[field]}</p>
            </section>
          ))}
        </div>

        {materials.length > 0 && (
          <section aria-labelledby="section-materials" className="mt-8">
            <h2 id="section-materials" className="mb-3 font-heading text-lg font-semibold tracking-tight">
              Materiały
            </h2>
            <ul className="flex flex-wrap gap-2">
              {materials.map(({ key, label, icon }) => (
                <li key={key}>
                  <a
                    href={innovation.links[key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({ variant: "outline" })}
                  >
                    <HugeiconsIcon icon={icon} strokeWidth={2} aria-hidden="true" />
                    {label}
                    <span className="sr-only"> (otwiera się w nowej karcie)</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <InnovationTesting innovationId={innovation.id} innovationName={innovation.name} />

        <p className="mt-10 border-t border-border pt-4 text-sm text-muted-foreground">
          Źródło: Biblioteka Innowacji Społecznych ROPS Kraków. Pytania o wdrożenie:{" "}
          <a href="mailto:iws@rops.krakow.pl" className="underline underline-offset-4">
            iws@rops.krakow.pl
          </a>
        </p>
      </article>
    </div>
  );
}
