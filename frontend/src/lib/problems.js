import { createTokenStore } from "@/lib/token-store";

export const PROBLEM_STATUS = {
  SUBMITTED: { label: "Przyjęte", className: "bg-sky-500/15 text-sky-800 dark:text-sky-300" },
  IN_REVIEW: { label: "Analizowane", className: "bg-amber-500/15 text-amber-800 dark:text-amber-300" },
  IN_PROGRESS: { label: "W realizacji", className: "bg-violet-500/15 text-violet-800 dark:text-violet-300" },
  RESOLVED: { label: "Rozwiązane", className: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300" },
  REJECTED: { label: "Odrzucone", className: "bg-red-500/10 text-red-700 dark:text-red-300" },
};

export function problemStatus(status) {
  return PROBLEM_STATUS[status] ?? PROBLEM_STATUS.SUBMITTED;
}

export const problemTokens = createTokenStore("myProblemTokens");
