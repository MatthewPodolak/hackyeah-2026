"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Analytics01Icon, SparklesIcon } from "@hugeicons/core-free-icons";
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
import { PageHeader } from "@/components/page-header";
import { useSurveySummary } from "@/api/hooks/useSurvey";
import { SURVEY_ACCESS, SURVEY_AGE, SURVEY_LONELINESS } from "@/lib/survey";
import { localDateFormat, localNumberFormat, t } from "@/lib/i18n";

const monthLong = localDateFormat({ month: "long", year: "numeric" });
const monthShort = localDateFormat({ month: "short" });

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
      showToast(err?.status === 429 ? t("Za dużo zapytań do AI, spróbuj za chwilę") : err?.body?.message ?? null, "error");
    }
  };

  return (
    <section aria-labelledby="insights-heading" className="rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="insights-heading" className="font-semibold">{t("Podsumowanie trendów")}</h2>
          <p className="text-sm text-muted-foreground">{t("AI opisze najważniejsze zjawiska w danych i zaproponuje działania.")}</p>
        </div>
        <Button onClick={run} disabled={insights.isPending}>
          {insights.isPending ? <Spinner data-icon="inline-start" /> : <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} data-icon="inline-start" aria-hidden="true" />}
          {insights.isPending ? "AI analizuje…" : data ? t("Odśwież podsumowanie") : t("Podsumuj trendy")}
        </Button>
      </div>
      <p role="status" className="sr-only">{insights.isPending ? t("Trwa analiza trendów") : data ? t("Podsumowanie trendów jest gotowe") : ""}</p>
      {data && (
        <div className="mt-4 flex flex-col gap-3 text-sm">
          <p>{data.summary}</p>
          {data.trends?.length > 0 && (
            <div>
              <h3 className="font-medium">{t("Trendy")}</h3>
              <ul className="list-disc pl-5">{data.trends.map((item, i) => <li key={i}>{item}</li>)}</ul>
            </div>
          )}
          {data.recommendations?.length > 0 && (
            <div>
              <h3 className="font-medium">{t("Rekomendacje")}</h3>
              <ul className="list-disc pl-5">{data.recommendations.map((item, i) => <li key={i}>{item}</li>)}</ul>
            </div>
          )}
          <p className="text-xs text-muted-foreground">{t("Wygenerowane przez AI na podstawie zagregowanych danych – wymaga weryfikacji.")}</p>
        </div>
      )}
    </section>
  );
}

