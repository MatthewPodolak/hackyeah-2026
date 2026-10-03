"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Calendar03Icon, Delete02Icon, Edit02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
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
  if (call.openFrom > now) return { label: "Zaplanowany", className: "bg-sky-500/15 text-sky-700 dark:text-sky-300" };
  return { label: "Aktywny", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" };
}

function GrantForm({ initial, onDone }) {
  const [form, setForm] = useState(initial);
  const save = useSaveGrantCall();
  const { showToast } = useToast();

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return showToast("Podaj nazwę naboru!", "error");
    if (!form.openFrom || !form.openTo) return showToast("Podaj daty naboru!", "error");
    if (form.openTo < form.openFrom) return showToast("Data końca nie może być przed datą początku!", "error");
    try {
      await save.mutateAsync({ ...form, name: form.name.trim() });
      showToast(initial.id ? "Zapisano nabór" : "Dodano nabór", "success");
      onDone();
    } catch (err) {
      showToast(err?.body?.message ?? null, "error");
    }
  };

  return (
    <form onSubmit={submit} className="rounded-xl border bg-card p-5">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="g-name">Nazwa naboru</FieldLabel>
          <Input id="g-name" value={form.name} placeholder="np. Małopolski Inkubator Innowacji 2026" onChange={set("name")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="g-from">Od</FieldLabel>
            <Input id="g-from" type="date" value={form.openFrom} onChange={set("openFrom")} />
          </Field>
          <Field>
            <FieldLabel htmlFor="g-to">Do</FieldLabel>
            <Input id="g-to" type="date" value={form.openTo} onChange={set("openTo")} />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="g-desc">Opis</FieldLabel>
          <Textarea id="g-desc" rows={3} value={form.description ?? ""} placeholder="Cel naboru, kto może aplikować, kwoty dofinansowania" onChange={set("description")} />
        </Field>
        <Field>
          <FieldLabel htmlFor="g-sections">Wymagane sekcje wniosku</FieldLabel>
          <Textarea id="g-sections" rows={4} value={form.requiredSections ?? ""} placeholder={"Opis problemu\nGrupa docelowa\nOpis rozwiązania\nHarmonogram\nBudżet"} onChange={set("requiredSections")} />
          <FieldDescription>Jedna sekcja w linii. AI ułoży według nich szkic wniosku dla autorów pomysłów.</FieldDescription>
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
      <div className="mx-auto w-full max-w-4xl px-4 pt-14 pb-10 md:px-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-semibold">Nabory grantowe</h1>
            <p className="text-muted-foreground">Aktywne nabory widzą autorzy pomysłów i mogą przygotować do nich szkic wniosku</p>
          </div>
          {!editing && (
            <Button onClick={() => setEditing(EMPTY)}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
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
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : calls.data?.length ? (
          <ul className="flex flex-col gap-3">
            {calls.data.map((call) => {
              const state = callState(call);
              return (
                <li key={call.id} className="flex flex-col gap-2 rounded-xl border bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2 className="font-semibold">{call.name}</h2>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${state.className}`}>{state.label}</span>
                  </div>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                    <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-3.5" />
                    {dateFormat.format(new Date(call.openFrom))} – {dateFormat.format(new Date(call.openTo))}
                  </p>
                  {call.description && <p className="text-sm text-muted-foreground whitespace-pre-line">{call.description}</p>}
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => del(call)} disabled={remove.isPending}>
                      <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} data-icon="inline-start" />
                      Usuń
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing({ ...EMPTY, ...call, description: call.description ?? "", requiredSections: call.requiredSections ?? "" })}
                    >
                      <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} data-icon="inline-start" />
                      Edytuj
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
