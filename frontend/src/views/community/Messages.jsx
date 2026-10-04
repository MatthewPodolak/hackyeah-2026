"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "cn";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Chatting01Icon, SentIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import Modal from "@/components/modal";
import LoadingStatus from "@/components/loading-status";
import StatusPill from "@/components/status-pill";
import RoleGuard from "@/views/reported/RoleGuard";
import { ROLES, useAuth } from "@/api/context/AuthContext";
import { useConversationMessages, useConversations, useCreateConversation, useReply, useSetConversationStatus } from "@/api/hooks/useCommunication";
import { useToast } from "@/helpers/ToastProvider";
import { useFormErrors } from "@/helpers/useFormErrors";
import { useRegions } from "@/api/hooks/useRegionsQuery";
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from "@/components/ui/native-select";
import { CONVERSATION_STATUS, CONVERSATION_TYPE } from "@/lib/community";
import { PageHeader } from "@/components/page-header";
import { DialogBody, DialogHeader, DialogPanel } from "@/components/dialog-parts";
import { localDateFormat, localize, t } from "@/lib/i18n";

const dateFormat = localDateFormat({ dateStyle: "medium", timeStyle: "short" });
const TYPES = Object.entries(CONVERSATION_TYPE);

const RECIPIENTS = localize([
  { value: "ROPS", label: "ROPS Kraków", hint: "Pytania o innowacje, mentoring, granty i partnerstwa" },
  { value: "JST", label: "Samorząd gminy", hint: "Lokalne sprawy – wiadomość trafi do urzędu wybranej gminy" },
]);

function NewConversation({ canChooseRecipient, onCreated, onClose }) {
  const regions = useRegions();
  const [form, setForm] = useState({ type: "QUESTION", subject: "", content: "", recipient: "ROPS", gminaId: "" });
  const create = useCreateConversation();
  const { showToast } = useToast();
  const { fail, clear, fieldProps, errorProps } = useFormErrors("conv");

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    clear(key);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (form.recipient === "JST" && !form.gminaId) return fail("gminaId", t("Wybierz gminę, do której piszesz"));
    if (!form.subject.trim()) return fail("subject", t("Podaj temat rozmowy"));
    if (!form.content.trim()) return fail("content", t("Napisz wiadomość"));
    try {
      const id = await create.mutateAsync({
        type: form.type,
        subject: form.subject.trim(),
        content: form.content.trim(),
        recipient: canChooseRecipient ? form.recipient : "ROPS",
        gminaId: canChooseRecipient && form.recipient === "JST" ? form.gminaId : null,
      });
      showToast("Rozmowa została rozpoczęta", "success");
      onCreated(id);
    } catch (err) {
      if (err?.status === 400) fail("content", err.body?.message ?? t("Sprawdź poprawność danych"));
      else showToast(null, "error");
    }
  };

  return (
    <DialogPanel>
      <DialogHeader icon={Chatting01Icon} title={t("Nowa rozmowa")} titleId="conv-heading" description={canChooseRecipient ? t("Wybierz, do kogo piszesz: do ROPS albo do samorządu swojej gminy.") : t("Wiadomość trafi do pracowników ROPS Kraków.")} onClose={onClose} />
      <DialogBody className="pt-1">
        <form onSubmit={submit} noValidate>
          <FieldGroup>
            {canChooseRecipient && (
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 text-sm font-medium">{t("Do kogo piszesz?")}</legend>
                {RECIPIENTS.map((option) => (
                  <label key={option.value} className={cn("flex cursor-pointer items-start gap-3 rounded-2xl border border-border p-3", form.recipient === option.value ? "border-primary bg-secondary/60 dark:bg-secondary/40" : "border-outline hover:bg-muted/60")}>
                    <input type="radio" name="conv-recipient" value={option.value} checked={form.recipient === option.value} onChange={set("recipient")} className="mt-1 size-4 accent-[var(--primary)]" />
                    <span>
                      <span className="block text-sm font-medium">{option.label}</span>
                      <span className="block text-xs text-muted-foreground">{option.hint}</span>
                    </span>
                  </label>
                ))}
                {form.recipient === "JST" && (
                  <Field>
                    <FieldLabel htmlFor="conv-gminaId">{t("Gmina (wymagane)")}</FieldLabel>
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
                )}
              </fieldset>
            )}
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium">{t("Rodzaj rozmowy")}</legend>
              {TYPES.map(([value, meta]) => (
                <label key={value} className={cn("flex cursor-pointer items-start gap-3 rounded-2xl border border-border p-3", form.type === value ? "border-primary bg-secondary/60 dark:bg-secondary/40" : "border-outline hover:bg-muted/60")}>
                  <input type="radio" name="conv-type" value={value} checked={form.type === value} onChange={set("type")} className="mt-1 size-4 accent-[var(--primary)]" />
                  <span>
                    <span className="block text-sm font-medium">{meta.label}</span>
                    <span className="block text-xs text-muted-foreground">{meta.hint}</span>
                  </span>
                </label>
              ))}
            </fieldset>
            <Field>
              <FieldLabel htmlFor="conv-subject">{t("Temat (wymagane)")}</FieldLabel>
              <Input {...fieldProps("subject")} required maxLength={200} value={form.subject} onChange={set("subject")} />
              <FieldError {...errorProps("subject")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="conv-content">{t("Wiadomość (wymagane)")}</FieldLabel>
              <Textarea {...fieldProps("content")} required rows={5} maxLength={4000} value={form.content} onChange={set("content")} />
              <FieldError {...errorProps("content")} />
            </Field>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={onClose}>{t("Anuluj")}</Button>
              <Button type="submit" disabled={create.isPending}>{create.isPending ? t("Wysyłanie...") : t("Rozpocznij rozmowę")}</Button>
            </div>
          </FieldGroup>
        </form>
      </DialogBody>
    </DialogPanel>
  );
}

