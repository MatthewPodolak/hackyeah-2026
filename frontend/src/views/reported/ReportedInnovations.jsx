"use client";

import { useMemo, useState } from "react";
import { cn } from "cn";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  BubbleChatIcon,
  BulbIcon,
  Cancel01Icon,
  Location01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import RoleGuard from "@/views/reported/RoleGuard";
import { ROLES } from "@/api/context/AuthContext";
import { useAdminIdea, useAdminIdeas, useReviewIdea } from "@/api/hooks/useAdminIdeas";
import { useProblem } from "@/api/hooks/useProblemsQuery";
import { useToast } from "@/helpers/ToastProvider";
import { IDEA_STATUS, READINESS } from "@/lib/ideas";
import { getTargetGroupOption } from "@/lib/problemCategories";
import AiFeedback from "@/components/ai-feedback";
import { CanvasSummary } from "@/components/canvas/canvas-fields";
import { useCanvasSpec } from "@/api/hooks/useCanvas";

const dateFormat = new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "short" });
const REVIEW_STATUSES = ["SUBMITTED", "IN_REVIEW", "FEEDBACK_GIVEN", "ACCEPTED", "NOT_NOW"];

function normalize(text) {
  return (text ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l");
}

function StatusBadge({ status }) {
  const meta = IDEA_STATUS[status] ?? IDEA_STATUS.SUBMITTED;
  return <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium", meta.className)}>{meta.label}</span>;
}

function IdeaBadges({ idea }) {
  const readiness = READINESS[idea.readiness];
  return (
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
  );
}

function FilterChip({ active, label, count, onClick }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        active ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
      )}
    >
      {label}
      <span className={cn("rounded-full px-1.5 text-xs tabular-nums", active ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground")}>
        {count}
      </span>
    </button>
  );
}

function SourceProblem({ id }) {
  const problem = useProblem(id);
  if (!problem.data) return null;

  return (
    <div className="flex gap-3 rounded-xl border bg-red-500/5 p-3 text-sm">
      <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-400" />
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-red-600 dark:text-red-400">Odpowiada na problem</p>
        <p className="font-medium break-words">{problem.data.title}</p>
        {problem.data.street && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-3.5" />
            {problem.data.street}
          </p>
        )}
      </div>
    </div>
  );
}

