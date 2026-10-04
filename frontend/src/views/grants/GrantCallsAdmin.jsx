"use client";

import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Calendar03Icon, Delete02Icon, Edit02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import LoadingStatus from "@/components/loading-status";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { useFormErrors } from "@/helpers/useFormErrors";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import RoleGuard from "@/views/reported/RoleGuard";
import { ROLES } from "@/api/context/AuthContext";
import { useAdminGrantCalls, useDeleteGrantCall, useSaveGrantCall } from "@/api/hooks/useGrantCalls";
import { useToast } from "@/helpers/ToastProvider";

const dateFormat = new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium" });
const EMPTY = { name: "", description: "", openFrom: "", openTo: "", requiredSections: "" };

function today() {
  return new Date().toISOString().slice(0, 10);
}

function callState(call) {
  const now = today();
  if (call.openTo < now) return { label: "Zakończony", className: "bg-muted text-muted-foreground" };
  if (call.openFrom > now) return { label: "Zaplanowany", className: "bg-sky-500/15 text-sky-800 dark:text-sky-300" };
  return { label: "Aktywny", className: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300" };
}

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
    if (!form.name.trim()) return fail("name", "Podaj nazwę naboru");
    if (!form.openFrom) return fail("openFrom", "Podaj datę rozpoczęcia naboru");
    if (!form.openTo) return fail("openTo", "Podaj datę zakończenia naboru");
    if (form.openTo < form.openFrom) return fail("openTo", "Data końca nie może być przed datą początku");
    try {
      await save.mutateAsync({ ...form, name: form.name.trim() });
      showToast(initial.id ? "Zapisano nabór" : "Dodano nabór", "success");
      onDone();
    } catch (err) {
      if (err?.body?.message) fail("name", err.body.message);
      else showToast(null, "error");
    }
  };

  return (
    <form onSubmit={submit} noValidate aria-labelledby="g-form-heading" className="rounded-xl border bg-card p-5">
      <h2 id="g-form-heading" ref={headingRef} tabIndex={-1} className="mb-4 font-semibold outline-none">{initial.id ? `Edycja naboru: ${initial.name}` : "Nowy nabór"}</h2>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="g-name">Nazwa naboru (wymagane)</FieldLabel>
          <Input {...fieldProps("name")} required value={form.name} placeholder="np. Małopolski Inkubator Innowacji 2026" onChange={set("name")} />
          <FieldError {...errorProps("name")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="g-openFrom">Od (wymagane)</FieldLabel>
            <Input {...fieldProps("openFrom")} required type="date" value={form.openFrom} onChange={set("openFrom")} />
            <FieldError {...errorProps("openFrom")} />
          </Field>
          <Field>
            <FieldLabel htmlFor="g-openTo">Do (wymagane)</FieldLabel>
            <Input {...fieldProps("openTo")} required type="date" value={form.openTo} onChange={set("openTo")} />
            <FieldError {...errorProps("openTo")} />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="g-desc">Opis</FieldLabel>
          <Textarea id="g-desc" rows={3} value={form.description ?? ""} placeholder="Cel naboru, kto może aplikować, kwoty dofinansowania" onChange={set("description")} />
        </Field>
        <Field>
          <FieldLabel htmlFor="g-sections">Wymagane sekcje wniosku</FieldLabel>
          <Textarea id="g-sections" aria-describedby="g-sections-hint" rows={4} value={form.requiredSections ?? ""} placeholder={"Opis problemu\nGrupa docelowa\nOpis rozwiązania\nHarmonogram\nBudżet"} onChange={set("requiredSections")} />
          <FieldDescription id="g-sections-hint">Jedna sekcja w linii. AI ułoży według nich szkic wniosku dla autorów pomysłów.</FieldDescription>
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onDone}>Anuluj</Button>
          <Button type="submit" disabled={save.isPending}>{save.isPending ? "Zapisywanie..." : "Zapisz"}</Button>
        </div>
      </FieldGroup>
    </form>
  );
}

function GrantCallsList() {
  const calls = useAdminGrantCalls();
  const remove = useDeleteGrantCall();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(null);

  const del = async (call) => {
    if (!window.confirm(`Usunąć nabór „${call.name}”?`)) return;
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
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight">Nabory grantowe</h1>
            <p className="text-muted-foreground">Aktywne nabory widzą autorzy pomysłów i mogą przygotować do nich szkic wniosku</p>
          </div>
          {!editing && (
            <Button onClick={() => setEditing(EMPTY)}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" aria-hidden="true" />
              Nowy nabór
            </Button>
          )}
        </header>

        {editing && (
          <div className="mb-6">
            <GrantForm key={editing.id ?? "new"} initial={editing} onDone={() => setEditing(null)} />
          </div>
        )}

        {calls.isPending ? (
          <LoadingStatus label="Wczytywanie naborów"><Skeleton className="h-32 w-full rounded-xl" /></LoadingStatus>
        ) : calls.data?.length ? (
          <ul className="flex flex-col gap-3">
            {calls.data.map((call) => {
              const state = callState(call);
              return (
                <li key={call.id} className="flex flex-col gap-2 rounded-xl border bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2 className="font-semibold">{call.name}</h2>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${state.className}`}><span className="sr-only">Status: </span>{state.label}</span>
                  </div>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                    <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-3.5" aria-hidden="true" />
                    <span className="sr-only">Termin: </span>
                    {dateFormat.format(new Date(call.openFrom))} – {dateFormat.format(new Date(call.openTo))}
                  </p>
                  {call.description && <p className="text-sm text-muted-foreground whitespace-pre-line">{call.description}</p>}
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => del(call)} disabled={remove.isPending}>
                      <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} data-icon="inline-start" aria-hidden="true" />
                      Usuń<span className="sr-only"> nabór {call.name}</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing({ ...EMPTY, ...call, description: call.description ?? "", requiredSections: call.requiredSections ?? "" })}
                    >
                      <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} data-icon="inline-start" aria-hidden="true" />
                      Edytuj<span className="sr-only"> nabór {call.name}</span>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} />
              </EmptyMedia>
              <EmptyTitle>Brak naborów</EmptyTitle>
              <EmptyDescription>Dodaj pierwszy nabór, żeby autorzy pomysłów mogli przygotować wnioski.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </div>
  );
}

export default function GrantCallsAdmin() {
  return (
    <RoleGuard roles={[ROLES.JST, ROLES.ROPS]}>
      <GrantCallsList />
    </RoleGuard>
  );
}
