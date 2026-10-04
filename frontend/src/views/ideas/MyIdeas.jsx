"use client";

import { useMemo, useState } from "react";
import { cn } from "cn";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, BubbleChatIcon, BulbIcon, Delete02Icon, Edit02Icon, Idea01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { useFormErrors } from "@/helpers/useFormErrors";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useIdeasByTokens, useMyIdeas } from "@/api/hooks/useIdeasQuery";
import { useAuth } from "@/api/context/AuthContext";
import { useScopedTokens } from "@/hooks/useScopedTokens";
import { useUpdateIdea } from "@/api/hooks/useIdeaMutation";
import { useProposal } from "@/api/context/ProposalContext";
import { useToast } from "@/helpers/ToastProvider";
import { getTargetGroupOption } from "@/lib/problemCategories";
import {
  IDEA_STATUS,
  READINESS,
  ideaTokens,
  toIdeaCardRequest,
} from "@/lib/ideas";
import { useGrantCalls } from "@/api/hooks/useGrantCalls";
import { PageHeader } from "@/components/page-header";

const dateFormat = new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium" });

function StatusBadge({ status }) {
  const meta = IDEA_STATUS[status] ?? IDEA_STATUS.SUBMITTED;
  return <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", meta.className)}>{meta.label}</span>;
}

function EditForm({ token, idea, onDone }) {
  const [draft, setDraft] = useState({
    title: idea.title ?? "",
    essence: idea.essence ?? "",
    problemDescription: idea.problemDescription ?? "",
  });
  const updateIdea = useUpdateIdea();
  const { showToast } = useToast();
  const { fail, clear, fieldProps, errorProps } = useFormErrors(`edit-${token}`);

  const set = (key) => (e) => {
    setDraft((d) => ({ ...d, [key]: e.target.value }));
    clear(key);
  };

  const save = async (e) => {
    e.preventDefault();
    if (draft.title.trim().length < 3) {
      fail("title", "Tytuł musi mieć co najmniej 3 znaki!");
      return;
    }
    try {
      await updateIdea.mutateAsync({
        token,
        model: toIdeaCardRequest(idea, {
          title: draft.title.trim(),
          essence: draft.essence.trim(),
          problemDescription: draft.problemDescription.trim(),
        }),
      });
      showToast("Zapisano zmiany", "success");
      onDone();
    } catch (err) {
      if (err?.body?.message) fail("title", err.body.message);
      else showToast(null, "error");
    }
  };

  return (
    <form onSubmit={save} noValidate aria-label={`Edycja propozycji: ${idea.title}`} className="border-t pt-4">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor={`edit-${token}-title`}>Tytuł</FieldLabel>
          <Input {...fieldProps("title")} required value={draft.title} maxLength={150} onChange={set("title")} />
          <FieldError {...errorProps("title")} />
        </Field>
        <Field>
          <FieldLabel htmlFor={`edit-${token}-problemDescription`}>Krótki opis</FieldLabel>
          <Textarea id={`edit-${token}-problemDescription`} rows={3} value={draft.problemDescription} onChange={set("problemDescription")} />
        </Field>
        <Field>
          <FieldLabel htmlFor={`edit-${token}-essence`}>Istota</FieldLabel>
          <Textarea id={`edit-${token}-essence`} rows={4} value={draft.essence} onChange={set("essence")} />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onDone}>Anuluj</Button>
          <Button type="submit" disabled={updateIdea.isPending}>
            {updateIdea.isPending ? "Zapisywanie..." : "Zapisz"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}

// which call the user is preparing an application for
function GrantCallHint({ callId, hasIdeas }) {
  const calls = useGrantCalls();
  const call = calls.data?.find((c) => c.id === callId);
  return (
    <div role="status" className="mb-6 rounded-xl border border-emerald-700 bg-emerald-500/10 p-4 text-sm dark:border-emerald-400">
      <p className="font-medium">Wniosek grantowy{call ? `: ${call.name}` : ""}</p>
      <p className="text-muted-foreground">
        {hasIdeas
          ? "Wybierz pomysł i kliknij „Przygotuj wniosek”. AI napisze szkic według sekcji tego naboru."
          : "Najpierw dodaj swój pomysł przyciskiem „Nowa propozycja”. Potem przygotujesz do niego wniosek."}
      </p>
    </div>
  );
}

function IdeaCard({ token, query, onForget, callId }) {
  const [editing, setEditing] = useState(false);

  if (query.isPending) {
    return (
      <div role="status">
        <span className="sr-only">Wczytywanie propozycji</span>
        <Skeleton aria-hidden="true" className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-outline p-4 text-sm">
        <span className="min-w-0 text-muted-foreground">
          {query.error?.status === 404 ? "Nie znaleziono propozycji o kodzie" : "Nie udało się wczytać propozycji"}{" "}
          <code className="break-all font-mono text-foreground">{token}</code>
        </span>
        {onForget && <Button variant="ghost" size="sm" onClick={() => onForget(token)} aria-label={`Usuń z listy kod ${token}`}>Usuń</Button>}
      </div>
    );
  }

  const idea = query.data.idea;
  const readiness = READINESS[idea.readiness];

  return (
    <article aria-labelledby={`idea-${token}`} className="flex flex-col gap-3 rounded-2xl border border-border bg-card shadow-elevation-1 p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 id={`idea-${token}`} className="text-base font-semibold leading-snug break-words">{idea.title}</h2>
          <p className="text-xs text-muted-foreground">
            Wysłano {idea.createdAt ? dateFormat.format(new Date(idea.createdAt)) : "—"} · kod{" "}
            <code className="font-mono">{token}</code>
          </p>
        </div>
        <p className="shrink-0"><span className="sr-only">Status: </span><StatusBadge status={idea.status} /></p>
      </div>

      {idea.problemDescription && (
        <p className="text-sm text-muted-foreground whitespace-pre-line break-words">{idea.problemDescription}</p>
      )}
      {idea.essence && <p className="text-sm whitespace-pre-line break-words">{idea.essence}</p>}

      <div className="flex flex-wrap gap-1.5">
        {readiness && (
          <Badge variant="secondary">
            <span aria-hidden="true">{readiness.icon}</span> {readiness.label}
          </Badge>
        )}
        {idea.whoCategories?.map((key) => {
          const who = getTargetGroupOption(key);
          return (
            <Badge key={key} variant="outline">
              <span aria-hidden="true">{who.icon}</span> {who.label}
            </Badge>
          );
        })}
      </div>

      {idea.adminReply && (
        <div className="flex gap-2 rounded-xl bg-violet-500/10 p-3 text-sm">
          <HugeiconsIcon icon={BubbleChatIcon} strokeWidth={2} aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-violet-700 dark:text-violet-300" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-violet-800 dark:text-violet-300">Odpowiedź Hubu</p>
            <p className="whitespace-pre-line">{idea.adminReply}</p>
          </div>
        </div>
      )}

      {editing ? (
        <EditForm token={token} idea={idea} onDone={() => setEditing(false)} />
      ) : (
        <div className="flex flex-wrap justify-end gap-2">
          {onForget && (
            <Button variant="ghost" size="sm" onClick={() => onForget(token)}>
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} data-icon="inline-start" aria-hidden="true" />
              Usuń z listy<span className="sr-only">: {idea.title}</span>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} data-icon="inline-start" aria-hidden="true" />
            Edytuj<span className="sr-only">: {idea.title}</span>
          </Button>
          <Link
            href={callId ? `/my-ideas/${encodeURIComponent(token)}?tab=grant&call=${callId}` : `/my-ideas/${encodeURIComponent(token)}`}
            className={buttonVariants({ size: "sm" })}
          >
            {callId ? "Przygotuj wniosek" : "Rozwiń pomysł"}<span className="sr-only">: {idea.title}</span>
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} data-icon="inline-end" aria-hidden="true" />
          </Link>
        </div>
      )}
    </article>
  );
}

