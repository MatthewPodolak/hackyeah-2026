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
import { useGminyIndex, useRegions } from "@/api/hooks/useRegionsQuery";
import { gminaName } from "@/lib/gminy";
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from "@/components/ui/native-select";
import { useState } from "react";
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

function Insights({ gminaId }) {
  const insights = useInsights();
  const { showToast } = useToast();
  const data = insights.data;

  const run = async () => {
    try {
      await insights.mutateAsync(gminaId);
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

function Dashboard({ gminaId, showUnseen }) {
  const { data, isPending, isPlaceholderData } = useStats(gminaId);
  const gminy = useGminyIndex();

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
  const byGmina = (data.problemsByGmina ?? []).map((b) => ({ key: b.key, label: gminaName(gminy.get(b.key)) ?? b.key, value: b.count }));
  const tile = (key, label, hint) => t[key] !== undefined && <StatTile key={key} label={label} value={t[key]} hint={hint} />;
  const ideaWho = data.ideasByWho.map((b) => {
    const o = getTargetGroupOption(b.key);
    return { key: b.key, label: o.label, icon: o.icon, value: b.count };
  });

  return (
    <div className={`flex flex-col gap-6 transition-opacity ${isPlaceholderData ? "opacity-60" : ""}`} aria-busy={isPlaceholderData}>
      <p className="text-sm">
        <span className="text-muted-foreground">Zakres danych: </span>
        <strong>{data.scope ? `${data.scope.label}${data.scope.powiatLabel ? `, ${data.scope.powiatLabel}` : ""}` : "całe województwo małopolskie"}</strong>
        {data.scope?.population != null && <span className="text-muted-foreground"> · {new Intl.NumberFormat("pl-PL").format(data.scope.population)} mieszkańców (GUS)</span>}
      </p>
      <section aria-label="Najważniejsze liczby" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tile("problems", "Zgłoszone problemy", `${t.problemsOpen} w toku`)}
        {showUnseen && tile("problemsUnseen", "Nowe zgłoszenia", "jeszcze nieotwarte")}
        {tile("ideas", "Pomysły na innowacje", showUnseen ? `${t.ideasUnseen} nowych` : undefined)}
        {tile("testParticipations", "Zgłoszenia do testów", `${t.testParticipationsPending} oczekuje`)}
        {tile("conversationsOpen", "Otwarte rozmowy")}
        {tile("partnerships", "Ogłoszenia o partnerstwo")}
        {tile("reviews", "Opinie testerów")}
      </section>

      <Insights key={gminaId ?? "region"} gminaId={gminaId} />

      <ChartCard title="Zgłoszenia w czasie" description="Liczba zgłoszonych problemów w ostatnich 12 miesiącach">
        <ColumnChart rows={toMonthRows(data.problemsByMonth)} caption="Zgłoszenia w ostatnich 12 miesiącach" />
      </ChartCard>

      {byGmina.length > 0 && (
        <ChartCard title="Gminy z największą liczbą zgłoszeń" description="10 gmin, z których mieszkańcy zgłosili najwięcej problemów">
          <BarList rows={byGmina} caption="Zgłoszenia według gmin" labelHeader="Gmina" />
        </ChartCard>
      )}

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

      {!data.scope && (
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
      )}
    </div>
  );
}

function ScopeFilter({ value, onChange }) {
  const regions = useRegions();
  return (
    <div className="mb-6 flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="trends-gmina" className="text-sm font-medium">Zakres</label>
        <NativeSelect id="trends-gmina" className="sm:w-96" value={value ?? ""} onChange={(e) => onChange(e.target.value || null)}>
          <NativeSelectOption value="">Całe województwo</NativeSelectOption>
          {(regions.data?.powiaty ?? []).map((powiat) => (
            <NativeSelectOptGroup key={powiat.id} label={powiat.label}>
              {powiat.gminy.map((g) => <NativeSelectOption key={g.id} value={g.id}>{g.label}</NativeSelectOption>)}
            </NativeSelectOptGroup>
          ))}
        </NativeSelect>
      </div>
    </div>
  );
}

function TrendsPanel() {
  const { isRops, user } = useAuth();
  const gminy = useGminyIndex();
  const [gminaId, setGminaId] = useState(null);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl px-4 pt-18 pb-10 md:px-8">
        <header className="mb-6">
          <h1 className="font-heading text-3xl font-bold tracking-tight">Trendy i potrzeby</h1>
          <p className="text-muted-foreground">
            {isRops
              ? "Zagregowane dane o potrzebach mieszkańców Małopolski. Wybierz gminę, aby zobaczyć jej dane."
              : `Zagregowane dane o potrzebach mieszkańców gminy: ${gminaName(gminy.get(user?.gminaId)) ?? "…"}`}
          </p>
        </header>
        {isRops && <ScopeFilter value={gminaId} onChange={setGminaId} />}
        <Dashboard gminaId={isRops ? gminaId : null} showUnseen={isRops} />
      </div>
    </div>
  );
}

export default function Trends() {
  return (
    <RoleGuard roles={[ROLES.JST, ROLES.ROPS]}>
      <TrendsPanel />
    </RoleGuard>
  );
}
