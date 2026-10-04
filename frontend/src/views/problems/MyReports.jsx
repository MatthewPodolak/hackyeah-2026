"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon, BubbleChatIcon, Location01Icon, Megaphone01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import LoadingStatus from "@/components/loading-status";
import StatusPill from "@/components/status-pill";
import { useAuth } from "@/api/context/AuthContext";
import { useMyProblems, useProblemsByTokens } from "@/api/hooks/useAdmin";
import { getProblemCategoryOption } from "@/lib/problemCategories";
import { problemStatus, problemTokens } from "@/lib/problems";
import { useScopedTokens } from "@/hooks/useScopedTokens";
import { PageHeader } from "@/components/page-header";

const dateFormat = new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium" });

function ReportCard({ item, token }) {
  const { problem, adminReply, updatedAt, gminaNote } = item;
  const category = getProblemCategoryOption(problem.category);

  return (
    <article aria-labelledby={`report-${problem.id}`} className="flex flex-col gap-3 rounded-2xl border border-border bg-card shadow-elevation-1 p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 id={`report-${problem.id}`} className="font-semibold break-words">{problem.title}</h2>
          <p className="text-xs text-muted-foreground">
            Zgłoszono {problem.localDate ? <time dateTime={problem.localDate}>{dateFormat.format(new Date(problem.localDate))}</time> : "—"}
            {token && <> · kod <code className="font-mono break-all">{token}</code></>}
          </p>
        </div>
        <StatusPill meta={problemStatus(problem.status)} />
      </div>
      {problem.description && <p className="text-sm text-muted-foreground whitespace-pre-line break-words">{problem.description}</p>}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <Badge variant="secondary"><span aria-hidden="true">{category.icon}</span> {category.label}</Badge>
        {problem.street && (
          <span className="flex items-center gap-1 text-muted-foreground">
            <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-4" aria-hidden="true" />
            <span className="sr-only">Miejsce: </span>{problem.street}
          </span>
        )}
      </div>
      {problem.status === "GMINA_REJECTED" && gminaNote && (
        <div className="rounded-xl bg-red-500/10 p-3 text-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-red-800 dark:text-red-300">Gmina odrzuciła zgłoszenie</p>
          <p className="whitespace-pre-line">{gminaNote}</p>
        </div>
      )}
      {adminReply ? (
        <div className="flex gap-2 rounded-xl bg-violet-500/10 p-3 text-sm">
          <HugeiconsIcon icon={BubbleChatIcon} strokeWidth={2} aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-violet-700 dark:text-violet-300" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-violet-800 dark:text-violet-300">Odpowiedź ROPS / samorządu</p>
            <p className="whitespace-pre-line">{adminReply}</p>
            {updatedAt && <p className="mt-1 text-xs text-muted-foreground">Zaktualizowano <time dateTime={updatedAt}>{dateFormat.format(new Date(updatedAt))}</time></p>}
          </div>
        </div>
      ) : (
        problem.status !== "GMINA_REJECTED" && (
          <p className="text-sm text-muted-foreground">
            {problem.status === "SUBMITTED" && problem.gminaId ? "Zgłoszenie czeka na ocenę gminy." : "Zgłoszenie czeka na odpowiedź."}
          </p>
        )
      )}
    </article>
  );
}

export default function MyReports() {
  const { isLogged } = useAuth();
  const { tokens, remember, forget } = useScopedTokens(problemTokens);
  const byTokens = useProblemsByTokens(tokens);
  const mine = useMyProblems(isLogged);
  const [code, setCode] = useState("");

  const seen = new Set();
  const items = [];
  tokens.forEach((token, i) => {
    const q = byTokens[i];
    if (q?.data) {
      seen.add(q.data.problem.id);
      items.push({ key: token, token, query: q });
    } else {
      items.push({ key: token, token, query: q });
    }
  });
  (mine.data ?? []).forEach((item) => {
    if (!seen.has(item.problem.id)) items.push({ key: `mine-${item.problem.id}`, token: item.trackingToken, data: item });
  });

  const loading = (tokens.length && byTokens.some((q) => q.isPending)) || (isLogged && mine.isPending);

  const addCode = (e) => {
    e.preventDefault();
    const value = code.trim();
    if (!value) return;
    remember(value);
    setCode("");
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-4 pt-18 pb-10 md:px-8">
        <PageHeader
          icon={Megaphone01Icon}
          title="Moje zgłoszenia"
          description={<>Status i odpowiedzi na zgłoszone przez Ciebie problemy. {isLogged ? "Widzisz zgłoszenia z konta i z tej przeglądarki." : "Bez logowania widzisz zgłoszenia wysłane z tej przeglądarki."}</>}
        />

        <form onSubmit={addCode} className="mb-8 flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 shadow-elevation-1">
          <label htmlFor="report-code" className="text-sm font-medium">Masz kod zgłoszenia z innego urządzenia?</label>
          <div className="flex gap-2">
            <Input id="report-code" value={code} autoComplete="off" placeholder="Wklej kod zgłoszenia" onChange={(e) => setCode(e.target.value)} />
            <Button type="submit" variant="outline">Dodaj</Button>
          </div>
        </form>

        {loading ? (
          <LoadingStatus label="Wczytywanie zgłoszeń" className="flex flex-col gap-3">
            <Skeleton className="h-40 w-full rounded-xl" />
          </LoadingStatus>
        ) : items.length ? (
          <div className="flex flex-col gap-4">
            {items.map(({ key, token, query, data }) => {
              if (data) return <ReportCard key={key} item={data} token={token} />;
              if (query?.data) return <ReportCard key={key} item={query.data} token={token} />;
              return (
                <div key={key} className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-outline p-4 text-sm">
                  <span className="min-w-0 text-muted-foreground">
                    Nie znaleziono zgłoszenia o kodzie <code className="break-all font-mono text-foreground">{token}</code>
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => forget(token)} aria-label={`Usuń z listy kod ${token}`}>Usuń</Button>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon"><HugeiconsIcon icon={Alert02Icon} strokeWidth={2} aria-hidden="true" /></EmptyMedia>
              <EmptyTitle>Nie masz jeszcze zgłoszeń</EmptyTitle>
              <EmptyDescription>Zgłoś problem na mapie, a jego status pojawi się tutaj.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </div>
  );
}
