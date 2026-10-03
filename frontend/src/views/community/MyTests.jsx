"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { TestTube01Icon } from "@hugeicons/core-free-icons";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import LoadingStatus from "@/components/loading-status";
import StatusPill from "@/components/status-pill";
import RoleGuard from "@/views/reported/RoleGuard";
import { useMyParticipations } from "@/api/hooks/useTesting";
import { PARTICIPATION_STATUS } from "@/lib/community";
import { useInnovationName } from "@/api/hooks/useAdmin";

const dateFormat = new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium" });

function MyTestsList() {
  const participations = useMyParticipations();
  const nameOf = useInnovationName();

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-4 pt-14 pb-10 md:px-8">
        <header className="mb-6">
          <h1 className="font-heading text-2xl font-semibold">Moje testy</h1>
          <p className="text-muted-foreground">Twoje zgłoszenia do testowania innowacji i ich status</p>
        </header>

        {participations.isPending ? (
          <LoadingStatus label="Wczytywanie zgłoszeń" className="flex flex-col gap-3">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </LoadingStatus>
        ) : participations.data?.length ? (
          <ul className="flex flex-col gap-3">
            {participations.data.map((p) => (
              <li key={p.id} className="flex flex-col gap-2 rounded-xl border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="font-semibold">
                    <Link href={`/innovations/${p.innovationId}`} className="underline-offset-4 hover:underline">
                      {nameOf(p.innovationId)}
                    </Link>
                  </h2>
                  <StatusPill meta={PARTICIPATION_STATUS[p.status]} />
                </div>
                <p className="text-sm whitespace-pre-line break-words">{p.motivation}</p>
                {p.createdAt && (
                  <p className="text-xs text-muted-foreground">
                    Zgłoszono <time dateTime={p.createdAt}>{dateFormat.format(new Date(p.createdAt))}</time>
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={TestTube01Icon} strokeWidth={2} aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>Nie masz zgłoszeń do testów</EmptyTitle>
              <EmptyDescription>Wybierz innowację z biblioteki i kliknij „Zgłoś się do testów”.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Link href="/innovations" className={buttonVariants()}>Przejdź do biblioteki innowacji</Link>
            </EmptyContent>
          </Empty>
        )}
      </div>
    </div>
  );
}

export default function MyTests() {
  return (
    <RoleGuard description="Zaloguj się, aby zobaczyć swoje zgłoszenia do testów.">
      <MyTestsList />
    </RoleGuard>
  );
}