function SurveySection({ gminaId }) {
  const { data } = useSurveySummary(gminaId);
  if (!data) return null;

  const priorities = data.priorities.map((b) => {
    const o = getProblemCategoryOption(b.key);
    return { key: b.key, label: o.label, icon: o.icon, value: b.count };
  });
  const access = data.serviceAccess.map((b) => {
    const o = SURVEY_ACCESS.find((x) => String(x.value) === b.key);
    return { key: b.key, label: o?.label ?? b.key, icon: o?.icon, value: b.count };
  });
  const loneliness = data.loneliness.map((b) => ({ key: b.key, label: SURVEY_LONELINESS.find((x) => x.value === b.key)?.label ?? b.key, value: b.count }));
  const ages = data.ageGroups.map((b) => ({ key: b.key, label: SURVEY_AGE.find((x) => x.value === b.key)?.label ?? b.key, value: b.count }));
  const lonelyShare = data.total ? Math.round(((data.loneliness.find((b) => b.key === "OFTEN")?.count ?? 0) / data.total) * 100) : 0;

  return (
    <section aria-labelledby="survey-section" className="flex flex-col gap-4">
      <div>
        <h2 id="survey-section" className="font-heading text-xl font-bold tracking-tight">{t("Głos mieszkańców")}</h2>
        <p className="text-sm text-muted-foreground">{t("Wyniki szybkiej ankiety z mapy problemów: 4 pytania, tylko klikanie, bez logowania.")}</p>
      </div>
      {data.total === 0 ? (
        <p className="rounded-2xl border border-dashed border-outline p-6 text-sm text-muted-foreground">{t("Nikt jeszcze nie wypełnił ankiety w tym zakresie.")}</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label={t("Odpowiedzi")} value={data.total} hint={`${data.last30Days} w ostatnich 30 dniach`} />
            <div className="rounded-2xl border bg-card p-4">
              <p className="text-sm text-muted-foreground">{t("Łatwość uzyskania pomocy")}</p>
              <p className="text-3xl font-semibold">{data.averageAccess != null ? String(data.averageAccess).replace(".", ",") : "—"}<span className="text-base font-medium text-muted-foreground"> / 5</span></p>
              <p className="text-xs text-muted-foreground">{t("średnia ocen mieszkańców")}</p>
            </div>
            <div className="rounded-2xl border bg-card p-4">
              <p className="text-sm text-muted-foreground">{t("Często czuje samotność")}</p>
              <p className="text-3xl font-semibold">{lonelyShare}%</p>
              <p className="text-xs text-muted-foreground">{t("odpowiadający lub ktoś im bliski")}</p>
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title={t("Co wymaga poprawy")} description={t("Obszary wskazane przez mieszkańców (do 2 na osobę)")}>
              <BarList rows={priorities} caption={t("Obszary wymagające poprawy według ankiety")} labelHeader={t("Obszar")} />
            </ChartCard>
            <ChartCard title={t("Jak łatwo uzyskać pomoc")} description={t("Ocena dostępu do wsparcia w okolicy")}>
              <BarList rows={access} caption={t("Ocena łatwości uzyskania pomocy")} labelHeader={t("Ocena")} />
            </ChartCard>
            <ChartCard title={t("Samotność")} description={t("Jak często odpowiadający lub ktoś bliski czuje się samotny")}>
              <BarList rows={loneliness} caption={t("Częstotliwość samotności")} labelHeader={t("Odpowiedź")} />
            </ChartCard>
            <ChartCard title={t("Wiek odpowiadających")} description={t("Kto wypełnia ankietę")}>
              <BarList rows={ages} caption={t("Wiek odpowiadających")} labelHeader={t("Wiek")} />
            </ChartCard>
          </div>
        </>
      )}
    </section>
  );
}

