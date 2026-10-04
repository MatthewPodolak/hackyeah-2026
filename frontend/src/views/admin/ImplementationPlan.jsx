"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Copy01Icon, PrinterIcon, Route01Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import RoleGuard from "@/views/reported/RoleGuard";
import { useCatalog, useImplementationPlan, useRegions } from "@/api/hooks/useAdmin";
import { useToast } from "@/helpers/ToastProvider";
import { useFormErrors } from "@/helpers/useFormErrors";
import { PageHeader } from "@/components/page-header";
import { localNumberFormat, t } from "@/lib/i18n";

const numberFormat = localNumberFormat();

function planToText(plan) {
  const lines = [plan.title, "", plan.summary, "", t("Model usługi:"), plan.serviceModel, "", t("Dopasowanie do gminy:"), plan.localContext, "", "Etapy:"];
  plan.steps?.forEach((s, i) => lines.push(`${i + 1}. [${s.phase}] ${s.title} (${s.duration}; odpowiada: ${s.responsible}) – ${s.description}`));
  lines.push("", "Partnerzy:");
  plan.partners?.forEach((p) => lines.push(`- ${p.name}: ${p.role}`));
  lines.push("", "Koszty (szacunek):");
  plan.costs?.forEach((c) => lines.push(`- ${c.item}: ${c.estimate}`));
  lines.push("", "Ryzyka:");
  plan.risks?.forEach((r) => lines.push(`- ${r.risk} → ${r.mitigation}`));
  lines.push("", t("Wskaźniki:"), ...(plan.indicators ?? []).map((x) => `- ${x}`), "", t("Źródła finansowania:"), ...(plan.fundingSources ?? []).map((x) => `- ${x}`));
  return lines.join("\n");
}

