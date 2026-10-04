"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Cancel01Icon, HandshakeIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import Modal from "@/components/modal";
import LoadingStatus from "@/components/loading-status";
import { useAuth } from "@/api/context/AuthContext";
import { useCreatePartnership, usePartnerships } from "@/api/hooks/useCommunication";
import { useToast } from "@/helpers/ToastProvider";
import { useFormErrors } from "@/helpers/useFormErrors";

const dateFormat = new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium" });

function NewPartnership({ onClose }) {
  const [form, setForm] = useState({ title: "", lookingFor: "", description: "" });
  const create = useCreatePartnership();
  const { showToast } = useToast();
  const { fail, clear, fieldProps, errorProps } = useFormErrors("pp");

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    clear(key);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return fail("title", "Podaj tytuł ogłoszenia");
    if (!form.lookingFor.trim()) return fail("lookingFor", "Napisz, kogo szukasz");
    if (!form.description.trim()) return fail("description", "Opisz, czego dotyczy współpraca");
    try {
      await create.mutateAsync({ title: form.title.trim(), lookingFor: form.lookingFor.trim(), description: form.description.trim() });
      showToast("Ogłoszenie zostało opublikowane", "success");
      onClose();
    } catch (err) {
      if (err?.status === 400) fail("description", err.body?.message ?? "Sprawdź poprawność danych");
      else showToast(null, "error");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle><h2 id="pp-heading" className="text-base font-semibold">Nowe ogłoszenie o partnerstwo</h2></CardTitle>
            <CardDescription className="mt-1">Ogłoszenie zobaczą wszyscy odwiedzający, wraz z Twoją nazwą.</CardDescription>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Zamknij okno">
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} aria-hidden="true" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="pp-title">Tytuł (wymagane)</FieldLabel>
              <Input {...fieldProps("title")} required maxLength={200} value={form.title} onChange={set("title")} />
              <FieldError {...errorProps("title")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="pp-lookingFor">Kogo szukasz? (wymagane)</FieldLabel>
              <Input {...fieldProps("lookingFor", "pp-lookingFor-hint")} required maxLength={100} value={form.lookingFor} onChange={set("lookingFor")} />
              <FieldDescription id="pp-lookingFor-hint">Np. organizacja pozarządowa, szkoła, gmina, wolontariusze.</FieldDescription>
              <FieldError {...errorProps("lookingFor")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="pp-description">Opis (wymagane)</FieldLabel>
              <Textarea {...fieldProps("description")} required rows={5} maxLength={4000} value={form.description} onChange={set("description")} />
              <FieldError {...errorProps("description")} />
            </Field>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={onClose}>Anuluj</Button>
              <Button type="submit" disabled={create.isPending}>{create.isPending ? "Publikowanie..." : "Opublikuj"}</Button>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

export default function Partnerships() {
  const posts = usePartnerships();
  const { isLogged, openPanel } = useAuth();
  const [creating, setCreating] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl px-4 pt-18 pb-10 md:px-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight">Partnerstwa</h1>
            <p className="text-muted-foreground">Ogłoszenia osób i instytucji, które szukają partnerów do wdrożenia innowacji</p>
          </div>
          <Button onClick={() => (isLogged ? setCreating(true) : openPanel("login"))}>
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" aria-hidden="true" />
            {isLogged ? "Dodaj ogłoszenie" : "Zaloguj się, aby dodać ogłoszenie"}
          </Button>
        </header>

        {posts.isPending ? (
          <LoadingStatus label="Wczytywanie ogłoszeń" className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </LoadingStatus>
        ) : posts.data?.length ? (
          <ul className="grid gap-4 sm:grid-cols-2">
            {posts.data.map((post) => (
              <li key={post.id}>
                <article aria-labelledby={`pp-${post.id}`} className="flex h-full flex-col gap-2 rounded-xl border bg-card p-5">
                  <h2 id={`pp-${post.id}`} className="font-semibold break-words">{post.title}</h2>
                  <p className="text-sm">
                    <span className="font-medium">Szukamy: </span>{post.lookingFor}
                  </p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line break-words">{post.description}</p>
                  <p className="mt-auto pt-2 text-xs text-muted-foreground">
                    {post.authorName}
                    {post.createdAt && (
                      <>
                        {" · "}
                        <time dateTime={post.createdAt}>{dateFormat.format(new Date(post.createdAt))}</time>
                      </>
                    )}
                  </p>
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={HandshakeIcon} strokeWidth={2} aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>Brak ogłoszeń</EmptyTitle>
              <EmptyDescription>Szukasz partnera do swojego pomysłu? Dodaj pierwsze ogłoszenie.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>

      <Modal open={creating} onClose={() => setCreating(false)} labelledBy="pp-heading" className="max-w-lg">
        <NewPartnership onClose={() => setCreating(false)} />
      </Modal>
    </div>
  );
}