function Dashboard({ gminaId, showUnseen }) {
  const { data, isPending, isPlaceholderData } = useStats(gminaId);
  const gminy = useGminyIndex();

  if (isPending || !data) {
    return <LoadingStatus label={t("Wczytywanie statystyk")} className="grid gap-4 md:grid-cols-2"><Skeleton className="h-48 rounded-2xl" /><Skeleton className="h-48 rounded-2xl" /></LoadingStatus>;
  }

  const totals = data.totals;
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
  const tile = (key, label, hint) => totals[key] !== undefined && <StatTile key={key} label={label} value={totals[key]} hint={hint} />;
  const ideaWho = data.ideasByWho.map((b) => {
    const o = getTargetGroupOption(b.key);
    return { key: b.key, label: o.label, icon: o.icon, value: b.count };
  });

  return (
    <div className={`flex flex-col gap-6 transition-opacity ${isPlaceholderData ? "opacity-60" : ""}`} aria-busy={isPlaceholderData}>
      <p className="text-sm">
        <span className="text-muted-foreground">{t("Zakres danych:")}{" "}</span>
        <strong>{data.scope ? `${data.scope.label}${data.scope.powiatLabel ? `, ${data.scope.powiatLabel}` : ""}` : t("całe województwo małopolskie")}</strong>
        {data.scope?.population != null && <span className="text-muted-foreground"> · {t("{count} mieszkańców (GUS)", { count: localNumberFormat().format(data.scope.population) })}</span>}
      </p>
      <section aria-label={t("Najważniejsze liczby")} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tile("problems", t("Zgłoszone problemy"), `${totals.problemsOpen} w toku`)}
        {showUnseen && tile("problemsUnseen", t("Nowe zgłoszenia"), "jeszcze nieotwarte")}
        {tile("ideas", t("Pomysły na innowacje"), showUnseen ? `${totals.ideasUnseen} nowych` : undefined)}
        {tile("testParticipations", t("Zgłoszenia do testów"), `${totals.testParticipationsPending} oczekuje`)}
        {tile("conversationsOpen", t("Otwarte rozmowy"))}
        {tile("partnerships", t("Ogłoszenia o partnerstwo"))}
        {tile("reviews", t("Opinie testerów"))}
      </section>

      <Insights key={gminaId ?? "region"} gminaId={gminaId} />

      <SurveySection gminaId={gminaId} />

      <ChartCard title={t("Zgłoszenia w czasie")} description={t("Liczba zgłoszonych problemów w ostatnich 12 miesiącach")}>
        <ColumnChart rows={toMonthRows(data.problemsByMonth)} caption={t("Zgłoszenia w ostatnich 12 miesiącach")} />
      </ChartCard>

      {byGmina.length > 0 && (
        <ChartCard title={t("Gminy z największą liczbą zgłoszeń")} description={t("10 gmin, z których mieszkańcy zgłosili najwięcej problemów")}>
          <BarList rows={byGmina} caption={t("Zgłoszenia według gmin")} labelHeader={t("Gmina")} />
        </ChartCard>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title={t("Problemy według kategorii")} description={t("Jakich obszarów dotyczą zgłoszenia")}>
          <BarList rows={categories} caption={t("Problemy według kategorii")} />
        </ChartCard>
        <ChartCard title={t("Problemy według grupy")} description={t("Kogo dotyczą zgłoszenia")}>
          <BarList rows={groups} caption={t("Problemy według grupy")} labelHeader={t("Grupa")} />
        </ChartCard>
        <ChartCard title={t("Status zgłoszeń")} description={t("Na jakim etapie są zgłoszone problemy")}>
          <BarList rows={statuses} caption={t("Status zgłoszeń")} labelHeader={t("Status")} />
        </ChartCard>
        <ChartCard title={t("Pomysły według statusu")} description={t("Postęp weryfikacji propozycji mieszkańców")}>
          <BarList rows={ideaStatuses} caption={t("Pomysły według statusu")} labelHeader={t("Status")} />
        </ChartCard>
        <ChartCard title={t("Pomysły według etapu")} description={t("Jak dojrzałe są zgłaszane pomysły")}>
          <BarList rows={readiness} caption={t("Pomysły według etapu realizacji")} labelHeader={t("Etap")} />
        </ChartCard>
        <ChartCard title={t("Dla kogo są pomysły")} description={t("Grupy docelowe wskazane w propozycjach")}>
          {ideaWho.length ? <BarList rows={ideaWho} caption={t("Grupy docelowe pomysłów")} labelHeader={t("Grupa")} /> : <p className="text-sm text-muted-foreground">{t("Brak danych.")}</p>}
        </ChartCard>
      </div>

      {!data.scope && (
      <ChartCard title={t("Najczęściej testowane innowacje")} description={t("Zgłoszenia do testów i opinie testerów")}>
        {data.mostWantedInnovations.length ? (
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{t("Najczęściej testowane innowacje")}</caption>
            <thead>
              <tr className="border-b">
                <th scope="col" className="py-2 pr-4 font-medium">{t("Innowacja")}</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">{t("Zgłoszenia do testów")}</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">{t("Opinie")}</th>
                <th scope="col" className="py-2 text-right font-medium">{t("Średnia ocena")}</th>
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
          <p className="text-sm text-muted-foreground">{t("Nikt jeszcze nie zgłosił się do testów.")}</p>
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
        <label htmlFor="trends-gmina" className="text-sm font-medium">{t("Zakres")}</label>
        <NativeSelect id="trends-gmina" className="sm:w-96" value={value ?? ""} onChange={(e) => onChange(e.target.value || null)}>
          <NativeSelectOption value="">{t("Całe województwo")}</NativeSelectOption>
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
        <PageHeader
          icon={Analytics01Icon}
          title={t("Trendy i potrzeby")}
          description={isRops
            ? t("Zagregowane dane o potrzebach mieszkańców Małopolski. Wybierz gminę, aby zobaczyć jej dane.")
            : t("Zagregowane dane o potrzebach mieszkańców gminy: {gmina}", { gmina: gminaName(gminy.get(user?.gminaId)) ?? "…" })}
        />
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
