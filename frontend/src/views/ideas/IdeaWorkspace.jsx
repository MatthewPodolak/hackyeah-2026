"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "cn";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Calendar03Icon,
  CheckmarkCircle02Icon,
  Copy01Icon,
  FileEditIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import AiFeedback from "@/components/ai-feedback";
import { CanvasField, formatCanvasValue } from "@/components/canvas/canvas-fields";
import { useCanvasSpec, useIdeaByToken, useIdeaFeedback, useSaveCanvas, useSuggestCanvas } from "@/api/hooks/useCanvas";
import { useActiveGrantCalls, useGrantApplication } from "@/api/hooks/useGrantCalls";
import { useToast } from "@/helpers/ToastProvider";
import { IDEA_STATUS } from "@/lib/ideas";

const dateFormat = new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium" });

function aiErrorMessage(err) {
  if (err?.status === 429) return "Za dużo zapytań do AI, spróbuj za chwilę";
  return err?.body?.message ?? null;
}

function isFilled(value) {
  if (value == null) return false;
  if (Array.isArray(value)) return value.some((v) => (typeof v === "string" ? v.trim() : v?.name?.trim?.()));
  if (typeof value === "object") return Object.keys(value).length > 0 && (value.value !== undefined ? !!value.value : true);
  return value !== "";
}

