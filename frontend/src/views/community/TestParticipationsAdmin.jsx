"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "cn";
import { HugeiconsIcon } from "@hugeicons/react";
import { TestTube01Icon, UserCheck01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import LoadingStatus from "@/components/loading-status";
import StatusPill from "@/components/status-pill";
import RoleGuard from "@/views/reported/RoleGuard";
import { ROLES } from "@/api/context/AuthContext";
import { useAdminParticipations, useSetParticipationStatus } from "@/api/hooks/useTesting";
import { useToast } from "@/helpers/ToastProvider";
import { PARTICIPATION_STATUS } from "@/lib/community";
import { useInnovationName } from "@/api/hooks/useAdmin";
import { PageHeader } from "@/components/page-header";

const dateFormat = new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "short" });
const STATUSES = ["PENDING", "ACCEPTED", "REJECTED"];

function FilterChip({ active, label, count, onClick }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "border-outline bg-background hover:bg-muted"
      )}
    >
      {label}
      <span className="sr-only">, liczba:</span>
      <span className={cn("rounded-full px-1.5 text-xs tabular-nums", active ? "bg-primary-foreground font-semibold text-primary" : "bg-muted text-muted-foreground")}>{count}</span>
    </button>
  );
}

function ParticipationsList() {
  const { data, isPending } = useAdminParticipations();
  const nameOf = useInnovationName();
  const setStatus = useSetParticipationStatus();
  const { showToast } = useToast();
  const [filter, setFilter] = useState("PENDING");

  const all = useMemo(() => data ?? [], [data]);
  const counts = useMemo(() => {
    const result = {};
    for (const p of all) result[p.status] = (result[p.status] ?? 0) + 1;
    return result;
  }, [all]);
  const visible = filter ? all.filter((p) => p.status === filter) : all;

  const change = async (p, status) => {
    try {
      await setStatus.mutateAsync({ id: p.id, status });
      showToast(`Zgłoszenie ${p.contactName ?? ""} oznaczono jako: ${PARTICIPATION_STATUS[status].label.toLowerCase()}`, "success");
    } catch {
      showToast(null, "error");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl px-4 pt-18 pb-10 md:px-8">
        <PageHeader
          icon={UserCheck01Icon}
          title="Zgłoszenia do testów"
          description="Osoby i organizacje, które chcą przetestować innowacje z biblioteki"
        />

        <div role="group" aria-label="Status zgłoszenia" className="mb-4 flex flex-wrap gap-2">
          <FilterChip active={!filter} label="Wszystkie" count={all.length} onClick={() => setFilter(null)} />
          {STATUSES.map((key) => (
            <FilterChip key={key} active={filter === key} label={PARTICIPATION_STATUS[key].label} count={counts[key] ?? 0} onClick={() => setFilter(key)} />
          ))}
        </div>
        <p aria-live="polite" aria-atomic="true" className="sr-only">{isPending ? "" : `Wyniki: ${visible.length}`}</p>

        {isPending ? (
          <LoadingStatus label="Wczytywanie zgłoszeń" className="flex flex-col gap-3">
            <Skeleton className="h-36 w-full rounded-xl" />
            <Skeleton className="h-36 w-full rounded-xl" />
          </LoadingStatus>
        ) : visible.length ? (
          <ul className="flex flex-col gap-3">
            {visible.map((p) => (
              <li key={p.id}>
                <article aria-labelledby={`tp-${p.id}`} className="flex flex-col gap-2 rounded-2xl border border-border bg-card shadow-elevation-1 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 id={`tp-${p.id}`} className="font-semibold">{p.contactName ?? "Mieszkaniec"}</h2>
                      <p className="text-sm text-muted-foreground">
                        chce przetestować:{" "}
                        <Link href={`/innovations/${p.innovationId}`} className="font-medium text-foreground underline underline-offset-4">
                          {nameOf(p.innovationId)}
                        </Link>
                      </p>
                    </div>
                    <StatusPill meta={PARTICIPATION_STATUS[p.status]} />
                  </div>
                  <p className="text-sm whitespace-pre-line break-words">{p.motivation}</p>
                  <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    {p.contactEmail && (
                      <div className="flex gap-1"><dt className="text-muted-foreground">Email:</dt><dd><a href={`mailto:${p.contactEmail}`} className="underline underline-offset-4 break-all">{p.contactEmail}</a></dd></div>
                    )}
                    {p.contactPhone && (
                      <div className="flex gap-1"><dt className="text-muted-foreground">Telefon:</dt><dd><a href={`tel:${p.contactPhone}`} className="underline underline-offset-4">{p.contactPhone}</a></dd></div>
                    )}
                    {p.createdAt && (
                      <div className="flex gap-1"><dt className="text-muted-foreground">Zgłoszono:</dt><dd><time dateTime={p.createdAt}>{dateFormat.format(new Date(p.createdAt))}</time></dd></div>
                    )}
                  </dl>
                  <div className="flex flex-wrap justify-end gap-2">
                    {p.status !== "PENDING" && (
                      <Button variant="ghost" size="sm" disabled={setStatus.isPending} onClick={() => change(p, "PENDING")}>
                        Przywróć do oczekujących<span className="sr-only">: {p.contactName}</span>
                      </Button>
                    )}
                    {p.status !== "REJECTED" && (
                      <Button variant="outline" size="sm" disabled={setStatus.isPending} onClick={() => change(p, "REJECTED")}>
                        Odrzuć<span className="sr-only"> zgłoszenie: {p.contactName}</span>
                      </Button>
                    )}
                    {p.status !== "ACCEPTED" && (
                      <Button size="sm" disabled={setStatus.isPending} onClick={() => change(p, "ACCEPTED")}>
                        Akceptuj<span className="sr-only"> zgłoszenie: {p.contactName}</span>
                      </Button>
                    )}
                  </div>
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={TestTube01Icon} strokeWidth={2} aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>Brak zgłoszeń</EmptyTitle>
              <EmptyDescription>{all.length ? "Żadne zgłoszenie nie ma tego statusu." : "Nikt jeszcze nie zgłosił się do testów."}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </div>
  );
}

export default function TestParticipationsAdmin() {
  return (
    <RoleGuard roles={[ROLES.ROPS]} description="Zgłoszenia do testów rozpatrują pracownicy ROPS.">
      <ParticipationsList />
    </RoleGuard>
  );
}
