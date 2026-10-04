"use client";

import { useMemo, useState } from "react";
import { cn } from "cn";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon, BubbleChatIcon, Calendar03Icon, Cancel01Icon, InboxIcon, Location01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import LoadingStatus from "@/components/loading-status";
import Modal from "@/components/modal";
import StatusPill from "@/components/status-pill";
import RoleGuard from "@/views/reported/RoleGuard";
import { ROLES, useAuth } from "@/api/context/AuthContext";
import { useAdminProblem, useAdminProblems, useReviewProblem } from "@/api/hooks/useAdmin";
import { useGminaDecision, useProblem, useReportedProblems } from "@/api/hooks/useProblemsQuery";
import { useGminyIndex } from "@/api/hooks/useRegionsQuery";
import { useToast } from "@/helpers/ToastProvider";
import { useFormErrors } from "@/helpers/useFormErrors";
import { getProblemCategoryOption, getTargetGroupOption } from "@/lib/problemCategories";
import { PRIORITIES, PROBLEM_PRIORITY, PROBLEM_STATUS, ROPS_STATUSES, problemPriority, problemStatus, waitsForGmina } from "@/lib/problems";
import { gminaName, problemPlace } from "@/lib/gminy";

const dateFormat = new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "short" });
const PRIORITY_RANK = Object.fromEntries(PRIORITIES.map((key, i) => [key, i]));

// queues: which reports each tab shows
const ROPS_QUEUES = {
  rops: { label: "Do oceny ROPS", test: (p) => !waitsForGmina(p) && p.status !== "GMINA_REJECTED" },
  waiting: { label: "Czeka na gminę", test: (p) => waitsForGmina(p) },
  rejected: { label: "Odrzucone przez gminy", test: (p) => p.status === "GMINA_REJECTED" },
  all: { label: "Wszystkie", test: () => true },
};
const JST_QUEUES = {
  waiting: { label: "Do oceny", test: (p) => waitsForGmina(p) },
  forwarded: { label: "Przekazane do ROPS", test: (p) => !waitsForGmina(p) && p.status !== "GMINA_REJECTED" },
  rejected: { label: "Odrzucone", test: (p) => p.status === "GMINA_REJECTED" },
  all: { label: "Wszystkie", test: () => true },
};

function normalize(text) {
  return (text ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l");
}

// ROPS: most urgent first; JST: newest first (waiting ones are in their own tab)
function byPriorityThenDate(a, b) {
  const rank = (item) => PRIORITY_RANK[item.priority] ?? PRIORITIES.length;
  return rank(a) - rank(b) || (b.problem.localDate ?? "").localeCompare(a.problem.localDate ?? "");
}

function FilterChip({ active, label, count, onClick }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "border-foreground/45 bg-background hover:bg-muted"
      )}
    >
      {label}
      <span className="sr-only">, liczba:</span>
      <span className={cn("rounded-full px-1.5 text-xs tabular-nums", active ? "bg-primary-foreground font-semibold text-primary" : "bg-muted text-muted-foreground")}>{count}</span>
    </button>
  );
}

function Badges({ problem }) {
  const category = getProblemCategoryOption(problem.category);
  const group = getTargetGroupOption(problem.targetGroup);
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge variant="secondary"><span aria-hidden="true">{category.icon}</span> {category.label}</Badge>
      <Badge variant="outline"><span aria-hidden="true">{group.icon}</span> {group.label}</Badge>
    </div>
  );
}

function PriorityPill({ priority }) {
  const meta = problemPriority(priority);
  return meta ? <StatusPill meta={meta} label="Priorytet" /> : null;
}

// what the gmina decided: note for ROPS on accept, reason on decline
function GminaNote({ item }) {
  if (!item.gminaNote) return null;
  const rejected = item.problem.status === "GMINA_REJECTED";
  return (
    <div className={cn("rounded-xl p-3 text-sm", rejected ? "bg-red-500/10" : "bg-teal-500/10")}>
      <p className={cn("text-xs font-medium uppercase tracking-wide", rejected ? "text-red-800 dark:text-red-300" : "text-teal-800 dark:text-teal-300")}>
        {rejected ? "Powód odrzucenia przez gminę" : "Notatka gminy dla ROPS"}
      </p>
      <p className="whitespace-pre-line break-words">{item.gminaNote}</p>
    </div>
  );
}

