"use client";

import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon, Calendar03Icon, InboxIcon, Location01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import LoadingStatus from "@/components/loading-status";
import { useProblems } from "@/api/hooks/useProblemsQuery";
import RoleGuard from "@/views/reported/RoleGuard";
import { ROLES } from "@/api/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { getProblemCategoryOption, getTargetGroupOption } from "@/lib/problemCategories";

const dateFormat = new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "short" });

function normalize(text) {
  return (text ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l");
}

function ProblemsList() {
  const { data: problems, isPending } = useProblems();
  const [query, setQuery] = useState("");

  const sorted = useMemo(
    () => [...(problems ?? [])].sort((a, b) => (b.localDate ?? "").localeCompare(a.localDate ?? "")),
    [problems]
  );

  const words = normalize(query).split(/\s+/).filter(Boolean);
  const visible = sorted.filter((problem) => {
    const text = normalize([problem.title, problem.description, problem.street, getProblemCategoryOption(problem.category).label, getTargetGroupOption(problem.targetGroup).label].join(" "));
    return words.every((word) => text.includes(word));
  });

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl px-4 pt-14 pb-10 md:px-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-semibold">Zgłoszone problemy</h1>
            <p className="text-muted-foreground">Problemy zgłoszone przez mieszkańców na mapie</p>
          </div>
          <p aria-live="polite" aria-atomic="true" className="text-sm text-muted-foreground">
            <span className="sr-only">Wyniki: </span>
            {visible.length} z {sorted.length}
          </p>
        </header>

        <InputGroup role="search" className="mb-6">
          <InputGroupAddon>
            <HugeiconsIcon icon={Search01Icon} strokeWidth={2} aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            value={query}
            placeholder="Szukaj po tytule, opisie lub ulicy..."
            aria-label="Szukaj problemów"
            onChange={(e) => setQuery(e.target.value)}
          />
        </InputGroup>

        {isPending ? (
          <LoadingStatus label="Wczytywanie zgłoszonych problemów" className="flex flex-col gap-3">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </LoadingStatus>
        ) : visible.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {visible.map((problem) => (
              <li key={problem.id} className="flex gap-4 rounded-xl border bg-card p-4">
                <div aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-700 dark:text-red-400">
                  <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-5" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <h2 className="font-semibold leading-snug break-words">{problem.title}</h2>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary">
                      <span aria-hidden="true">{getProblemCategoryOption(problem.category).icon}</span> {getProblemCategoryOption(problem.category).label}
                    </Badge>
                    <Badge variant="outline">
                      <span aria-hidden="true">{getTargetGroupOption(problem.targetGroup).icon}</span> {getTargetGroupOption(problem.targetGroup).label}
                    </Badge>
                  </div>
                  {problem.description && (
                    <p className="text-sm text-muted-foreground whitespace-pre-line break-words">
                      {problem.description}
                    </p>
                  )}
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-4 shrink-0" aria-hidden="true" />
                      <span className="sr-only">Miejsce: </span>
                      <span className="break-words">
                        {problem.street ?? `${problem.latitude?.toFixed(5)}, ${problem.longitude?.toFixed(5)}`}
                      </span>
                    </span>
                    {problem.localDate && (
                      <span className="flex items-center gap-1.5 tabular-nums">
                        <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-4" aria-hidden="true" />
                        <span className="sr-only">Zgłoszono: </span>
                        <time dateTime={problem.localDate}>{dateFormat.format(new Date(problem.localDate))}</time>
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={InboxIcon} strokeWidth={2} />
              </EmptyMedia>
              <EmptyTitle>Brak problemów</EmptyTitle>
              <EmptyDescription>
                {sorted.length ? "Żaden problem nie pasuje do wyszukiwania." : "Nikt jeszcze nie zgłosił problemu."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </div>
  );
}

export default function ReportedProblems() {
  return (
    <RoleGuard roles={[ROLES.JST, ROLES.ROPS]}>
      <ProblemsList />
    </RoleGuard>
  );
}
