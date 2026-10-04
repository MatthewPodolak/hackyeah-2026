"use client";

import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, ArrowRight01Icon, Calendar03Icon, Coins01Icon, Delete02Icon, Edit02Icon, LinkSquare02Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { cn } from "cn";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import LoadingStatus from "@/components/loading-status";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { useFormErrors } from "@/helpers/useFormErrors";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ROLES, useAuth } from "@/api/context/AuthContext";
import { useDeleteGrantCall, useGrantCalls, useSaveGrantCall } from "@/api/hooks/useGrantCalls";
import { APPLICANT_TYPES, CALL_PHASES, FILL_BY, callCriteria, callPhase, callSections, daysLeft, plnFormat } from "@/lib/grants";
import { useToast } from "@/helpers/ToastProvider";
import { PageHeader } from "@/components/page-header";
import { localDateFormat, localize, t, tp } from "@/lib/i18n";

const dateFormat = localDateFormat({ dateStyle: "medium" });
const EMPTY = { name: "", description: "", openFrom: "", openTo: "", requiredSections: "" };

function GrantForm({ initial, onDone }) {
  const [form, setForm] = useState(initial);
  const save = useSaveGrantCall();
  const { showToast } = useToast();
  const { fail, clear, fieldProps, errorProps } = useFormErrors("g");
  const headingRef = useRef(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    clear(key);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return fail("name", t("Podaj nazwę naboru"));
    if (!form.openFrom) return fail("openFrom", t("Podaj datę rozpoczęcia naboru"));
    if (!form.openTo) return fail("openTo", t("Podaj datę zakończenia naboru"));
    if (form.openTo < form.openFrom) return fail("openTo", t("Data końca nie może być przed datą początku"));
    try {
      await save.mutateAsync({ ...form, name: form.name.trim() });
      showToast(initial.id ? t("Zapisano nabór") : t("Dodano nabór"), "success");
      onDone();
    } catch (err) {
      if (err?.body?.message) fail("name", err.body.message);
      else showToast(null, "error");
    }
  };

  return (
    <form onSubmit={submit} noValidate aria-labelledby="g-form-heading" className="rounded-2xl border border-border bg-card shadow-elevation-1 p-5">
      <h2 id="g-form-heading" ref={headingRef} tabIndex={-1} className="mb-4 font-semibold outline-none">{initial.id ? t("Edycja naboru: {name}", { name: initial.name }) : t("Nowy nabór")}</h2>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="g-name">{t("Nazwa naboru (wymagane)")}</FieldLabel>
          <Input {...fieldProps("name")} required value={form.name} placeholder={t("np. Małopolski Inkubator Innowacji 2026")} onChange={set("name")} />
          <FieldError {...errorProps("name")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="g-openFrom">{t("Od (wymagane)")}</FieldLabel>
            <Input {...fieldProps("openFrom")} required type="date" value={form.openFrom} onChange={set("openFrom")} />
            <FieldError {...errorProps("openFrom")} />
          </Field>
          <Field>
            <FieldLabel htmlFor="g-openTo">{t("Do (wymagane)")}</FieldLabel>
            <Input {...fieldProps("openTo")} required type="date" value={form.openTo} onChange={set("openTo")} />
            <FieldError {...errorProps("openTo")} />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="g-desc">{t("Opis")}</FieldLabel>
          <Textarea id="g-desc" rows={3} value={form.description ?? ""} placeholder={t("Cel naboru, kto może aplikować, kwoty dofinansowania")} onChange={set("description")} />
        </Field>
        <Field>
          <FieldLabel htmlFor="g-sections">{t("Wymagane sekcje wniosku")}</FieldLabel>
          <Textarea id="g-sections" aria-describedby="g-sections-hint" rows={4} value={form.requiredSections ?? ""} placeholder={t("Opis problemu\nGrupa docelowa\nOpis rozwiązania\nHarmonogram\nBudżet")} onChange={set("requiredSections")} />
          <FieldDescription id="g-sections-hint">{t("Jedna sekcja w linii. AI ułoży według nich szkic wniosku dla autorów pomysłów.")}</FieldDescription>
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onDone}>{t("Anuluj")}</Button>
          <Button type="submit" disabled={save.isPending}>{save.isPending ? "Zapisywanie..." : t("Zapisz")}</Button>
        </div>
      </FieldGroup>
    </form>
  );
}

function Pill({ meta, children }) {
  return <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", meta?.className)}>{children ?? meta?.label}</span>;
}