function ReviewForm({ item, onDone }) {
  const current = item.problem.status ?? "SUBMITTED";
  const [status, setStatus] = useState(current);
  const [priority, setPriority] = useState(item.priority ?? "");
  const [reply, setReply] = useState(item.adminReply ?? "");
  const review = useReviewProblem();
  const { showToast } = useToast();
  const statuses = ROPS_STATUSES.includes(current) ? ROPS_STATUSES : [current, ...ROPS_STATUSES];

  const save = async (e) => {
    e.preventDefault();
    try {
      await review.mutateAsync({ id: item.problem.id, model: { status, reply, priority: priority || null } });
      showToast("Zapisano odpowiedź do zgłoszenia", "success");
      onDone();
    } catch (err) {
      showToast(err?.body?.message ?? null, "error");
    }
  };

  return (
    <form onSubmit={save} className="rounded-xl bg-muted/50 p-4">
      <FieldGroup>
        {current === "GMINA_REJECTED" && (
          <p className="text-sm text-muted-foreground">Gmina odrzuciła to zgłoszenie. Wybierz inny status, aby przywrócić je do oceny ROPS.</p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="problem-status">Status</FieldLabel>
            <NativeSelect id="problem-status" className="w-full" value={status} onChange={(e) => setStatus(e.target.value)}>
              {statuses.map((key) => (
                <NativeSelectOption key={key} value={key}>{PROBLEM_STATUS[key].label}</NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel htmlFor="problem-priority">Priorytet</FieldLabel>
            <NativeSelect id="problem-priority" className="w-full" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <NativeSelectOption value="" disabled>Bez priorytetu</NativeSelectOption>
              {PRIORITIES.map((key) => (
                <NativeSelectOption key={key} value={key}>{PROBLEM_PRIORITY[key].label}</NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="problem-reply">Odpowiedź do zgłaszającego</FieldLabel>
          <Textarea
            id="problem-reply"
            rows={4}
            value={reply}
            placeholder="Zgłaszający zobaczy tę wiadomość w „Moich zgłoszeniach”"
            onChange={(e) => setReply(e.target.value)}
          />
        </Field>
        <Button type="submit" disabled={review.isPending}>{review.isPending ? "Zapisywanie..." : "Zapisz odpowiedź"}</Button>
      </FieldGroup>
    </form>
  );
}

// JST: accept with a priority (note for ROPS optional) or decline with a reason
function DecisionForm({ item, onDone }) {
  const [accept, setAccept] = useState(null);
  const [priority, setPriority] = useState("");
  const [note, setNote] = useState("");
  const decide = useGminaDecision();
  const { showToast } = useToast();
  const { fail, clear, fieldProps, errorProps } = useFormErrors("decision");

  const submit = async (e) => {
    e.preventDefault();
    if (accept === null) return fail("choice", "Wybierz: przyjmij albo odrzuć");
    if (accept && !priority) return fail("priority", "Wybierz priorytet");
    if (!accept && !note.trim()) return fail("note", "Podaj powód odrzucenia");
    try {
      await decide.mutateAsync({ id: item.problem.id, model: { accept, priority: accept ? priority : null, note } });
      showToast(accept ? "Zgłoszenie przekazano do ROPS" : "Zgłoszenie odrzucono", "success");
      onDone();
    } catch (err) {
      showToast(err?.body?.message ?? null, "error");
    }
  };

  const choose = (value) => {
    setAccept(value);
    clear("choice");
  };

  return (
    <form onSubmit={submit} noValidate className="rounded-xl bg-muted/50 p-4">
      <FieldGroup>
        <div role="radiogroup" aria-labelledby="decision-choice-label" id="decision-choice" className="flex flex-col gap-2">
          <p id="decision-choice-label" className="text-sm font-medium">Decyzja gminy</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" role="radio" aria-checked={accept === true} variant={accept === true ? "default" : "outline"} onClick={() => choose(true)}>
              Przyjmij i przekaż do ROPS
            </Button>
            <Button type="button" role="radio" aria-checked={accept === false} variant={accept === false ? "destructive" : "outline"} onClick={() => choose(false)}>
              Odrzuć
            </Button>
          </div>
          <FieldError {...errorProps("choice")} />
        </div>
        {accept === true && (
          <Field>
            <FieldLabel htmlFor="decision-priority">Priorytet</FieldLabel>
            <NativeSelect
              {...fieldProps("priority")}
              className="w-full"
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                clear("priority");
              }}
            >
              <NativeSelectOption value="" disabled>Wybierz priorytet</NativeSelectOption>
              {PRIORITIES.map((key) => (
                <NativeSelectOption key={key} value={key}>{PROBLEM_PRIORITY[key].label}</NativeSelectOption>
              ))}
            </NativeSelect>
            <FieldError {...errorProps("priority")} />
          </Field>
        )}
        {accept !== null && (
          <Field>
            <FieldLabel htmlFor="decision-note">{accept ? "Notatka dla ROPS (opcjonalnie)" : "Powód odrzucenia"}</FieldLabel>
            <Textarea
              {...fieldProps("note", "decision-note-hint")}
              rows={3}
              maxLength={2000}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                clear("note");
              }}
            />
            <FieldDescription id="decision-note-hint">
              {accept ? "ROPS zobaczy notatkę przy zgłoszeniu." : "Zgłaszający zobaczy ten powód w „Moich zgłoszeniach”."}
            </FieldDescription>
            <FieldError {...errorProps("note")} />
          </Field>
        )}
        <Button type="submit" disabled={decide.isPending}>{decide.isPending ? "Zapisywanie..." : "Zapisz decyzję"}</Button>
      </FieldGroup>
    </form>
  );
}

function ProblemDialog({ item: listItem, isJst, onClose }) {
  // ROPS: fresh data, and opening marks the report seen once it is in the ROPS queue
  const details = useAdminProblem(isJst ? null : listItem.problem.id);
  const full = useProblem(listItem.problem.id);
  const gminy = useGminyIndex();
  const item = details.data ?? listItem;
  const { problem } = item;
  const waiting = waitsForGmina(problem);

  return (
    <Modal open onClose={onClose} labelledBy="problem-dialog-heading" className="max-w-2xl">
      <Card className="pt-0">
        <div aria-hidden="true" className="h-1.5 bg-red-500" />
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-red-700 dark:text-red-400">Zgłoszony problem</p>
              <h2 id="problem-dialog-heading" className="font-heading text-xl font-bold tracking-tight leading-snug break-words">{problem.title}</h2>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Zamknij szczegóły zgłoszenia">
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} aria-hidden="true" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <StatusPill meta={problemStatus(problem.status)} />
            <PriorityPill priority={item.priority} />
            {problem.localDate && <span>Zgłoszono <time dateTime={problem.localDate}>{dateFormat.format(new Date(problem.localDate))}</time></span>}
            <span>{item.authorName ? `przez ${item.authorName}` : "anonimowo"}</span>
          </div>
          <Badges problem={problem} />
          {full.data?.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- user-uploaded data URL
            <img src={full.data.imageUrl} alt={`Zdjęcie dołączone do zgłoszenia: ${problem.title}`} className="max-h-72 w-full rounded-xl border object-cover" />
          )}
          {problem.description && <p className="text-sm whitespace-pre-line break-words">{problem.description}</p>}
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-4" aria-hidden="true" />
            <span className="sr-only">Miejsce: </span>{problemPlace(problem, gminy)}
          </p>
          <GminaNote item={item} />
          {isJst ? (
            waiting ? (
              <DecisionForm item={item} onDone={onClose} />
            ) : (
              <p className="text-sm text-muted-foreground">Decyzja gminy została zapisana. Dalszą ocenę prowadzi ROPS.</p>
            )
          ) : waiting ? (
            <p className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
              Zgłoszenie czeka na decyzję gminy. Będzie można je ocenić, gdy gmina je przyjmie albo odrzuci.
            </p>
          ) : (
            <ReviewForm key={`${problem.id}-${problem.status}-${item.priority}`} item={item} onDone={onClose} />
          )}
        </CardContent>
      </Card>
    </Modal>
  );
}

function ProblemsList() {
  const { user, isJst } = useAuth();
  const admin = useAdminProblems({ enabled: !isJst });
  const mine = useReportedProblems(isJst ? user.id : null);
  const gminy = useGminyIndex();
  const queues = isJst ? JST_QUEUES : ROPS_QUEUES;
  const [queue, setQueue] = useState(isJst ? "waiting" : "rops");
  const [status, setStatus] = useState(null);
  const [query, setQuery] = useState("");
  const [openItem, setOpenItem] = useState(null);

  const all = useMemo(() => [...((isJst ? mine.data : admin.data) ?? [])].sort(byPriorityThenDate), [isJst, mine.data, admin.data]);
  const isPending = isJst ? mine.isPending : admin.isPending;
  const inQueue = all.filter((item) => queues[queue].test(item.problem));
  const counts = useMemo(() => {
    const result = {};
    for (const item of all) result[item.problem.status] = (result[item.problem.status] ?? 0) + 1;
    return result;
  }, [all]);

  const words = normalize(query).split(/\s+/).filter(Boolean);
  const visible = inQueue
    .filter((item) => !status || item.problem.status === status)
    .filter(({ problem }) => {
      const text = normalize([problem.title, problem.description, problemPlace(problem, gminy), getProblemCategoryOption(problem.category).label, getTargetGroupOption(problem.targetGroup).label].join(" "));
      return words.every((word) => text.includes(word));
    });
  const unseen = isJst ? 0 : all.filter((item) => !item.adminSeen && ROPS_QUEUES.rops.test(item.problem)).length;
  // status chips only make sense inside the ROPS queue
  const showStatusChips = !isJst && queue === "rops";

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl px-4 pt-18 pb-10 md:px-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight">Zgłoszone problemy</h1>
            <p className="text-muted-foreground">
              {isJst
                ? `Zgłoszenia mieszkańców z gminy: ${gminaName(gminy.get(user.gminaId)) ?? "…"}. Przyjmij je z priorytetem albo odrzuć.`
                : "Zgłoszenia przyjęte przez gminy i zgłoszenia bez gminy. Odpowiedź trafia do zgłaszającego."}
            </p>
          </div>
          {unseen > 0 && <p className="text-sm font-medium">Nowe zgłoszenia: {unseen}</p>}
        </header>

        <div role="search" aria-label="Filtry zgłoszeń" className="mb-6 flex flex-col gap-3">
          <InputGroup>
            <InputGroupAddon>
              <HugeiconsIcon icon={Search01Icon} strokeWidth={2} aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              value={query}
              placeholder="Szukaj po tytule, opisie, ulicy lub kategorii..."
              aria-label="Szukaj zgłoszeń"
              onChange={(e) => setQuery(e.target.value)}
            />
          </InputGroup>
          <div role="group" aria-label="Kolejka zgłoszeń" className="flex flex-wrap gap-2">
            {Object.entries(queues).map(([key, meta]) => (
              <FilterChip
                key={key}
                active={queue === key}
                label={meta.label}
                count={all.filter((item) => meta.test(item.problem)).length}
                onClick={() => {
                  setQueue(key);
                  setStatus(null);
                }}
              />
            ))}
          </div>
          {showStatusChips && (
            <div role="group" aria-label="Status zgłoszenia" className="flex flex-wrap gap-2">
              {ROPS_STATUSES.map((key) => (
                <FilterChip key={key} active={status === key} label={PROBLEM_STATUS[key].label} count={counts[key] ?? 0} onClick={() => setStatus(status === key ? null : key)} />
              ))}
            </div>
          )}
        </div>
        <p aria-live="polite" aria-atomic="true" className="sr-only">{isPending ? "" : `Wyniki: ${visible.length} z ${inQueue.length}`}</p>

        {isPending ? (
          <LoadingStatus label="Wczytywanie zgłoszonych problemów" className="flex flex-col gap-3">
            {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
          </LoadingStatus>
        ) : visible.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {visible.map((item) => {
              const { problem } = item;
              const waiting = waitsForGmina(problem);
              return (
                <li key={problem.id} className="relative flex gap-4 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md has-[button:focus-visible]:ring-3 has-[button:focus-visible]:ring-ring/50">
                  <div aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-700 dark:text-red-400">
                    <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-5" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h2 className="font-semibold leading-snug break-words">
                        <button type="button" aria-haspopup="dialog" onClick={() => setOpenItem(item)} className="text-left after:absolute after:inset-0 after:rounded-xl">
                          {problem.title}
                        </button>
                      </h2>
                      <div className="flex flex-wrap items-center gap-2">
                        {isJst && waiting && <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">Do oceny</span>}
                        {!isJst && !item.adminSeen && !waiting && <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">Nowe</span>}
                        <PriorityPill priority={item.priority} />
                        <StatusPill meta={problemStatus(problem.status)} />
                      </div>
                    </div>
                    <Badges problem={problem} />
                    {problem.description && <p className="line-clamp-2 text-sm text-muted-foreground break-words">{problem.description}</p>}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-4 shrink-0" aria-hidden="true" />
                        <span className="sr-only">Miejsce: </span>{problemPlace(problem, gminy)}
                      </span>
                      {problem.localDate && (
                        <span className="flex items-center gap-1.5 tabular-nums">
                          <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-4" aria-hidden="true" />
                          <span className="sr-only">Zgłoszono: </span>
                          <time dateTime={problem.localDate}>{dateFormat.format(new Date(problem.localDate))}</time>
                        </span>
                      )}
                      {item.adminReply && (
                        <span className="flex items-center gap-1.5">
                          <HugeiconsIcon icon={BubbleChatIcon} strokeWidth={2} className="size-4" aria-hidden="true" />
                          Udzielono odpowiedzi
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon"><HugeiconsIcon icon={InboxIcon} strokeWidth={2} aria-hidden="true" /></EmptyMedia>
              <EmptyTitle>Brak zgłoszeń</EmptyTitle>
              <EmptyDescription>
                {inQueue.length
                  ? "Żadne zgłoszenie nie pasuje do filtrów."
                  : isJst && queue === "waiting" ? "Nie ma zgłoszeń czekających na decyzję gminy." : "W tej kolejce nie ma zgłoszeń."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
      {openItem && <ProblemDialog item={openItem} isJst={isJst} onClose={() => setOpenItem(null)} />}
    </div>
  );
}

export default function ReportedProblems() {
  return (
    <RoleGuard roles={[ROLES.JST, ROLES.ROPS]}>
      <ProblemsList />
    </RoleGuard>
  );
}
