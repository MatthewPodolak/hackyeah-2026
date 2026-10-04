"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Cancel01Icon, Delete02Icon, Edit02Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoadingStatus from "@/components/loading-status";
import Modal from "@/components/modal";
import SelectChip from "@/components/select-chip";
import RoleGuard from "@/views/reported/RoleGuard";
import { ROLES } from "@/api/context/AuthContext";
import { useCatalog, useRemoveInnovation, useRemoveResource, useSaveInnovation, useSaveResource } from "@/api/hooks/useAdmin";
import { useKnowledgeResources } from "@/api/hooks/useCanvas";
import { useToast } from "@/helpers/ToastProvider";
import { useFormErrors } from "@/helpers/useFormErrors";
import formCategories from "@/data/form-categories.json";

const WHO = Object.entries(formCategories.whoCategories);
const PROBLEMS = Object.entries(formCategories.problemCategories);
const LINKS = [
  { key: "video", label: "Film (YouTube)" },
  { key: "details", label: "Strona innowacji w ROPS" },
  { key: "leaflet", label: "Ulotka (PDF)" },
  { key: "materials", label: "Materiały do pobrania" },
  { key: "usageRules", label: "Zasady wykorzystania" },
];
const TEXTS = [
  { key: "shortDescription", label: "Krótki opis", rows: 2 },
  { key: "description", label: "Na czym polega?", rows: 5 },
  { key: "problem", label: "Jaki problem rozwiązuje?", rows: 4 },
  { key: "targetGroupDescription", label: "Dla kogo?", rows: 3 },
  { key: "whoCanImplement", label: "Kto może wdrożyć?", rows: 3 },
  { key: "effectiveness", label: "Czy to działa?", rows: 3 },
];
const RESOURCE_TYPES = {
  LIBRARY: "Biblioteka",
  REPORT: "Raport",
  PUBLICATION: "Publikacje",
  CANVAS: "Narzędzie warsztatowe",
  MAP: "Mapa",
  TOOL: "Narzędzie",
  VIDEO: "Wideo",
  OTHER: "Inne",
};