function StepNav({ steps, current, answers, onSelect }) {
  return (
    <ol className="grid gap-2 sm:grid-cols-4">
      {steps.map((step, index) => {
        const filled = step.sections.filter((section) => isFilled(answers[section.id])).length;
        const done = filled === step.sections.length;
        return (
          <li key={step.id}>
            <button
              type="button"
              onClick={() => onSelect(index)}
              aria-current={current === index ? "step" : undefined}
              className={cn(
                "flex w-full flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                current === index ? "border-emerald-500 bg-emerald-500/10" : "hover:bg-muted"
              )}
            >
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                Krok {index + 1}
                {done && <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-3.5 text-emerald-600" />}
              </span>
              <span className="text-sm font-semibold leading-snug">{step.title}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {filled}/{step.sections.length} sekcji
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function SuggestionBox({ section, suggestion, reason, onApply }) {
  const text = formatCanvasValue(section, suggestion);
  if (!text) return null;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-dashed border-emerald-500/60 bg-emerald-500/5 p-3 text-sm sm:flex-row sm:items-start">
      <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
      <div className="min-w-0 flex-1">
        <p className="font-medium break-words">{text}</p>
        {reason && <p className="text-xs text-muted-foreground">{reason}</p>}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onApply}>Zastosuj</Button>
    </div>
  );
}

function CanvasEditor({ spec, answers, setAnswer, onSave, saving, token }) {
  const [current, setCurrent] = useState(0);
  const [suggestions, setSuggestions] = useState({});
  const suggest = useSuggestCanvas(token);
  const { showToast } = useToast();
  const step = spec.steps[current];
  const stepSuggestion = suggestions[step.id];

  const askAi = async () => {
    try {
      const result = await suggest.mutateAsync(step.id);
      setSuggestions((s) => ({ ...s, [step.id]: result }));
      if (!Object.keys(result.answers ?? {}).length) showToast("AI nie ma propozycji dla tego kroku — uzupełnij fiszkę", "info");
    } catch (err) {
      showToast(aiErrorMessage(err), "error");
    }
  };

  const applyAll = () => {
    Object.entries(stepSuggestion?.answers ?? {}).forEach(([id, value]) => setAnswer(id, value));
    setSuggestions((s) => ({ ...s, [step.id]: null }));
  };

  const go = async (index) => {
    await onSave(true);
    setCurrent(index);
    window.scrollTo?.({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col gap-5">
      <StepNav steps={spec.steps} current={current} answers={answers} onSelect={go} />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/50 p-3">
        <div>
          <h2 className="font-semibold">{step.title}</h2>
          <p className="text-xs text-muted-foreground">Odpowiedz na tyle pytań, na ile potrafisz — nic nie jest obowiązkowe.</p>
        </div>
        <div className="flex gap-2">
          {stepSuggestion && Object.keys(stepSuggestion.answers ?? {}).length > 0 && (
            <Button type="button" variant="outline" size="sm" onClick={applyAll}>Zastosuj wszystkie</Button>
          )}
          <Button type="button" variant="outline" size="sm" onClick={askAi} disabled={suggest.isPending}>
            {suggest.isPending ? <Spinner data-icon="inline-start" /> : <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} data-icon="inline-start" />}
            {suggest.isPending ? "AI myśli..." : "Podpowiedz AI"}
          </Button>
        </div>
      </div>

      {step.sections.map((section) => (
        <section key={section.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
          <div>
            <h3 className="font-medium">
              {section.icon && <span aria-hidden="true">{section.icon} </span>}
              {section.title}
            </h3>
            {section.question && <p className="text-sm text-muted-foreground">{section.question}</p>}
          </div>
          {stepSuggestion?.answers?.[section.id] !== undefined && (
            <SuggestionBox
              section={section}
              suggestion={stepSuggestion.answers[section.id]}
              reason={stepSuggestion.reasons?.[section.id]}
              onApply={() => {
                setAnswer(section.id, stepSuggestion.answers[section.id]);
                setSuggestions((s) => {
                  const rest = { ...s[step.id].answers };
                  delete rest[section.id];
                  return { ...s, [step.id]: { ...s[step.id], answers: rest } };
                });
              }}
            />
          )}
          <CanvasField section={section} value={answers[section.id]} onChange={(value) => setAnswer(section.id, value)} />
        </section>
      ))}

      <div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <Button type="button" variant="ghost" disabled={current === 0} onClick={() => go(current - 1)}>Wstecz</Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => onSave(false)} disabled={saving}>
            {saving ? "Zapisywanie..." : "Zapisz"}
          </Button>
          {current < spec.steps.length - 1 && (
            <Button type="button" onClick={() => go(current + 1)} disabled={saving}>Dalej</Button>
          )}
        </div>
      </div>
    </div>
  );
}

function FeedbackTab({ token, feedback, beforeAi }) {
  const askFeedback = useIdeaFeedback(token);
  const { showToast } = useToast();

  const run = async () => {
    try {
      await beforeAi();
      await askFeedback.mutateAsync();
    } catch (err) {
      showToast(aiErrorMessage(err), "error");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          AI oceni Twój pomysł na podstawie fiszki i kanwy: mocne strony, co poprawić i jaki zrobić następny krok.
        </p>
        <Button onClick={run} disabled={askFeedback.isPending}>
          {askFeedback.isPending ? <Spinner data-icon="inline-start" /> : <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} data-icon="inline-start" />}
          {askFeedback.isPending ? "AI ocenia..." : feedback ? "Oceń ponownie" : "Poproś o ocenę"}
        </Button>
      </div>
      {askFeedback.data || feedback ? (
        <AiFeedback feedback={askFeedback.data ?? feedback} />
      ) : (
        <p className="text-sm text-muted-foreground">Nie masz jeszcze oceny. Najlepiej poproś o nią po wypełnieniu kanwy.</p>
      )}
    </div>
  );
}

function GrantTab({ token, beforeAi }) {
  const calls = useActiveGrantCalls();
  const application = useGrantApplication();
  const [callId, setCallId] = useState(null);
  const [extraInfo, setExtraInfo] = useState("");
  const { showToast } = useToast();

  const generate = async () => {
    if (!callId) {
      showToast("Wybierz nabór", "error");
      return;
    }
    try {
      await beforeAi();
      await application.mutateAsync({ callId, model: { ideaToken: token, extraInfo: extraInfo.trim() } });
    } catch (err) {
      showToast(aiErrorMessage(err), "error");
    }
  };

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast("Skopiowano", "success");
    } catch {
      showToast(null, "error");
    }
  };

  if (calls.isPending) return <Skeleton className="h-40 w-full rounded-xl" />;

  if (!calls.data?.length) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} />
          </EmptyMedia>
          <EmptyTitle>Brak aktywnych naborów</EmptyTitle>
          <EmptyDescription>Gdy JST lub ROPS ogłoszą nabór, przygotujesz tu szkic wniosku na podstawie swojego pomysłu.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const sections = application.data?.sections ?? [];
  const fullText = sections.map((s) => `${s.title}\n\n${s.content}`).join("\n\n");

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {calls.data.map((call) => (
          <button
            key={call.id}
            type="button"
            role="radio"
            aria-checked={callId === call.id}
            onClick={() => setCallId(call.id)}
            className={cn(
              "flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              callId === call.id ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500" : "hover:bg-muted"
            )}
          >
            <span className="font-semibold">{call.name}</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
              <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-3.5" />
              {dateFormat.format(new Date(call.openFrom))} – {dateFormat.format(new Date(call.openTo))}
            </span>
            {call.description && <span className="line-clamp-3 text-sm text-muted-foreground">{call.description}</span>}
          </button>
        ))}
      </div>

      <Textarea
        rows={3}
        value={extraInfo}
        placeholder="Dodatkowe informacje do wniosku (opcjonalnie): budżet, partnerzy, harmonogram…"
        onChange={(e) => setExtraInfo(e.target.value)}
      />
      <Button className="self-start" onClick={generate} disabled={application.isPending}>
        {application.isPending ? <Spinner data-icon="inline-start" /> : <HugeiconsIcon icon={FileEditIcon} strokeWidth={2} data-icon="inline-start" />}
        {application.isPending ? "AI pisze wniosek..." : "Wygeneruj szkic wniosku"}
      </Button>

      {sections.length > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">Szkic wniosku</h3>
            <Button variant="outline" size="sm" onClick={() => copy(fullText)}>
              <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} data-icon="inline-start" />
              Kopiuj całość
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Fragmenty oznaczone „[do uzupełnienia]” wymagają Twoich danych.</p>
          {sections.map((section, i) => (
            <section key={i} className="rounded-lg bg-muted/40 p-3">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-semibold">{section.title}</h4>
                <Button variant="ghost" size="icon-sm" aria-label="Kopiuj sekcję" onClick={() => copy(`${section.title}\n\n${section.content}`)}>
                  <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} />
                </Button>
              </div>
              <p className="text-sm whitespace-pre-line">{section.content}</p>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function Workspace({ token, details, spec }) {
  const [answers, setAnswers] = useState(() => details.canvas ?? {});
  const [dirty, setDirty] = useState(false);
  const save = useSaveCanvas(token);
  const { showToast } = useToast();
  const idea = details.idea;
  const status = IDEA_STATUS[idea.status] ?? IDEA_STATUS.SUBMITTED;

  const setAnswer = (id, value) => {
    setAnswers((a) => ({ ...a, [id]: value }));
    setDirty(true);
  };

  const persist = async (silent) => {
    if (silent && !dirty) return;
    try {
      await save.mutateAsync(answers);
      setDirty(false);
      if (!silent) showToast("Zapisano kanwę", "success");
    } catch (err) {
      showToast(err?.body?.message ?? null, "error");
      throw err;
    }
  };

  const beforeAi = () => persist(true);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link href="/my-ideas" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "self-start")}>
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} data-icon="inline-start" />
          Moje propozycje
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h1 className="font-heading text-2xl font-semibold break-words">{idea.title}</h1>
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", status.className)}>{status.label}</span>
        </div>
        {idea.essence && <p className="text-muted-foreground whitespace-pre-line">{idea.essence}</p>}
        {dirty && <p className="text-xs text-amber-600 dark:text-amber-400">Masz niezapisane zmiany w kanwie</p>}
      </header>

      <Tabs defaultValue="canvas" className="gap-4">
        <TabsList>
          <TabsTrigger value="canvas">Kanwa innowacji</TabsTrigger>
          <TabsTrigger value="feedback">Ocena AI</TabsTrigger>
          <TabsTrigger value="grant">Wniosek grantowy</TabsTrigger>
        </TabsList>
        <TabsContent value="canvas">
          <CanvasEditor spec={spec} answers={answers} setAnswer={setAnswer} onSave={persist} saving={save.isPending} token={token} />
        </TabsContent>
        <TabsContent value="feedback">
          <FeedbackTab token={token} feedback={details.feedback} beforeAi={beforeAi} />
        </TabsContent>
        <TabsContent value="grant">
          <GrantTab token={token} beforeAi={beforeAi} />
        </TabsContent>
      </Tabs>

      {spec.attribution && (
        <p className="text-xs text-muted-foreground">
          {spec.attribution}.{" "}
          {spec.sourceUrl && (
            <a href={spec.sourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">Kanwa w PDF</a>
          )}
        </p>
      )}
    </div>
  );
}

export default function IdeaWorkspace({ token }) {
  const details = useIdeaByToken(token);
  const spec = useCanvasSpec();

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-4xl px-4 pt-14 pb-10 md:px-8">
        {details.isError ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyTitle>Nie znaleziono propozycji</EmptyTitle>
              <EmptyDescription>Sprawdź, czy kod jest poprawny.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : details.data && spec.data ? (
          <Workspace token={token} details={details.data} spec={spec.data} />
        ) : (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        )}
      </div>
    </div>
  );
}
