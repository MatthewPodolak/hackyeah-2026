import { createTokenStore } from "@/lib/token-store";
import { localize } from "@/lib/i18n";

export const PROBLEM_STATUS = localize({
  SUBMITTED: { label: "Zgłoszone", className: "bg-sky-500/15 text-sky-800 dark:text-sky-300" },
  FORWARDED: { label: "Przekazane do ROPS", className: "bg-teal-500/15 text-teal-800 dark:text-teal-300" },
  GMINA_REJECTED: { label: "Odrzucone przez gminę", className: "bg-red-500/10 text-red-700 dark:text-red-300" },
  IN_REVIEW: { label: "Analizowane", className: "bg-amber-500/15 text-amber-800 dark:text-amber-300" },
  IN_PROGRESS: { label: "W realizacji", className: "bg-violet-500/15 text-violet-800 dark:text-violet-300" },
  RESOLVED: { label: "Rozwiązane", className: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300" },
  REJECTED: { label: "Odrzucone", className: "bg-red-500/10 text-red-700 dark:text-red-300" },
});

export const PIN_TONES = localize([
  { key: "open", label: "Nowe", statuses: ["SUBMITTED"] },
  { key: "review", label: "W ocenie gminy lub ROPS", statuses: ["FORWARDED", "IN_REVIEW"] },
  { key: "progress", label: "W realizacji", statuses: ["IN_PROGRESS"] },
  { key: "resolved", label: "Rozwiązane", statuses: ["RESOLVED"] },
  { key: "closed", label: "Odrzucone", statuses: ["REJECTED", "GMINA_REJECTED"] },
]);

const TONE_BY_STATUS = Object.fromEntries(PIN_TONES.flatMap((tone) => tone.statuses.map((status) => [status, tone.key])));

export function pinTone(status) {
  return TONE_BY_STATUS[status] ?? "open";
}

export function problemStatus(status) {
  return PROBLEM_STATUS[status] ?? PROBLEM_STATUS.SUBMITTED;
}

// statuses ROPS sets; SUBMITTED and GMINA_REJECTED belong to the gmina
export const ROPS_STATUSES = ["FORWARDED", "IN_REVIEW", "IN_PROGRESS", "RESOLVED", "REJECTED"];

// set by the JST on accept, ROPS can change it; listed from the most urgent
export const PROBLEM_PRIORITY = localize({
  URGENT: { label: "Pilny", className: "bg-red-600 text-white" },
  HIGH: { label: "Wysoki", className: "bg-orange-500/20 text-orange-800 dark:text-orange-300" },
  MEDIUM: { label: "Średni", className: "bg-amber-500/15 text-amber-800 dark:text-amber-300" },
  LOW: { label: "Niski", className: "bg-muted text-muted-foreground" },
});

export const PRIORITIES = Object.keys(PROBLEM_PRIORITY);

export function problemPriority(priority) {
  return PROBLEM_PRIORITY[priority] ?? null;
}

// a report with a gmina waits for the JST decision before it reaches ROPS
export function waitsForGmina(problem) {
  return !!problem.gminaId && (problem.status ?? "SUBMITTED") === "SUBMITTED";
}

export const problemTokens = createTokenStore("myProblemTokens");