function normalize(text) {
  return (text ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l");
}

function DialogCard({ headingId, title, onClose, children }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <h2 id={headingId} className="min-w-0 flex-1 text-base font-semibold">{title}</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Zamknij okno">
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} aria-hidden="true" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ChipGroup({ id, label, options, value, onChange }) {
  const toggle = (key) => onChange(value.includes(key) ? value.filter((k) => k !== key) : [...value, key]);
  return (
    <div className="flex flex-col gap-2">
      <p id={`${id}-label`} className="text-sm font-medium">{label}</p>
      <div role="group" aria-labelledby={`${id}-label`} className="flex flex-wrap gap-2">
        {options.map(([key, item]) => (
          <SelectChip key={key} active={value.includes(key)} onClick={() => toggle(key)}>
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
          </SelectChip>
        ))}
      </div>
    </div>
  );
}

function InnovationForm({ initial, onDone }) {
  const editing = !!initial?.id;
  const [form, setForm] = useState(() => ({
    name: initial?.name ?? "",
    thumbnailUrl: initial?.thumbnailUrl ?? "",
    whoCategories: initial?.whoCategories ?? [],
    problemCategories: initial?.problemCategories ?? [],
    links: { ...(initial?.links ?? {}) },
    ...Object.fromEntries(TEXTS.map(({ key }) => [key, initial?.[key] ?? ""])),
  }));
  const save = useSaveInnovation();
  const { showToast } = useToast();
  const { fail, clear, fieldProps, errorProps } = useFormErrors("cat");

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    clear(key);
  };
  const setLink = (key) => (e) => {
    setForm((f) => ({ ...f, links: { ...f.links, [key]: e.target.value } }));
    clear(`link-${key}`);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return fail("name", "Podaj nazwę innowacji");
    for (const { key } of LINKS) {
      const v = form.links[key]?.trim();
      if (v && !/^https?:\/\//i.test(v)) return fail(`link-${key}`, "Adres musi zaczynać się od http:// lub https://");
    }
    if (form.thumbnailUrl.trim() && !/^https?:\/\//i.test(form.thumbnailUrl.trim())) return fail("thumbnailUrl", "Adres musi zaczynać się od http:// lub https://");
    const model = {
      ...(initial ?? {}),
      ...form,
      id: initial?.id,
      links: Object.fromEntries(Object.entries(form.links).filter(([, v]) => v?.trim())),
    };
    try {
      const saved = await save.mutateAsync({ id: initial?.id, model });
      showToast(editing ? "Zapisano zmiany w innowacji" : `Dodano innowację „${saved.name}”`, "success");
      onDone();
    } catch (err) {
      if (err?.status === 409) fail("name", "Innowacja o takiej nazwie już istnieje");
      else if (err?.status === 400) fail("name", err.body?.message ?? "Sprawdź poprawność danych");
      else showToast(null, "error");
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="cat-name">Nazwa (wymagane)</FieldLabel>
          <Input {...fieldProps("name")} required maxLength={200} value={form.name} onChange={set("name")} />
          <FieldError {...errorProps("name")} />
        </Field>
        {TEXTS.map(({ key, label, rows }) => (
          <Field key={key}>
            <FieldLabel htmlFor={`cat-${key}`}>{label}</FieldLabel>
            <Textarea id={`cat-${key}`} rows={rows} value={form[key]} onChange={set(key)} />
          </Field>
        ))}
        <ChipGroup id="cat-who" label="Dla kogo" options={WHO} value={form.whoCategories} onChange={(v) => setForm((f) => ({ ...f, whoCategories: v }))} />
        <ChipGroup id="cat-problems" label="Kategorie problemów" options={PROBLEMS} value={form.problemCategories} onChange={(v) => setForm((f) => ({ ...f, problemCategories: v }))} />
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-medium">Linki</legend>
          {LINKS.map(({ key, label }) => (
            <Field key={key}>
              <FieldLabel htmlFor={`cat-link-${key}`}>{label}</FieldLabel>
              <Input {...fieldProps(`link-${key}`)} type="url" inputMode="url" placeholder="https://…" value={form.links[key] ?? ""} onChange={setLink(key)} />
              <FieldError {...errorProps(`link-${key}`)} />
            </Field>
          ))}
          <Field>
            <FieldLabel htmlFor="cat-thumbnailUrl">Miniatura (adres obrazka)</FieldLabel>
            <Input {...fieldProps("thumbnailUrl", "cat-thumb-hint")} type="url" inputMode="url" placeholder="https://…" value={form.thumbnailUrl} onChange={set("thumbnailUrl")} />
            <FieldDescription id="cat-thumb-hint">Bez miniatury karta pokaże ikonę kategorii.</FieldDescription>
            <FieldError {...errorProps("thumbnailUrl")} />
          </Field>
        </fieldset>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onDone}>Anuluj</Button>
          <Button type="submit" disabled={save.isPending}>{save.isPending ? "Zapisywanie..." : editing ? "Zapisz zmiany" : "Dodaj innowację"}</Button>
        </div>
      </FieldGroup>
    </form>
  );
}

function ResourceForm({ initial, onDone }) {
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    type: initial?.type ?? "REPORT",
    url: initial?.url ?? "",
  });
  const save = useSaveResource();
  const { showToast } = useToast();
  const { fail, clear, fieldProps, errorProps } = useFormErrors("res");

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    clear(key);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return fail("title", "Podaj tytuł materiału");
    if (!/^https?:\/\//i.test(form.url.trim())) return fail("url", "Podaj adres zaczynający się od http:// lub https://");
    try {
      await save.mutateAsync({ id: initial?.id, model: { ...form, title: form.title.trim(), url: form.url.trim() } });
      showToast(initial?.id ? "Zapisano materiał" : "Dodano materiał", "success");
      onDone();
    } catch (err) {
      if (err?.status === 400) fail("title", err.body?.message ?? "Sprawdź poprawność danych");
      else showToast(null, "error");
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="res-title">Tytuł (wymagane)</FieldLabel>
          <Input {...fieldProps("title")} required maxLength={200} value={form.title} onChange={set("title")} />
          <FieldError {...errorProps("title")} />
        </Field>
        <Field>
          <FieldLabel htmlFor="res-type">Rodzaj</FieldLabel>
          <NativeSelect id="res-type" className="w-full" value={form.type} onChange={set("type")}>
            {Object.entries(RESOURCE_TYPES).map(([key, label]) => <NativeSelectOption key={key} value={key}>{label}</NativeSelectOption>)}
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor="res-url">Adres (wymagane)</FieldLabel>
          <Input {...fieldProps("url")} required type="url" inputMode="url" placeholder="https://…" value={form.url} onChange={set("url")} />
          <FieldError {...errorProps("url")} />
        </Field>
        <Field>
          <FieldLabel htmlFor="res-description">Opis</FieldLabel>
          <Textarea id="res-description" rows={3} value={form.description} onChange={set("description")} />
        </Field>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onDone}>Anuluj</Button>
          <Button type="submit" disabled={save.isPending}>{save.isPending ? "Zapisywanie..." : "Zapisz"}</Button>
        </div>
      </FieldGroup>
    </form>
  );
}