function Fact({ label, value }) {
  return (
    <div className="rounded-lg bg-muted/50 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

// real form sections (who fills each) and evaluation criteria of a call
function FormDetails({ call }) {
  const sections = callSections(call);
  const criteria = callCriteria(call);
  if (!sections.length && !criteria) return null;
  return (
    <details className="rounded-lg border p-3 text-sm">
      <summary className="cursor-pointer font-medium">{t("Sekcje wniosku i kryteria oceny")}</summary>
      {sections.length > 0 && (
        <ol className="mt-3 flex list-decimal flex-col gap-1.5 pl-5">
          {sections.map((section, i) => (
            <li key={i}>
              <span className="mr-2">{section.title}</span>
              {FILL_BY[section.fillBy] && <Pill meta={FILL_BY[section.fillBy]} />}
            </li>
          ))}
        </ol>
      )}
      {criteria?.items?.length > 0 && (
        <div className="mt-3">
          <p className="font-medium">{criteria.maxPoints ? t("Kryteria oceny (maks. {points} pkt)", { points: criteria.maxPoints }) : t("Kryteria oceny")}</p>
          <ul className="mt-1 flex list-disc flex-col gap-1 pl-5">
            {criteria.items.map((item, i) => (
              <li key={i}>{item.name}{item.points ? `: ${item.points} pkt` : ""}</li>
            ))}
          </ul>
          {criteria.passRule && <p className="mt-1 text-muted-foreground">Warunek: {criteria.passRule}</p>}
        </div>
      )}
    </details>
  );
}

function CallCard({ call, canManage, onEdit, onDelete, deleting }) {
  const phase = callPhase(call);
  const open = phase === "open";
  return (
    <li className={cn("flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-elevation-1", open && "border-2 border-emerald-700 dark:border-emerald-400")}>
      <div className="flex flex-wrap items-center gap-2">
        <Pill meta={CALL_PHASES[phase]}>
          <span className="sr-only">{t("Status:")}{" "}</span>{CALL_PHASES[phase].label}{open ? ` · do ${dateFormat.format(new Date(call.openTo))}` : ""}
        </Pill>
        {call.demo && <Pill meta={{ className: "bg-amber-500/15 text-amber-800 dark:text-amber-300" }}>{t("Nabór przykładowy (demo)")}</Pill>}
      </div>
      <div>
        <h2 className="text-lg font-semibold leading-snug">{call.name}</h2>
        {call.project && <p className="text-sm text-muted-foreground">{call.demo ? `Wzorowany na projekcie ROPS: ${call.project}` : call.project}</p>}
      </div>
      <p className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
        <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-3.5" aria-hidden="true" />
        <span className="sr-only">{t("Termin:")}{" "}</span>
        {dateFormat.format(new Date(call.openFrom))} – {dateFormat.format(new Date(call.openTo))}
      </p>
      {(call.maxGrantPLN != null || call.ownContributionRequired != null || open) && (
        <div className="grid gap-2 sm:grid-cols-3">
          {call.maxGrantPLN != null && <Fact label={t("Maks. grant")} value={plnFormat.format(call.maxGrantPLN)} />}
          {call.ownContributionRequired != null && <Fact label={t("Wkład własny")} value={call.ownContributionRequired ? "Wymagany" : t("Nie wymagany")} />}
          {open && <Fact label={t("Zostało")} value={tp(daysLeft(call), "{n} dzień", "{n} dni", "{n} dni")} />}
        </div>
      )}
      {call.description && <p className="text-sm text-muted-foreground whitespace-pre-line">{call.description}</p>}
      {call.applicantTypes?.length > 0 && (
        <div>
          <p className="mb-1.5 text-sm font-medium">{t("Kto może złożyć wniosek")}</p>
          <ul className="flex flex-wrap gap-1.5">
            {call.applicantTypes.map((type) => (
              <li key={type} className="rounded-full bg-muted px-2.5 py-0.5 text-xs">{APPLICANT_TYPES[type] ?? type}</li>
            ))}
          </ul>
        </div>
      )}
      <FormDetails call={call} />
      <div className="flex flex-wrap items-center justify-end gap-2">
        {call.sourceUrl && (
          <a href={call.sourceUrl} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            <HugeiconsIcon icon={LinkSquare02Icon} strokeWidth={2} data-icon="inline-start" aria-hidden="true" />
            {call.demo ? t("Oryginalny nabór ROPS") : t("Strona naboru ROPS")}<span className="sr-only">{" "}{t("(otwiera się w nowej karcie)")}</span>
          </a>
        )}
        {canManage && (
          <>
            <Button variant="ghost" size="sm" onClick={() => onDelete(call)} disabled={deleting}>
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} data-icon="inline-start" aria-hidden="true" />
              {t("Usuń")}<span className="sr-only"> {t("nabór")} {call.name}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => onEdit(call)}>
              <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} data-icon="inline-start" aria-hidden="true" />
              {t("Edytuj")}<span className="sr-only"> {t("nabór")} {call.name}</span>
            </Button>
          </>
        )}
        {open && (
          <Link href={`/my-ideas?call=${call.id}`} className={buttonVariants({ size: "sm" })}>
            Przygotuj wniosek z AI<span className="sr-only">: {call.name}</span>
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} data-icon="inline-end" aria-hidden="true" />
          </Link>
        )}
      </div>
    </li>
  );
}

