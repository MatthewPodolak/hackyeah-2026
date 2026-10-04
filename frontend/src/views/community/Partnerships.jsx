"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, HandshakeIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
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
import { PageHeader } from "@/components/page-header";
import { DialogBody, DialogHeader, DialogPanel } from "@/components/dialog-parts";

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
    <DialogPanel>
      <DialogHeader icon={HandshakeIcon} title="Nowe ogłoszenie o partnerstwo" titleId="pp-heading" description="Ogłoszenie zobaczą wszyscy odwiedzający, wraz z Twoją nazwą." onClose={onClose} />
      <DialogBody className="pt-1">
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
      </DialogBody>
    </DialogPanel>
  );
}

export default function Partnerships() {
  const posts = usePartnerships();
  const { isLogged, openPanel } = useAuth();
  const [creating, setCreating] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl px-4 pt-18 pb-10 md:px-8">
        <PageHeader
          icon={HandshakeIcon}
          title="Partnerstwa"
          description="Ogłoszenia osób i instytucji, które szukają partnerów do wdrożenia innowacji"
          actions={
            <Button onClick={() => (isLogged ? setCreating(true) : openPanel("login"))}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" aria-hidden="true" />
              {isLogged ? "Dodaj ogłoszenie" : "Zaloguj się, aby dodać ogłoszenie"}
            </Button>
          }
        />

        {posts.isPending ? (
          <LoadingStatus label="Wczytywanie ogłoszeń" className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </LoadingStatus>
        ) : posts.data?.length ? (
          <ul className="grid gap-4 sm:grid-cols-2">
            {posts.data.map((post) => (
              <li key={post.id}>
                <article aria-labelledby={`pp-${post.id}`} className="flex h-full flex-col gap-2 rounded-2xl border border-border bg-card shadow-elevation-1 p-5">
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