function Thread({ conversation, headingRef }) {
  const { user } = useAuth();
  const messages = useConversationMessages(conversation.id);
  const reply = useReply(conversation.id);
  const setStatus = useSetConversationStatus();
  const { showToast } = useToast();
  const [content, setContent] = useState("");
  const { fail, clear, fieldProps, errorProps } = useFormErrors(`reply-${conversation.id}`);
  const closed = conversation.status === "CLOSED";
  const list = messages.data ?? [];
  const last = list[list.length - 1];

  const send = async (e) => {
    e.preventDefault();
    if (!content.trim()) return fail("content", t("Napisz wiadomość"));
    try {
      await reply.mutateAsync(content.trim());
      setContent("");
    } catch (err) {
      if (err?.status === 400) fail("content", err.body?.message ?? t("Nie udało się wysłać"));
      else showToast(null, "error");
    }
  };

  const toggle = async () => {
    try {
      await setStatus.mutateAsync({ id: conversation.id, status: closed ? "OPEN" : "CLOSED" });
      showToast(closed ? t("Rozmowa została ponownie otwarta") : t("Rozmowa została zamknięta"), "success");
    } catch {
      showToast(null, "error");
    }
  };

  return (
    <section aria-labelledby="thread-heading" className="flex min-h-0 flex-col gap-4 rounded-2xl border border-border bg-card shadow-elevation-1 p-4">
      <header className="flex flex-wrap items-start justify-between gap-2 border-b pb-3">
        <div className="min-w-0">
          <h2 id="thread-heading" ref={headingRef} tabIndex={-1} className="font-semibold break-words outline-none">{conversation.subject}</h2>
          <p className="text-xs text-muted-foreground">
            {CONVERSATION_TYPE[conversation.type]?.label ?? conversation.type} · od: {conversation.ownerName} · do: {conversation.recipientLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill meta={CONVERSATION_STATUS[conversation.status]} />
          <Button variant="outline" size="sm" onClick={toggle} disabled={setStatus.isPending}>
            {closed ? t("Otwórz ponownie") : t("Zamknij rozmowę")}
          </Button>
        </div>
      </header>

      {messages.isPending ? (
        <LoadingStatus label={t("Wczytywanie wiadomości")}><Skeleton className="h-32 w-full rounded-xl" /></LoadingStatus>
      ) : (
        <ol aria-label={t("Wiadomości")} className="flex flex-col gap-3">
          {list.map((m) => {
            const mine = m.senderId === user?.id;
            return (
              <li key={m.id} className={cn("max-w-[85%] rounded-xl p-3 text-sm", mine ? "self-end bg-primary text-primary-foreground" : "self-start bg-muted")}>
                <p className="mb-1 text-xs font-medium">
                  {mine ? "Ty" : m.senderName}
                  {m.sentAt && (
                    <>
                      {" · "}
                      <time dateTime={m.sentAt} className={mine ? "opacity-90" : "text-muted-foreground"}>{dateFormat.format(new Date(m.sentAt))}</time>
                    </>
                  )}
                </p>
                <p className="whitespace-pre-line break-words">{m.content}</p>
              </li>
            );
          })}
        </ol>
      )}
      <p aria-live="polite" className="sr-only">
        {last && last.senderId !== user?.id ? t("Ostatnia wiadomość od {name}", { name: last.senderName }) : ""}
      </p>

      {closed ? (
        <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">{t("Ta rozmowa jest zamknięta. Otwórz ją ponownie, aby odpowiedzieć.")}</p>
      ) : (
        <form onSubmit={send} noValidate className="flex flex-col gap-2 border-t pt-3">
          <FieldLabel htmlFor={`reply-${conversation.id}-content`}>{t("Twoja odpowiedź")}</FieldLabel>
          <Textarea
            {...fieldProps("content")}
            rows={3}
            maxLength={4000}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              clear("content");
            }}
          />
          <FieldError {...errorProps("content")} />
          <Button type="submit" className="self-end" disabled={reply.isPending}>
            <HugeiconsIcon icon={SentIcon} strokeWidth={2} data-icon="inline-start" aria-hidden="true" />
            {reply.isPending ? t("Wysyłanie...") : t("Wyślij")}
          </Button>
        </form>
      )}
    </section>
  );
}

