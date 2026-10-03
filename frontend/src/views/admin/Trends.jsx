"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import LoadingStatus from "@/components/loading-status";
import { BarList, ChartCard, ColumnChart, StatTile } from "@/components/charts";
import RoleGuard from "@/views/reported/RoleGuard";
import { ROLES, useAuth } from "@/api/context/AuthContext";
import { useInsights, useStats } from "@/api/hooks/useAdmin";
import { useToast } from "@/helpers/ToastProvider";
import { getProblemCategoryOption, getTargetGroupOption } from "@/lib/problemCategories";
import { PROBLEM_STATUS } from "@/lib/problems";
import { IDEA_STATUS, READINESS } from "@/lib/ideas";

const monthLong = new Intl.DateTimeFormat("pl-PL", { month: "long", year: "numeric" });
const monthShort = new Intl.DateTimeFormat("pl-PL", { month: "short" });

function toMonthRows(buckets) {
  return buckets.map((b) => {
    const [y, m] = b.key.split("-").map(Number);
    const date = new Date(y, m - 1, 1);
    return { key: b.key, label: monthLong.format(date), short: monthShort.format(date).replace(".", ""), value: b.count };
  });
}

function Insights() {
  const insights = useInsights();
  const { showToast } = useToast();
  const data = insights.data;

  const run = async () => {
    try {
      await insights.mutateAsync();
    } catch (err) {
      showToast(err?.status === 429 ? "Za dużo zapytań do AI, spróbuj za chwilę" : err?.body?.message ?? null, "error");
    }
  };

  return (
    <section aria-labelledby="insights-heading" className="rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="insights-heading" className="font-semibold">Podsumowanie trendów</h2>
          <p className="text-sm text-muted-foreground">AI opisze najważniejsze zjawiska w danych i zaproponuje działania.</p>
        </div>
        <Button onClick={run} disabled={insights.isPending}>
          {insights.isPending ? <Spinner data-icon="inline-start" /> : <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} data-icon="inline-start" aria-hidden="true" />}
          {insights.isPending ? "AI analizuje…" : data ? "Odśwież podsumowanie" : "Podsumuj trendy"}
        </Button>
      </div>
      <p role="status" className="sr-only">{insights.isPending ? "Trwa analiza trendów" : data ? "Podsumowanie trendów jest gotowe" : ""}</p>
      {data && (
        <div className="mt-4 flex flex-col gap-3 text-sm">
          <p>{data.summary}</p>
          {data.trends?.length > 0 && (
            <div>
              <h3 className="font-medium">Trendy</h3>
              <ul className="list-disc pl-5">{data.trends.map((t, i) => <li key={i}>{t}</li>)}</ul>
            </div>
          )}
          {data.recommendations?.length > 0 && (
            <div>
              <h3 className="font-medium">Rekomendacje</h3>
              <ul className="list-disc pl-5">{data.recommendations.map((t, i) => <li key={i}>{t}</li>)}</ul>
            </div>
          )}
          <p className="text-xs text-muted-foreground">Wygenerowane przez AI na podstawie zagregowanych danych – wymaga weryfikacji.</p>
        </div>
      )}
    </section>
  );
}