// "Otwarte" also lists upcoming calls; finished ones only under "Zakończone"
const PHASE_FILTERS = localize({
  open: { label: "Otwarte", test: (call) => callPhase(call) !== "closed" },
  closed: { label: "Zakończone", test: (call) => callPhase(call) === "closed" },
  all: { label: "Wszystkie", test: () => true },
});

export default function GrantCalls() {
  const calls = useGrantCalls();
  const remove = useDeleteGrantCall();
  const { showToast } = useToast();
  const { role, hasRole } = useAuth();
  const canManage = hasRole(ROLES.JST, ROLES.ROPS);
  const [editing, setEditing] = useState(null);
  const [phase, setPhase] = useState("all");
  // an organisation sees the calls it can apply to
  const [applicant, setApplicant] = useState(role === ROLES.NGO ? "NGO" : "");

  const all = calls.data ?? [];
  const forApplicant = all.filter((call) => !applicant || !call.applicantTypes?.length || call.applicantTypes.includes(applicant));
  const visible = forApplicant.filter(PHASE_FILTERS[phase].test);

  const del = async (call) => {
    if (!window.confirm(t("Usunąć nabór „{name}”?", { name: call.name }))) return;
    try {
      await remove.mutateAsync(call.id);
      showToast("Usunięto nabór", "success");
    } catch (err) {
      showToast(err?.body?.message ?? null, "error");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-4xl px-4 pt-18 pb-10 md:px-8">
        <PageHeader
          icon={Coins01Icon}
          title={t("Nabory grantowe")}
          description={t("Granty na innowacje społeczne w Małopolsce. Do otwartego naboru przygotujesz szkic wniosku z AI na podstawie swojego pomysłu.")}
          actions={canManage && !editing && (
            <Button onClick={() => setEditing(EMPTY)}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" aria-hidden="true" />
              {t("Nowy nabór")}
            </Button>
          )}
        />

        {editing && (
          <div className="mb-6">
            <GrantForm key={editing.id ?? "new"} initial={editing} onDone={() => setEditing(null)} />
          </div>
        )}

        <div role="search" aria-label={t("Filtry naborów")} className="mb-6 flex flex-wrap items-center gap-2">
          <div role="group" aria-label={t("Status naboru")} className="flex flex-wrap gap-2">
            {Object.entries(PHASE_FILTERS).map(([key, filter]) => (
              <button
                key={key}
                type="button"
                aria-pressed={phase === key}
                onClick={() => setPhase(key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  phase === key ? "border-primary bg-primary text-primary-foreground" : "border-foreground/45 bg-background hover:bg-muted"
                )}
              >
                {filter.label}
                <span className="sr-only">{t(", liczba:")}</span>
                <span className="rounded-full px-1.5 text-xs tabular-nums">{forApplicant.filter(filter.test).length}</span>
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <label htmlFor="grant-applicant" className="text-sm font-medium">{t("Dla:")}</label>
            <NativeSelect id="grant-applicant" value={applicant} onChange={(e) => setApplicant(e.target.value)}>
              <NativeSelectOption value="">{t("Wszystkich")}</NativeSelectOption>
              {Object.entries(APPLICANT_TYPES).map(([key, label]) => (
                <NativeSelectOption key={key} value={key}>{label}</NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        </div>
        <p aria-live="polite" aria-atomic="true" className="sr-only">{calls.isPending ? "" : `Wyniki: ${visible.length} z ${all.length}`}</p>

        {calls.isPending ? (
          <LoadingStatus label={t("Wczytywanie naborów")}><Skeleton className="h-48 w-full rounded-xl" /></LoadingStatus>
        ) : visible.length ? (
          <ul className="flex flex-col gap-4">
            {visible.map((call) => (
              <CallCard
                key={call.id}
                call={call}
                canManage={canManage}
                deleting={remove.isPending}
                onDelete={del}
                onEdit={(c) => setEditing({ ...EMPTY, ...c, description: c.description ?? "", requiredSections: c.requiredSections ?? "" })}
              />
            ))}
          </ul>
        ) : (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} />
              </EmptyMedia>
              <EmptyTitle>{t("Brak naborów")}</EmptyTitle>
              <EmptyDescription>{all.length ? t("Żaden nabór nie pasuje do filtrów.") : t("Nie ma jeszcze ogłoszonych naborów.")}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </div>
  );
}