function InnovationsTab() {
  const catalog = useCatalog();
  const remove = useRemoveInnovation();
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const all = useMemo(() => catalog.data ?? [], [catalog.data]);
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const visible = all.filter((i) => words.every((w) => normalize(`${i.name} ${i.shortDescription}`).includes(w)));

  const del = async (innovation) => {
    if (!window.confirm(`Usunąć innowację „${innovation.name}” z Biblioteki? Tej operacji nie można cofnąć.`)) return;
    try {
      await remove.mutateAsync(innovation.id);
      showToast(`Usunięto „${innovation.name}”`, "success");
    } catch {
      showToast(null, "error");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <InputGroup className="sm:flex-1">
          <InputGroupAddon><HugeiconsIcon icon={Search01Icon} strokeWidth={2} aria-hidden="true" /></InputGroupAddon>
          <InputGroupInput type="search" value={query} aria-label="Szukaj innowacji w katalogu" placeholder="Szukaj innowacji…" onChange={(e) => setQuery(e.target.value)} />
        </InputGroup>
        <Button onClick={() => setEditing({})}>
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" aria-hidden="true" />
          Dodaj innowację
        </Button>
      </div>
      <p aria-live="polite" aria-atomic="true" className="text-sm text-muted-foreground">{catalog.isPending ? "" : `${visible.length} z ${all.length} innowacji`}</p>
      {catalog.isPending ? (
        <LoadingStatus label="Wczytywanie katalogu"><Skeleton className="h-48 w-full rounded-xl" /></LoadingStatus>
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((innovation) => (
            <li key={innovation.id} className="flex flex-col gap-2 rounded-xl border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <Link href={`/innovations/${innovation.id}`} className="font-medium underline-offset-4 hover:underline">{innovation.name}</Link>
                {innovation.shortDescription && <p className="line-clamp-1 text-sm text-muted-foreground">{innovation.shortDescription}</p>}
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(innovation)}>
                  <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} data-icon="inline-start" aria-hidden="true" />
                  Edytuj<span className="sr-only">: {innovation.name}</span>
                </Button>
                <Button variant="ghost" size="sm" disabled={remove.isPending} onClick={() => del(innovation)}>
                  <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} data-icon="inline-start" aria-hidden="true" />
                  Usuń<span className="sr-only">: {innovation.name}</span>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Modal open={editing !== null} onClose={() => setEditing(null)} labelledBy="cat-heading" className="max-w-2xl">
        <DialogCard headingId="cat-heading" title={editing?.id ? `Edycja: ${editing.name}` : "Nowa innowacja"} onClose={() => setEditing(null)}>
          {editing !== null && <InnovationForm key={editing.id ?? "new"} initial={editing.id ? editing : null} onDone={() => setEditing(null)} />}
        </DialogCard>
      </Modal>
    </div>
  );
}

function ResourcesTab() {
  const resources = useKnowledgeResources();
  const remove = useRemoveResource();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(null);

  const del = async (resource) => {
    if (!window.confirm(`Usunąć materiał „${resource.title}”?`)) return;
    try {
      await remove.mutateAsync(resource.id);
      showToast(`Usunięto „${resource.title}”`, "success");
    } catch {
      showToast(null, "error");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Button className="self-start" onClick={() => setEditing({})}>
        <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" aria-hidden="true" />
        Dodaj materiał
      </Button>
      {resources.isPending ? (
        <LoadingStatus label="Wczytywanie materiałów"><Skeleton className="h-32 w-full rounded-xl" /></LoadingStatus>
      ) : (
        <ul className="flex flex-col gap-2">
          {(resources.data ?? []).map((resource) => (
            <li key={resource.id} className="flex flex-col gap-2 rounded-xl border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <a href={resource.url} target="_blank" rel="noreferrer" className="font-medium underline-offset-4 hover:underline">
                  {resource.title}<span className="sr-only"> (otwiera się w nowej karcie)</span>
                </a>
                <p className="text-xs text-muted-foreground">{RESOURCE_TYPES[resource.type] ?? resource.type}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(resource)}>
                  <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} data-icon="inline-start" aria-hidden="true" />
                  Edytuj<span className="sr-only">: {resource.title}</span>
                </Button>
                <Button variant="ghost" size="sm" disabled={remove.isPending} onClick={() => del(resource)}>
                  <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} data-icon="inline-start" aria-hidden="true" />
                  Usuń<span className="sr-only">: {resource.title}</span>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Modal open={editing !== null} onClose={() => setEditing(null)} labelledBy="res-heading" className="max-w-lg">
        <DialogCard headingId="res-heading" title={editing?.id ? `Edycja: ${editing.title}` : "Nowy materiał"} onClose={() => setEditing(null)}>
          {editing !== null && <ResourceForm key={editing.id ?? "new"} initial={editing.id ? editing : null} onDone={() => setEditing(null)} />}
        </DialogCard>
      </Modal>
    </div>
  );
}

function CatalogPanel() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl px-4 pt-18 pb-10 md:px-8">
        <header className="mb-6">
          <h1 className="font-heading text-3xl font-bold tracking-tight">Katalog wiedzy</h1>
          <p className="text-muted-foreground">Edytuj Bibliotekę Innowacji i materiały bazy wiedzy. Zmiany są widoczne od razu.</p>
        </header>
        <Tabs defaultValue="innovations" className="gap-4">
          <TabsList>
            <TabsTrigger value="innovations">Innowacje</TabsTrigger>
            <TabsTrigger value="resources">Materiały</TabsTrigger>
          </TabsList>
          <TabsContent value="innovations"><InnovationsTab /></TabsContent>
          <TabsContent value="resources"><ResourcesTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function CatalogAdmin() {
  return (
    <RoleGuard roles={[ROLES.ROPS]} description="Edycja katalogu jest dostępna tylko dla pracowników ROPS.">
      <CatalogPanel />
    </RoleGuard>
  );
}
