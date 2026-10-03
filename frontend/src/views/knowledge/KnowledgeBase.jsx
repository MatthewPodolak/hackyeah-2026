"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { LinkSquare02Icon } from "@hugeicons/core-free-icons";
import { Skeleton } from "@/components/ui/skeleton";
import { useKnowledgeResources } from "@/api/hooks/useCanvas";

const TYPES = {
  LIBRARY: { icon: "📚", label: "Biblioteka" },
  REPORT: { icon: "📊", label: "Raport" },
  PUBLICATION: { icon: "📰", label: "Publikacje" },
  CANVAS: { icon: "🧩", label: "Narzędzie warsztatowe" },
  MAP: { icon: "🗺️", label: "Mapa" },
  TOOL: { icon: "🛠️", label: "Narzędzie" },
  VIDEO: { icon: "🎬", label: "Wideo" },
  OTHER: { icon: "📎", label: "Inne" },
};

export default function KnowledgeBase() {
  const resources = useKnowledgeResources();

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl px-4 pt-14 pb-10 md:px-8">
        <header className="mb-6">
          <h1 className="font-heading text-2xl font-semibold">Baza wiedzy</h1>
          <p className="text-muted-foreground">Materiały ROPS i partnerów, które pomogą rozwinąć innowację społeczną</p>
        </header>

        {resources.isPending ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(resources.data ?? []).map((resource) => {
              const type = TYPES[resource.type] ?? TYPES.OTHER;
              return (
                <li key={resource.id}>
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-full flex-col gap-2 rounded-2xl border bg-card p-5 transition-shadow outline-none hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <span aria-hidden="true" className="text-3xl">{type.icon}</span>
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{type.label}</span>
                    <span className="font-semibold leading-snug">{resource.title}</span>
                    {resource.description && <span className="text-sm text-muted-foreground">{resource.description}</span>}
                    <span className="mt-auto flex items-center gap-1 text-sm font-medium text-primary">
                      Otwórz <HugeiconsIcon icon={LinkSquare02Icon} strokeWidth={2} className="size-4" />
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