function ReviewForm({ idea, onDone }) {
  const [status, setStatus] = useState(REVIEW_STATUSES.includes(idea.status) ? idea.status : "IN_REVIEW");
  const [reply, setReply] = useState(idea.adminReply ?? "");
  const review = useReviewIdea();
  const { showToast } = useToast();

  const save = async (e) => {
    e.preventDefault();
    try {
      await review.mutateAsync({ id: idea.id, model: { status, reply: reply.trim() } });
      showToast("Zapisano ocenę propozycji", "success");
      onDone();
    } catch (err) {
      showToast(err?.body?.message ?? null, "error");
    }
  };

  return (
    <form onSubmit={save} className="rounded-xl bg-muted/50 p-4">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="review-status">Status</FieldLabel>
          <NativeSelect id="review-status" className="w-full" value={status} onChange={(e) => setStatus(e.target.value)}>
            {REVIEW_STATUSES.map((key) => (
              <NativeSelectOption key={key} value={key}>{IDEA_STATUS[key].label}</NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor="review-reply">Odpowiedź do autora</FieldLabel>
          <Textarea
            id="review-reply"
            rows={4}
            value={reply}
            placeholder="Autor zobaczy tę wiadomość w „Moich propozycjach”"
            onChange={(e) => setReply(e.target.value)}
          />
        </Field>
        <Button type="submit" disabled={review.isPending}>
          {review.isPending ? "Zapisywanie..." : "Zapisz ocenę"}
        </Button>
      </FieldGroup>
    </form>
  );
}

function IdeaDetails({ id, onClose }) {
  const details = useAdminIdea(id);
  const spec = useCanvasSpec();
  const idea = details.data?.idea;

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} className="fixed inset-0 z-[2000] flex overflow-y-auto bg-black/40 p-6">
      <div className="m-auto w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200">
        <Card className="pt-0">
          <div className="h-1.5 bg-emerald-500" />
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <HugeiconsIcon icon={BulbIcon} strokeWidth={2} className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Propozycja innowacji</p>
                {idea ? (
                  <h2 className="text-lg font-semibold leading-snug break-words">{idea.title}</h2>
                ) : (
                  <Skeleton className="mt-1 h-6 w-48" />
                )}
              </div>
              <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Zamknij">
                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            {!idea ? (
              <Skeleton className="h-48 w-full rounded-xl" />
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <StatusBadge status={idea.status} />
                  {idea.createdAt && <span>Wysłano {dateFormat.format(new Date(idea.createdAt))}</span>}
                </div>

                <IdeaBadges idea={idea} />

                {idea.problemDescription && (
                  <section>
                    <h3 className="text-sm font-semibold">Krótki opis</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line break-words">{idea.problemDescription}</p>
                  </section>
                )}
                {idea.essence && (
                  <section>
                    <h3 className="text-sm font-semibold">Istota</h3>
                    <p className="text-sm whitespace-pre-line break-words">{idea.essence}</p>
                  </section>
                )}

                {idea.sourceProblemId != null && <SourceProblem id={idea.sourceProblemId} />}

                {details.data.canvas && Object.keys(details.data.canvas).length > 0 && (
                  <section className="rounded-xl border p-4">
                    <h3 className="mb-3 text-sm font-semibold">Kanwa innowacji</h3>
                    <CanvasSummary spec={spec.data} answers={details.data.canvas} />
                  </section>
                )}

                <AiFeedback feedback={details.data.feedback} />

                <ReviewForm key={idea.id + idea.status} idea={idea} onDone={onClose} />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function IdeasList() {
  const { data: ideas, isPending } = useAdminIdeas();
  const [status, setStatus] = useState(null);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);

  const all = useMemo(() => ideas ?? [], [ideas]);

  const counts = useMemo(() => {
    const result = {};
    for (const idea of all) result[idea.status] = (result[idea.status] ?? 0) + 1;
    return result;
  }, [all]);

  const words = normalize(query).split(/\s+/).filter(Boolean);
  const visible = all
    .filter((idea) => !status || idea.status === status)
    .filter((idea) => {
      const text = normalize([idea.title, idea.essence, idea.problemDescription].join(" "));
      return words.every((word) => text.includes(word));
    });

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl px-4 pt-14 pb-10 md:px-8">
        <header className="mb-6">
          <h1 className="font-heading text-2xl font-semibold">Zgłoszone innowacje</h1>
          <p className="text-muted-foreground">Propozycje rozwiązań i innowacji przesłane przez mieszkańców</p>
        </header>

        <div className="mb-6 flex flex-col gap-3">
          <InputGroup>
            <InputGroupAddon>
              <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              value={query}
              placeholder="Szukaj po tytule lub opisie..."
              aria-label="Szukaj propozycji"
              onChange={(e) => setQuery(e.target.value)}
            />
          </InputGroup>
          <div className="flex flex-wrap gap-2">
            <FilterChip active={!status} label="Wszystkie" count={all.length} onClick={() => setStatus(null)} />
            {REVIEW_STATUSES.map((key) => (
              <FilterChip
                key={key}
                active={status === key}
                label={IDEA_STATUS[key].label}
                count={counts[key] ?? 0}
                onClick={() => setStatus(status === key ? null : key)}
              />
            ))}
          </div>
        </div>

        {isPending ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : visible.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {visible.map((idea) => (
              <li key={idea.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(idea.id)}
                  className="flex w-full gap-4 rounded-xl border bg-card p-4 text-left transition-shadow outline-none hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <HugeiconsIcon icon={BulbIcon} strokeWidth={2} className="size-5" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-semibold leading-snug break-words">{idea.title}</h2>
                      <StatusBadge status={idea.status} />
                    </div>
                    {(idea.essence || idea.problemDescription) && (
                      <p className="line-clamp-2 text-sm text-muted-foreground break-words">
                        {idea.essence || idea.problemDescription}
                      </p>
                    )}
                    <IdeaBadges idea={idea} />
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {idea.createdAt && <span>{dateFormat.format(new Date(idea.createdAt))}</span>}
                      {idea.sourceProblemId != null && (
                        <span className="flex items-center gap-1">
                          <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-3.5" />
                          Odpowiada na zgłoszony problem
                        </span>
                      )}
                      {idea.adminReply && (
                        <span className="flex items-center gap-1">
                          <HugeiconsIcon icon={BubbleChatIcon} strokeWidth={2} className="size-3.5" />
                          Udzielono odpowiedzi
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={BulbIcon} strokeWidth={2} />
              </EmptyMedia>
              <EmptyTitle>Brak propozycji</EmptyTitle>
              <EmptyDescription>
                {all.length ? "Żadna propozycja nie pasuje do filtrów." : "Gdy mieszkańcy prześlą propozycje, pojawią się tutaj."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>

      {openId != null && <IdeaDetails id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

export default function ReportedInnovations() {
  return (
    <RoleGuard roles={[ROLES.JST, ROLES.ROPS]}>
      <IdeasList />
    </RoleGuard>
  );
}
