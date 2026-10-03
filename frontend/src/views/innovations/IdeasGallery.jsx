"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { BulbIcon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import LoadingStatus from "@/components/loading-status";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useProposal } from "@/api/context/ProposalContext";
import { READINESS } from "@/lib/ideas";
import { getTargetGroupOption } from "@/lib/problemCategories";

export default function IdeasGallery({ query }) {
  const { openProposal } = useProposal();

  if (query.isPending) {
    return (
      <LoadingStatus label="Wczytywanie pomysłów mieszkańców" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-56 w-full rounded-2xl" />
        ))}
      </LoadingStatus>
    );
  }

  const ideas = query.data ?? [];

  if (!ideas.length) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={BulbIcon} strokeWidth={2} />
          </EmptyMedia>
          <EmptyTitle>Jeszcze nie ma zaakceptowanych pomysłów</EmptyTitle>
          <EmptyDescription>Masz pomysł na innowację społeczną? Twój może być pierwszy!</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={() => openProposal()}>Zaproponuj innowację</Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {ideas.map((idea) => {
        const readiness = READINESS[idea.readiness];
        return (
          <li key={idea.id}>
            <article className="flex h-full flex-col gap-3 rounded-2xl border bg-card p-5">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                  <HugeiconsIcon icon={BulbIcon} strokeWidth={2} className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Pomysł mieszkańca</p>
                  <h2 className="font-semibold leading-snug break-words">{idea.title}</h2>
                </div>
              </div>
              {idea.essence && <p className="line-clamp-4 text-sm break-words">{idea.essence}</p>}
              {idea.problemDescription && (
                <p className="line-clamp-3 text-sm text-muted-foreground break-words">{idea.problemDescription}</p>
              )}
              <div className="mt-auto flex flex-wrap gap-1.5">
                {readiness && (
                  <Badge variant="secondary">
                    <span aria-hidden="true">{readiness.icon}</span> {readiness.label}
                  </Badge>
                )}
                {idea.whoCategories?.map((key) => {
                  const who = getTargetGroupOption(key);
                  return (
                    <Badge key={key} variant="outline">
                      <span aria-hidden="true">{who.icon}</span> {who.label}
                    </Badge>
                  );
                })}
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