function Section({ title, children }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-heading text-lg font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function PlanView({ plan, headingRef }) {
  const { showToast } = useToast();
  const ctx = plan.context;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(planToText(plan));
      showToast("Skopiowano plan", "success");
    } catch {
      showToast(null, "error");
    }
  };

  return (
    <article aria-labelledby="plan-heading" className="flex flex-col gap-6 rounded-2xl border bg-card p-5 md:p-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("Plan wdrożenia przygotowany przez AI – do weryfikacji")}</p>
        <h2 id="plan-heading" ref={headingRef} tabIndex={-1} className="font-heading text-2xl font-semibold outline-none">{plan.title}</h2>
        <p>{plan.summary}</p>
        {ctx && (
          <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            <div className="flex gap-1"><dt className="text-muted-foreground">{t("Innowacja:")}</dt><dd><Link href={`/innovations/${ctx.innovationId}`} className="underline underline-offset-4">{ctx.innovationName}</Link></dd></div>
            <div className="flex gap-1"><dt className="text-muted-foreground">{t("Gmina:")}</dt><dd>{ctx.gminaLabel} ({ctx.powiatLabel})</dd></div>
            {ctx.population != null && <div className="flex gap-1"><dt className="text-muted-foreground">{t("Mieszkańcy:")}</dt><dd>{numberFormat.format(ctx.population)}</dd></div>}
            {ctx.urbanizationPct != null && <div className="flex gap-1"><dt className="text-muted-foreground">{t("Urbanizacja:")}</dt><dd>{String(ctx.urbanizationPct).replace(".", ",")}%</dd></div>}
          </dl>
        )}
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={copy}>
            <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} data-icon="inline-start" aria-hidden="true" />
            {t("Kopiuj plan")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <HugeiconsIcon icon={PrinterIcon} strokeWidth={2} data-icon="inline-start" aria-hidden="true" />
            {t("Drukuj lub zapisz PDF")}
          </Button>
        </div>
      </header>

      <Section title={t("Model usługi")}><p className="whitespace-pre-line">{plan.serviceModel}</p></Section>
      <Section title={t("Dopasowanie do gminy")}><p className="whitespace-pre-line">{plan.localContext}</p></Section>

      {plan.steps?.length > 0 && (
        <Section title={t("Etapy wdrożenia")}>
          <ol className="flex flex-col gap-3">
            {plan.steps.map((step, i) => (
              <li key={i} className="rounded-2xl border border-border p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Etap {i + 1}: {step.phase}</p>
                <h4 className="font-semibold">{step.title}</h4>
                <p className="text-sm whitespace-pre-line">{step.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {step.duration && <>Czas: {step.duration}</>}
                  {step.duration && step.responsible && " · "}
                  {step.responsible && <>Odpowiada: {step.responsible}</>}
                </p>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {plan.partners?.length > 0 && (
        <Section title={t("Partnerzy lokalni")}>
          <ul className="grid gap-2 sm:grid-cols-2">
            {plan.partners.map((p, i) => <li key={i} className="rounded-lg bg-muted/50 p-3 text-sm"><span className="font-medium">{p.name}</span> – {p.role}</li>)}
          </ul>
        </Section>
      )}

      {plan.costs?.length > 0 && (
        <Section title={t("Szacunkowe koszty")}>
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{t("Szacunkowe koszty wdrożenia")}</caption>
            <thead><tr className="border-b"><th scope="col" className="py-2 pr-4 font-medium">{t("Pozycja")}</th><th scope="col" className="py-2 font-medium">{t("Szacunek")}</th></tr></thead>
            <tbody>
              {plan.costs.map((c, i) => <tr key={i} className="border-b last:border-0"><td className="py-2 pr-4">{c.item}</td><td className="py-2 tabular-nums">{c.estimate}</td></tr>)}
            </tbody>
          </table>
          <p className="text-xs text-muted-foreground">{t("Kwoty są orientacyjne i wymagają weryfikacji z lokalnymi cenami.")}</p>
        </Section>
      )}

      {plan.risks?.length > 0 && (
        <Section title={t("Ryzyka i jak im zapobiec")}>
          <ul className="flex flex-col gap-2">
            {plan.risks.map((r, i) => <li key={i} className="text-sm"><span className="font-medium">{r.risk}</span> – {r.mitigation}</li>)}
          </ul>
        </Section>
      )}

      {plan.indicators?.length > 0 && (
        <Section title={t("Jak mierzyć efekty")}><ul className="list-disc pl-5 text-sm">{plan.indicators.map((x, i) => <li key={i}>{x}</li>)}</ul></Section>
      )}
      {plan.fundingSources?.length > 0 && (
        <Section title={t("Możliwe źródła finansowania")}><ul className="list-disc pl-5 text-sm">{plan.fundingSources.map((x, i) => <li key={i}>{x}</li>)}</ul></Section>
      )}
    </article>
  );
}

function PlanForm() {
  const params = useSearchParams();
  const catalog = useCatalog();
  const regions = useRegions();
  const generate = useImplementationPlan();
  const { showToast } = useToast();
  const { fail, clear, fieldProps, errorProps } = useFormErrors("plan");
  const [form, setForm] = useState({ innovationId: params.get("innovation") ?? "", gminaId: "", needs: "", budget: "", timeframe: "" });
  const headingRef = useRef(null);
  const plan = generate.data;

  useEffect(() => {
    if (plan) headingRef.current?.focus();
  }, [plan]);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    clear(key);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.innovationId) return fail("innovationId", t("Wybierz innowację"));
    if (!form.gminaId) return fail("gminaId", t("Wybierz gminę"));
    try {
      await generate.mutateAsync(form);
    } catch (err) {
      showToast(err?.status === 429 ? t("Za dużo zapytań do AI, spróbuj za chwilę") : err?.body?.message ?? null, "error");
    }
  };

  const innovations = [...(catalog.data ?? [])].sort((a, b) => a.name.localeCompare(b.name, "pl"));

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={submit} noValidate className="rounded-2xl border bg-card p-5 print:hidden">
        <FieldGroup>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="plan-innovationId">{t("Innowacja (wymagane)")}</FieldLabel>
              <NativeSelect {...fieldProps("innovationId")} required className="w-full" value={form.innovationId} onChange={set("innovationId")}>
                <NativeSelectOption value="" disabled>{catalog.isPending ? "Wczytywanie…" : t("Wybierz innowację")}</NativeSelectOption>
                {innovations.map((i) => <NativeSelectOption key={i.id} value={i.id}>{i.name}</NativeSelectOption>)}
              </NativeSelect>
              <FieldError {...errorProps("innovationId")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="plan-gminaId">{t("Gmina (wymagane)")}</FieldLabel>
              <NativeSelect {...fieldProps("gminaId")} required className="w-full" value={form.gminaId} onChange={set("gminaId")}>
                <NativeSelectOption value="" disabled>{regions.isPending ? "Wczytywanie…" : t("Wybierz gminę")}</NativeSelectOption>
                {(regions.data?.powiaty ?? []).map((powiat) => (
                  <NativeSelectOptGroup key={powiat.id} label={powiat.label}>
                    {powiat.gminy.map((g) => <NativeSelectOption key={g.id} value={g.id}>{g.label}</NativeSelectOption>)}
                  </NativeSelectOptGroup>
                ))}
              </NativeSelect>
              <FieldError {...errorProps("gminaId")} />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="plan-needs">{t("Potrzeby instytucji (opcjonalnie)")}</FieldLabel>
            <Textarea {...fieldProps("needs", "plan-needs-hint")} rows={3} maxLength={2000} value={form.needs} onChange={set("needs")} />
            <FieldDescription id="plan-needs-hint">{t("Np. dla kogo ma być usługa, ilu odbiorców, co już macie.")}</FieldDescription>
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="plan-budget">{t("Budżet (opcjonalnie)")}</FieldLabel>
              <Input {...fieldProps("budget")} maxLength={200} placeholder={t("np. do 50 000 zł rocznie")} value={form.budget} onChange={set("budget")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="plan-timeframe">{t("Horyzont czasowy (opcjonalnie)")}</FieldLabel>
              <Input {...fieldProps("timeframe")} maxLength={200} placeholder={t("np. 12 miesięcy")} value={form.timeframe} onChange={set("timeframe")} />
            </Field>
          </div>
          <Button type="submit" className="self-start" disabled={generate.isPending}>
            {generate.isPending ? <Spinner data-icon="inline-start" /> : <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} data-icon="inline-start" aria-hidden="true" />}
            {generate.isPending ? "AI przygotowuje plan…" : t("Przygotuj plan wdrożenia")}
          </Button>
        </FieldGroup>
      </form>
      <p role="status" className="sr-only">{generate.isPending ? t("Trwa przygotowywanie planu wdrożenia") : plan ? t("Plan wdrożenia jest gotowy") : ""}</p>
      {plan && <PlanView plan={plan} headingRef={headingRef} />}
    </div>
  );
}

export default function ImplementationPlan() {
  return (
    <RoleGuard description={t("Zaloguj się, aby przygotować plan wdrożenia innowacji w swojej gminie.")}>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl px-4 pt-18 pb-10 md:px-8">
          <PageHeader
            icon={Route01Icon}
            title={t("Plan wdrożenia innowacji")}
            description={t("Middleman innowacji: wybierz innowację i gminę, a AI zaproponuje, jak wdrożyć ją jako usługę społeczną dopasowaną do danych GUS o gminie.")}
          />
          <PlanForm />
        </div>
      </div>
    </RoleGuard>
  );
}