// callId: set when coming from "Przygotuj wniosek z AI" on a grant call
export default function MyIdeas({ callId = null }) {
  const { isLogged } = useAuth();
  const { tokens: localTokens, remember: rememberIdeaToken, forget } = useScopedTokens(ideaTokens);
  const mine = useMyIdeas(isLogged);
  const ownedTokens = useMemo(() => new Set((mine.data ?? []).map((item) => item.idea.trackingToken)), [mine.data]);
  const tokens = useMemo(() => [...new Set([...localTokens, ...ownedTokens])], [localTokens, ownedTokens]);
  const queries = useIdeasByTokens(tokens);
  const { openProposal } = useProposal();
  const [code, setCode] = useState("");

  const addCode = (e) => {
    e.preventDefault();
    const value = code.trim();
    if (!value) return;
    rememberIdeaToken(value);
    setCode("");
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-4 pt-18 pb-10 md:px-8">
        <PageHeader
          icon={Idea01Icon}
          title="Moje propozycje"
          description="Status i odpowiedzi Hubu na Twoje pomysły"
          actions={
            <Button onClick={() => openProposal()}>
              <HugeiconsIcon icon={BulbIcon} strokeWidth={2} data-icon="inline-start" aria-hidden="true" />
              Nowa propozycja
            </Button>
          }
        />

        {callId && <GrantCallHint callId={callId} hasIdeas={tokens.length > 0} />}

        <form onSubmit={addCode} className="mb-8 flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 shadow-elevation-1">
          <label htmlFor="idea-code" className="text-sm font-medium">Masz kod propozycji z innego urządzenia?</label>
          <div className="flex gap-2">
          <Input
            id="idea-code"
            value={code}
            autoComplete="off"
            placeholder="Wklej kod propozycji"
            onChange={(e) => setCode(e.target.value)}
          />
          <Button type="submit" variant="outline">Dodaj</Button>
          </div>
        </form>

        {isLogged && mine.isPending && !tokens.length ? (
          <div role="status">
            <span className="sr-only">Wczytywanie propozycji</span>
            <Skeleton aria-hidden="true" className="h-40 w-full rounded-xl" />
          </div>
        ) : tokens.length ? (
          <div className="flex flex-col gap-4">
            {tokens.map((token, i) => (
              <IdeaCard key={token} token={token} query={queries[i]} onForget={ownedTokens.has(token) ? null : forget} callId={callId} />
            ))}
          </div>
        ) : (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={BulbIcon} strokeWidth={2} />
              </EmptyMedia>
              <EmptyTitle>Nie masz jeszcze propozycji</EmptyTitle>
              <EmptyDescription>{isLogged ? "Propozycje wysłane z tego konta pojawią się tutaj automatycznie." : "Propozycje wysłane z tej przeglądarki pojawią się tutaj automatycznie."}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => openProposal()}>Zaproponuj innowację</Button>
            </EmptyContent>
          </Empty>
        )}
      </div>
    </div>
  );
}