function Dashboard() {
  const { isRops } = useAuth();
  const { data, isPending } = useStats();

  if (isPending || !data) {
    return <LoadingStatus label="Wczytywanie statystyk" className="grid gap-4 md:grid-cols-2"><Skeleton className="h-48 rounded-2xl" /><Skeleton className="h-48 rounded-2xl" /></LoadingStatus>;
  }

  const t = data.totals;
  const categories = data.problemsByCategory.map((b) => {
    const o = getProblemCategoryOption(b.key);
    return { key: b.key, label: o.label, icon: o.icon, value: b.count };
  });
  const groups = data.problemsByTargetGroup.map((b) => {
    const o = getTargetGroupOption(b.key);
    return { key: b.key, label: o.label, icon: o.icon, value: b.count };
  });
  const statuses = data.problemsByStatus.map((b) => ({ key: b.key, label: PROBLEM_STATUS[b.key]?.label ?? b.key, value: b.count }));
  const ideaStatuses = data.ideasByStatus.map((b) => ({ key: b.key, label: IDEA_STATUS[b.key]?.label ?? b.key, value: b.count }));
  const readiness = data.ideasByReadiness.map((b) => ({ key: b.key, label: READINESS[b.key]?.label ?? b.key, value: b.count }));
  const ideaWho = data.ideasByWho.map((b) => {
    const o = getTargetGroupOption(b.key);
    return { key: b.key, label: o.label, icon: o.icon, value: b.count };
  });

  return (
    <div className="flex flex-col gap-6">
      <section aria-label="Najważniejsze liczby" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Zgłoszone problemy" value={t.problems} hint={`${t.problemsOpen} w toku`} />
        <StatTile label="Nowe zgłoszenia" value={t.problemsUnseen} hint="jeszcze nieotwarte" />
        <StatTile label="Pomysły na innowacje" value={t.ideas} hint={`${t.ideasUnseen} nowych`} />
        <StatTile label="Zgłoszenia do testów" value={t.testParticipations} hint={`${t.testParticipationsPending} oczekuje`} />
        <StatTile label="Otwarte rozmowy" value={t.conversationsOpen} />
        <StatTile label="Ogłoszenia o partnerstwo" value={t.partnerships} />
        <StatTile label="Opinie testerów" value={t.reviews} />
        {isRops && <StatTile label="Konta czekające na akceptację" value={t.pendingAccounts} />}
      </section>

      <Insights />

      <ChartCard title="Zgłoszenia w czasie" description="Liczba zgłoszonych problemów w ostatnich 12 miesiącach">
        <ColumnChart rows={toMonthRows(data.problemsByMonth)} caption="Zgłoszenia w ostatnich 12 miesiącach" />
      </ChartCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Problemy według kategorii" description="Jakich obszarów dotyczą zgłoszenia">
          <BarList rows={categories} caption="Problemy według kategorii" />
        </ChartCard>
        <ChartCard title="Problemy według grupy" description="Kogo dotyczą zgłoszenia">
          <BarList rows={groups} caption="Problemy według grupy" labelHeader="Grupa" />
        </ChartCard>
        <ChartCard title="Status zgłoszeń" description="Na jakim etapie są zgłoszone problemy">
          <BarList rows={statuses} caption="Status zgłoszeń" labelHeader="Status" />
        </ChartCard>
        <ChartCard title="Pomysły według statusu" description="Postęp weryfikacji propozycji mieszkańców">
          <BarList rows={ideaStatuses} caption="Pomysły według statusu" labelHeader="Status" />
        </ChartCard>
        <ChartCard title="Pomysły według etapu" description="Jak dojrzałe są zgłaszane pomysły">
          <BarList rows={readiness} caption="Pomysły według etapu realizacji" labelHeader="Etap" />
        </ChartCard>
        <ChartCard title="Dla kogo są pomysły" description="Grupy docelowe wskazane w propozycjach">
          {ideaWho.length ? <BarList rows={ideaWho} caption="Grupy docelowe pomysłów" labelHeader="Grupa" /> : <p className="text-sm text-muted-foreground">Brak danych.</p>}
        </ChartCard>
      </div>

      <ChartCard title="Najczęściej testowane innowacje" description="Zgłoszenia do testów i opinie testerów">
        {data.mostWantedInnovations.length ? (
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Najczęściej testowane innowacje</caption>
            <thead>
              <tr className="border-b">
                <th scope="col" className="py-2 pr-4 font-medium">Innowacja</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">Zgłoszenia do testów</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">Opinie</th>
                <th scope="col" className="py-2 text-right font-medium">Średnia ocena</th>
              </tr>
            </thead>
            <tbody>
              {data.mostWantedInnovations.map((i) => (
                <tr key={i.id} className="border-b last:border-0">
                  <th scope="row" className="py-2 pr-4 font-normal"><Link href={`/innovations/${i.id}`} className="underline underline-offset-4">{i.name}</Link></th>
                  <td className="py-2 pr-4 text-right tabular-nums">{i.participations}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{i.reviews}</td>
                  <td className="py-2 text-right tabular-nums">{i.reviews ? String(i.averageRating).replace(".", ",") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-muted-foreground">Nikt jeszcze nie zgłosił się do testów.</p>
        )}
      </ChartCard>
    </div>
  );
}

export default function Trends() {
  return (
    <RoleGuard roles={[ROLES.JST, ROLES.ROPS]}>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl px-4 pt-14 pb-10 md:px-8">
          <header className="mb-6">
            <h1 className="font-heading text-2xl font-semibold">Trendy i potrzeby</h1>
            <p className="text-muted-foreground">Zagregowane dane o potrzebach mieszkańców Małopolski z platformy HUBMI</p>
          </header>
          <Dashboard />
        </div>
      </div>
    </RoleGuard>
  );
}
