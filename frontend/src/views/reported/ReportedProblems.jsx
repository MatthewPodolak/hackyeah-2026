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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import LoadingStatus from "@/components/loading-status";
import Modal from "@/components/modal";
import StatusPill from "@/components/status-pill";
import RoleGuard from "@/views/reported/RoleGuard";
import { ROLES, useAuth } from "@/api/context/AuthContext";
import { useAdminProblem, useAdminProblems, useReviewProblem } from "@/api/hooks/useAdmin";
import { useProblem, useReportedProblems } from "@/api/hooks/useProblemsQuery";
import { useGminyIndex } from "@/api/hooks/useRegionsQuery";
import { useToast } from "@/helpers/ToastProvider";
import { getProblemCategoryOption, getTargetGroupOption } from "@/lib/problemCategories";
import { PROBLEM_STATUS, problemStatus } from "@/lib/problems";
import { gminaName, problemPlace } from "@/lib/gminy";

const dateFormat = new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "short" });
const STATUSES = Object.keys(PROBLEM_STATUS);

function normalize(text) {
  return (text ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l");
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

function ReviewForm({ item, onDone }) {
  const [status, setStatus] = useState(item.problem.status ?? "SUBMITTED");
  const [reply, setReply] = useState(item.adminReply ?? "");
  const review = useReviewProblem();
  const { showToast } = useToast();

  const save = async (e) => {
    e.preventDefault();
    try {
      await review.mutateAsync({ id: item.problem.id, model: { status, reply } });
      showToast("Zapisano odpowiedź do zgłoszenia", "success");
      onDone();
    } catch (err) {
      showToast(err?.body?.message ?? null, "error");
    }
  };

  return (
    <form onSubmit={save} className="rounded-xl bg-muted/50 p-4">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="problem-status">Status</FieldLabel>
          <NativeSelect id="problem-status" className="w-full" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((key) => (
              <NativeSelectOption key={key} value={key}>{PROBLEM_STATUS[key].label}</NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
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

// readOnly (JST): public details only, replying and statuses stay with ROPS
function ProblemDialog({ id, readOnly, onClose }) {
  const details = useAdminProblem(readOnly ? null : id);
  const full = useProblem(id);
  const gminy = useGminyIndex();
  const item = readOnly ? (full.data ? { problem: full.data } : null) : details.data;
  const problem = item?.problem;

  return (
    <Modal open onClose={onClose} labelledBy="problem-dialog-heading" className="max-w-2xl">
      <Card className="pt-0">
        <div aria-hidden="true" className="h-1.5 bg-red-500" />
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-red-700 dark:text-red-400">Zgłoszony problem</p>
              <h2 id="problem-dialog-heading" className="font-heading text-xl font-bold tracking-tight leading-snug break-words">
                {problem ? problem.title : "Wczytywanie zgłoszenia…"}
              </h2>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Zamknij szczegóły zgłoszenia">
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} aria-hidden="true" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!problem ? (
            <LoadingStatus label="Wczytywanie zgłoszenia"><Skeleton className="h-48 w-full rounded-xl" /></LoadingStatus>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <StatusPill meta={problemStatus(problem.status)} />
                {problem.localDate && <span>Zgłoszono <time dateTime={problem.localDate}>{dateFormat.format(new Date(problem.localDate))}</time></span>}
                {!readOnly && <span>{item.authorName ? `przez ${item.authorName}` : "anonimowo"}</span>}
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
              {!readOnly && <ReviewForm key={`${problem.id}-${problem.status}`} item={item} onDone={onClose} />}
            </>
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
  const jstItems = useMemo(
    () => mine.data
      ?.map((problem) => ({ problem, adminSeen: true }))
      .sort((a, b) => (b.problem.localDate ?? "").localeCompare(a.problem.localDate ?? "")),
    [mine.data]
  );
  const data = isJst ? jstItems : admin.data;
  const isPending = isJst ? mine.isPending : admin.isPending;
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(null);
  const [openId, setOpenId] = useState(null);

  const all = useMemo(() => data ?? [], [data]);
  const counts = useMemo(() => {
    const result = {};
    for (const item of all) result[item.problem.status] = (result[item.problem.status] ?? 0) + 1;
    return result;
  }, [all]);

  const words = normalize(query).split(/\s+/).filter(Boolean);
  const visible = all
    .filter((item) => !status || item.problem.status === status)
    .filter(({ problem }) => {
      const text = normalize([problem.title, problem.description, problemPlace(problem, gminy), getProblemCategoryOption(problem.category).label, getTargetGroupOption(problem.targetGroup).label].join(" "));
      return words.every((word) => text.includes(word));
    });
  const unseen = all.filter((item) => !item.adminSeen).length;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl px-4 pt-18 pb-10 md:px-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight">Zgłoszone problemy</h1>
            <p className="text-muted-foreground">
              {isJst
                ? `Zgłoszenia mieszkańców z gminy: ${gminaName(gminy.get(user.gminaId)) ?? "…"}`
                : "Problemy zgłoszone przez mieszkańców. Odpowiedź trafia do zgłaszającego."}
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
          <div role="group" aria-label="Status zgłoszenia" className="flex flex-wrap gap-2">
            <FilterChip active={!status} label="Wszystkie" count={all.length} onClick={() => setStatus(null)} />
            {STATUSES.map((key) => (
              <FilterChip key={key} active={status === key} label={PROBLEM_STATUS[key].label} count={counts[key] ?? 0} onClick={() => setStatus(status === key ? null : key)} />
            ))}
          </div>
        </div>
        <p aria-live="polite" aria-atomic="true" className="sr-only">{isPending ? "" : `Wyniki: ${visible.length} z ${all.length}`}</p>

        {isPending ? (
          <LoadingStatus label="Wczytywanie zgłoszonych problemów" className="flex flex-col gap-3">
            {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
          </LoadingStatus>
        ) : visible.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {visible.map((item) => {
              const { problem } = item;
              return (
                <li key={problem.id} className="relative flex gap-4 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md has-[button:focus-visible]:ring-3 has-[button:focus-visible]:ring-ring/50">
                  <div aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-700 dark:text-red-400">
                    <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-5" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h2 className="font-semibold leading-snug break-words">
                        <button type="button" aria-haspopup="dialog" onClick={() => setOpenId(problem.id)} className="text-left after:absolute after:inset-0 after:rounded-xl">
                          {problem.title}
                        </button>
                      </h2>
                      <div className="flex items-center gap-2">
                        {!item.adminSeen && <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">Nowe</span>}
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
              <EmptyTitle>Brak problemów</EmptyTitle>
              <EmptyDescription>
                {all.length
                  ? "Żaden problem nie pasuje do filtrów."
                  : isJst ? "Nikt jeszcze nie zgłosił problemu w Twojej gminie." : "Nikt jeszcze nie zgłosił problemu."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
      {openId != null && <ProblemDialog id={openId} readOnly={isJst} onClose={() => setOpenId(null)} />}
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
