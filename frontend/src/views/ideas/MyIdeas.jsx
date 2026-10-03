"use client";

import { useState, useSyncExternalStore } from "react";
import { cn } from "cn";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, BulbIcon, Delete02Icon, Edit02Icon, BubbleChatIcon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useIdeasByTokens } from "@/api/hooks/useIdeasQuery";
import { useUpdateIdea } from "@/api/hooks/useIdeaMutation";
import { useProposal } from "@/api/context/ProposalContext";
import { useToast } from "@/helpers/ToastProvider";
import { getTargetGroupOption } from "@/lib/problemCategories";
import {
  IDEA_STATUS,
  READINESS,
  forgetIdeaToken,
  getServerIdeaTokens,
  loadIdeaTokens,
  rememberIdeaToken,
  subscribeIdeaTokens,
  toIdeaCardRequest,
} from "@/lib/ideas";

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

  const set = (key) => (e) => setDraft((d) => ({ ...d, [key]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (draft.title.trim().length < 3) {
      showToast("Tytuł musi mieć co najmniej 3 znaki!", "error");
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
      showToast(err?.body?.message ?? null, "error");
    }
  };

  return (
    <form onSubmit={save} className="border-t pt-4">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor={`t-${token}`}>Tytuł</FieldLabel>
          <Input id={`t-${token}`} value={draft.title} maxLength={150} onChange={set("title")} />
        </Field>
        <Field>
          <FieldLabel htmlFor={`p-${token}`}>Krótki opis</FieldLabel>
          <Textarea id={`p-${token}`} rows={3} value={draft.problemDescription} onChange={set("problemDescription")} />
        </Field>
        <Field>
          <FieldLabel htmlFor={`e-${token}`}>Istota</FieldLabel>
          <Textarea id={`e-${token}`} rows={4} value={draft.essence} onChange={set("essence")} />
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

function IdeaCard({ token, query }) {
  const [editing, setEditing] = useState(false);

  if (query.isPending) return <Skeleton className="h-40 w-full rounded-xl" />;

  if (query.isError) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed p-4 text-sm">
        <span className="min-w-0 text-muted-foreground">
          {query.error?.status === 404 ? "Nie znaleziono propozycji o kodzie" : "Nie udało się wczytać propozycji"}{" "}
          <code className="break-all font-mono text-foreground">{token}</code>
        </span>
        <Button variant="ghost" size="sm" onClick={() => forgetIdeaToken(token)}>Usuń</Button>
      </div>
    );
  }

  const idea = query.data.idea;
  const readiness = READINESS[idea.readiness];

  return (
    <article className="flex flex-col gap-3 rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-base font-semibold leading-snug break-words">{idea.title}</h2>
          <p className="text-xs text-muted-foreground">
            Wysłano {idea.createdAt ? dateFormat.format(new Date(idea.createdAt)) : "—"} · kod{" "}
            <code className="font-mono">{token}</code>
          </p>
        </div>
        <StatusBadge status={idea.status} />
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
          <HugeiconsIcon icon={BubbleChatIcon} strokeWidth={2} className="mt-0.5 size-4 shrink-0 text-violet-600 dark:text-violet-300" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-violet-700 dark:text-violet-300">Odpowiedź Hubu</p>
            <p className="whitespace-pre-line">{idea.adminReply}</p>
          </div>
        </div>
      )}

      {editing ? (
        <EditForm token={token} idea={idea} onDone={() => setEditing(false)} />
      ) : (
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => forgetIdeaToken(token)}>
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} data-icon="inline-start" />
            Usuń z listy
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} data-icon="inline-start" />
            Edytuj
          </Button>
          <Link href={`/my-ideas/${encodeURIComponent(token)}`} className={buttonVariants({ size: "sm" })}>
            Rozwiń pomysł
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} data-icon="inline-end" />
          </Link>
        </div>
      )}
    </article>
  );
}

export default function MyIdeas() {
  const tokens = useSyncExternalStore(subscribeIdeaTokens, loadIdeaTokens, getServerIdeaTokens);
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
      <div className="mx-auto w-full max-w-3xl px-4 pt-14 pb-10 md:px-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-semibold">Moje propozycje</h1>
            <p className="text-muted-foreground">Status i odpowiedzi Hubu na Twoje pomysły</p>
          </div>
          <Button onClick={() => openProposal()}>
            <HugeiconsIcon icon={BulbIcon} strokeWidth={2} data-icon="inline-start" />
            Nowa propozycja
          </Button>
        </header>

        <form onSubmit={addCode} className="mb-6 flex gap-2">
          <Input
            value={code}
            placeholder="Masz kod propozycji z innego urządzenia? Wklej go tutaj"
            aria-label="Kod propozycji"
            onChange={(e) => setCode(e.target.value)}
          />
          <Button type="submit" variant="outline">Dodaj</Button>
        </form>

        {tokens.length ? (
          <div className="flex flex-col gap-4">
            {tokens.map((token, i) => (
              <IdeaCard key={token} token={token} query={queries[i]} />
            ))}
          </div>
        ) : (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={BulbIcon} strokeWidth={2} />
              </EmptyMedia>
              <EmptyTitle>Nie masz jeszcze propozycji</EmptyTitle>
              <EmptyDescription>Propozycje wysłane z tej przeglądarki pojawią się tutaj automatycznie.</EmptyDescription>
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
