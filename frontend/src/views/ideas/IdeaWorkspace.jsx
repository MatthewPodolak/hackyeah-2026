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
import LoadingStatus from "@/components/loading-status";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import AiFeedback from "@/components/ai-feedback";
import { CanvasField, formatCanvasValue } from "@/components/canvas/canvas-fields";
import { useCanvasSpec, useIdeaByToken, useIdeaFeedback, useSaveCanvas, useSuggestCanvas, useVisualize } from "@/api/hooks/useCanvas";
import { API } from "@/api/endpoints";
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
    <nav aria-label="Kroki kanwy">
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
                "flex w-full flex-col items-start gap-1 rounded-2xl border border-border p-3 text-left transition-colors",
                current === index ? "border-emerald-700 bg-emerald-500/10 ring-1 ring-emerald-700 dark:border-emerald-400 dark:ring-emerald-400" : "border-outline hover:bg-muted"
              )}
            >
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                Krok {index + 1}
                {current === index && <span className="sr-only">(bieżący)</span>}
                {done && <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-3.5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />}
                {done && <span className="sr-only">(ukończony)</span>}
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
    </nav>
  );
}

function SuggestionBox({ section, suggestion, reason, onApply }) {
  const text = formatCanvasValue(section, suggestion);
  if (!text) return null;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-dashed border-emerald-700/60 bg-emerald-500/5 p-3 text-sm sm:flex-row sm:items-start">
      <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="mt-0.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-medium break-words"><span className="sr-only">Podpowiedź AI: </span>{text}</p>
        {reason && <p className="text-xs text-muted-foreground">{reason}</p>}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onApply} aria-label={`Zastosuj podpowiedź dla: ${section.title}`}>Zastosuj</Button>
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
    try {
      await onSave(true);
    } catch {
      return;
    }
    setCurrent(index);
    requestAnimationFrame(() => {
      const heading = document.getElementById("canvas-step-heading");
      heading?.scrollIntoView({ block: "start" });
      heading?.focus({ preventScroll: true });
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <StepNav steps={spec.steps} current={current} answers={answers} onSelect={go} />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/50 p-3">
        <div>
          <h2 id="canvas-step-heading" tabIndex={-1} className="font-semibold outline-none">
            Krok {current + 1} z {spec.steps.length}: {step.title}
          </h2>
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
      <p role="status" className="sr-only">
        {suggest.isPending
          ? "AI przygotowuje podpowiedzi"
          : stepSuggestion
            ? `Podpowiedzi AI dla ${Object.keys(stepSuggestion.answers ?? {}).length} sekcji. Przy każdej sekcji jest przycisk Zastosuj.`
            : ""}
      </p>

      {step.sections.map((section) => (
        <section key={section.id} aria-labelledby={`canvas-${section.id}`} className="flex flex-col gap-3 rounded-2xl border border-border bg-card shadow-elevation-1 p-4">
          <div>
            <h3 id={`canvas-${section.id}`} className="font-medium">
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
          <CanvasField
            section={section}
            value={answers[section.id]}
            labelledBy={`canvas-${section.id}`}
            onChange={(value) => setAnswer(section.id, value)}
          />
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
      <p role="status" className="sr-only">
        {askFeedback.isPending ? "Trwa ocenianie pomysłu" : askFeedback.data ? "Ocena AI jest gotowa" : ""}
      </p>
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

  if (calls.isPending) return <LoadingStatus label="Wczytywanie naborów"><Skeleton className="h-40 w-full rounded-xl" /></LoadingStatus>;

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
      <p id="grant-calls-label" className="text-sm font-medium">Wybierz nabór</p>
      <div role="radiogroup" aria-labelledby="grant-calls-label" className="grid gap-3 sm:grid-cols-2">
        {calls.data.map((call) => (
          <button
            key={call.id}
            type="button"
            role="radio"
            aria-checked={callId === call.id}
            onClick={() => setCallId(call.id)}
            className={cn(
              "relative flex flex-col items-start gap-1.5 rounded-2xl border border-border p-4 pr-9 text-left transition-colors",
              callId === call.id ? "border-emerald-700 bg-emerald-500/10 ring-1 ring-emerald-700 dark:border-emerald-400 dark:ring-emerald-400" : "border-outline hover:bg-muted"
            )}
          >
            {callId === call.id && (
              <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} aria-hidden="true" className="absolute right-3 top-3 size-5 text-emerald-700 dark:text-emerald-400" />
            )}
            <span className="font-semibold">{call.name}</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
              <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-3.5" />
              {dateFormat.format(new Date(call.openFrom))} – {dateFormat.format(new Date(call.openTo))}
            </span>
            {call.description && <span className="line-clamp-3 text-sm text-muted-foreground">{call.description}</span>}
          </button>
        ))}
      </div>

      <label htmlFor="grant-extra" className="text-sm font-medium">Dodatkowe informacje do wniosku (opcjonalnie)</label>
      <Textarea
        id="grant-extra"
        rows={3}
        value={extraInfo}
        placeholder="np. budżet, partnerzy, harmonogram…"
        onChange={(e) => setExtraInfo(e.target.value)}
      />
      <Button className="self-start" onClick={generate} disabled={application.isPending}>
        {application.isPending ? <Spinner data-icon="inline-start" /> : <HugeiconsIcon icon={FileEditIcon} strokeWidth={2} data-icon="inline-start" />}
        {application.isPending ? "AI pisze wniosek..." : "Wygeneruj szkic wniosku"}
      </Button>

      <p role="status" className="sr-only">
        {application.isPending ? "Trwa generowanie szkicu wniosku" : sections.length ? "Szkic wniosku jest gotowy" : ""}
      </p>
      {sections.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-border p-4">
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
                <Button variant="ghost" size="icon-sm" aria-label={`Kopiuj sekcję: ${section.title}`} onClick={() => copy(`${section.title}\n\n${section.content}`)}>
                  <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} aria-hidden="true" />
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

function VisualizationTab({ token, idea }) {
  const visualize = useVisualize(token);
  const { showToast } = useToast();
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState(() => idea.updatedAt ?? "");
  const [alt, setAlt] = useState(idea.visualizationAlt ?? "");
  const hasImage = idea.hasVisualization || !!visualize.data;

  const run = async () => {
    try {
      const res = await visualize.mutateAsync(description.trim());
      setAlt(res.alt);
      setVersion(String(Date.now()));
    } catch (err) {
      showToast(err?.status === 429 ? "Za dużo zapytań do AI, spróbuj za chwilę" : err?.body?.message ?? null, "error");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-xl bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          AI narysuje ilustrację Twojego pomysłu na podstawie fiszki. Możesz dopisać, co ma się na niej znaleźć, np. wygląd przedmiotu albo miejsce.
        </p>
        <label htmlFor="viz-description" className="text-sm font-medium">Co ma pokazywać ilustracja? (opcjonalnie)</label>
        <Textarea id="viz-description" rows={2} maxLength={600} value={description} onChange={(e) => setDescription(e.target.value)} />
        <Button className="self-start" onClick={run} disabled={visualize.isPending}>
          {visualize.isPending ? <Spinner data-icon="inline-start" /> : <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} data-icon="inline-start" aria-hidden="true" />}
          {visualize.isPending ? "AI rysuje… (do minuty)" : hasImage ? "Wygeneruj nową wizualizację" : "Wygeneruj wizualizację"}
        </Button>
      </div>
      <p role="status" className="sr-only">{visualize.isPending ? "Trwa generowanie ilustracji" : visualize.data ? "Ilustracja jest gotowa" : ""}</p>
      {hasImage && (
        <figure className="flex flex-col gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- image served by backend */}
          <img src={`${API.idea.visualization(token)}?v=${encodeURIComponent(version)}`} alt={alt || `Ilustracja pomysłu ${idea.title}`} className="w-full max-w-xl rounded-xl border" />
          <figcaption className="text-xs text-muted-foreground">Ilustracja wygenerowana przez AI. Może nie oddawać wszystkich szczegółów pomysłu.</figcaption>
        </figure>
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
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} data-icon="inline-start" aria-hidden="true" />
          Moje propozycje
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h1 className="font-heading text-3xl font-bold tracking-tight break-words">{idea.title}</h1>
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", status.className)}>{status.label}</span>
        </div>
        {idea.essence && <p className="text-muted-foreground whitespace-pre-line">{idea.essence}</p>}
        <p role="status" className="text-xs text-amber-800 dark:text-amber-300">
          {dirty ? "Masz niezapisane zmiany w kanwie" : ""}
        </p>
      </header>

      <Tabs defaultValue="canvas" className="gap-4">
        <TabsList className="h-auto! flex-wrap">
          <TabsTrigger value="canvas">Kanwa innowacji</TabsTrigger>
          <TabsTrigger value="feedback">Ocena AI</TabsTrigger>
          <TabsTrigger value="visual">Wizualizacja</TabsTrigger>
          <TabsTrigger value="grant">Wniosek grantowy</TabsTrigger>
        </TabsList>
        <TabsContent value="canvas">
          <CanvasEditor spec={spec} answers={answers} setAnswer={setAnswer} onSave={persist} saving={save.isPending} token={token} />
        </TabsContent>
        <TabsContent value="feedback">
          <FeedbackTab token={token} feedback={details.feedback} beforeAi={beforeAi} />
        </TabsContent>
        <TabsContent value="visual">
          <VisualizationTab token={token} idea={idea} />
        </TabsContent>
        <TabsContent value="grant">
          <GrantTab token={token} beforeAi={beforeAi} />
        </TabsContent>
      </Tabs>

      {spec.attribution && (
        <p className="text-xs text-muted-foreground">
          {spec.attribution}.{" "}
          {spec.sourceUrl && (
            <a href={spec.sourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">
              Kanwa w PDF<span className="sr-only"> (otwiera się w nowej karcie)</span>
            </a>
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
      <div className="mx-auto w-full max-w-4xl px-4 pt-18 pb-10 md:px-8">
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
          <LoadingStatus label="Wczytywanie pomysłu" className="flex flex-col gap-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </LoadingStatus>
        )}
      </div>
    </div>
  );
}