function MessagesView() {
  const { hasRole, role, user } = useAuth();
  const isStaff = hasRole(ROLES.JST, ROLES.ROPS);
  const canWrite = role !== ROLES.ROPS;
  const canChooseRecipient = role !== ROLES.JST && role !== ROLES.ROPS;
  const conversations = useConversations();
  const [selectedId, setSelectedId] = useState(null);
  const [creating, setCreating] = useState(false);
  const headingRef = useRef(null);
  const focusThread = useRef(false);
  const list = conversations.data ?? [];
  const selected = list.find((c) => c.id === selectedId) ?? null;

  useEffect(() => {
    if (selected && focusThread.current) {
      focusThread.current = false;
      headingRef.current?.focus();
    }
  }, [selected]);

  const open = (id) => {
    focusThread.current = true;
    setSelectedId(id);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl px-4 pt-18 pb-10 md:px-8">
        <PageHeader
          icon={Chatting01Icon}
          title={t("Wiadomości")}
          description={role === ROLES.ROPS
            ? t("Wiadomości od mieszkańców, organizacji i samorządów skierowane do ROPS")
            : role === ROLES.JST
              ? t("Wiadomości od mieszkańców do Twojej gminy i Twoje rozmowy z ROPS")
              : t("Rozmowy z ROPS i samorządem Twojej gminy")}
          actions={canWrite && (
            <Button onClick={() => setCreating(true)}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" aria-hidden="true" />
              {role === ROLES.JST ? t("Napisz do ROPS") : t("Nowa rozmowa")}
            </Button>
          )}
        />

        {conversations.isPending ? (
          <LoadingStatus label={t("Wczytywanie rozmów")}><Skeleton className="h-48 w-full rounded-xl" /></LoadingStatus>
        ) : !list.length ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={Chatting01Icon} strokeWidth={2} aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>{t("Brak rozmów")}</EmptyTitle>
              <EmptyDescription>{isStaff || !canWrite ? t("Gdy ktoś napisze, rozmowa pojawi się tutaj.") : t("Zadaj pytanie albo poproś o mentoring, klikając „Nowa rozmowa”.")}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid gap-4 md:grid-cols-[18rem_1fr]">
            <nav aria-label={t("Lista rozmów")}>
              <ul className="flex flex-col gap-2">
                {list.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => open(c.id)}
                      aria-current={c.id === selectedId ? "true" : undefined}
                      className={cn(
                        "flex w-full flex-col items-start gap-1 rounded-2xl border border-border p-3 text-left transition-colors",
                        c.id === selectedId ? "border-primary bg-secondary/60 dark:bg-secondary/40" : "border-border bg-card shadow-elevation-1 hover:shadow-elevation-2"
                      )}
                    >
                      <span className="font-medium break-words">{c.subject}</span>
                      <span className="text-xs text-muted-foreground">
                        {CONVERSATION_TYPE[c.type]?.label ?? c.type}
                        {c.ownerId === user?.id ? ` · do: ${c.recipientLabel}` : ` · od: ${c.ownerName}`}
                      </span>
                      <StatusPill meta={CONVERSATION_STATUS[c.status]} />
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
            {selected ? (
              <Thread key={selected.id} conversation={selected} headingRef={headingRef} />
            ) : (
              <p className="rounded-2xl border border-dashed border-outline p-6 text-sm text-muted-foreground">{t("Wybierz rozmowę z listy, aby zobaczyć wiadomości.")}</p>
            )}
          </div>
        )}
      </div>

      <Modal open={creating && canWrite} onClose={() => setCreating(false)} labelledBy="conv-heading" className="max-w-lg">
        <NewConversation
          canChooseRecipient={canChooseRecipient}
          onClose={() => setCreating(false)}
          onCreated={(id) => {
            setCreating(false);
            open(id);
          }}
        />
      </Modal>
    </div>
  );
}

export default function Messages() {
  return (
    <RoleGuard description={t("Zaloguj się, aby rozmawiać z ekspertami ROPS i samorządem.")}>
      <MessagesView />
    </RoleGuard>
  );
}
