import { createTokenStore } from "@/lib/token-store";
import { localize } from "@/lib/i18n";

export const IDEA_STATUS = localize({
  DRAFT: { label: "Szkic", className: "bg-muted text-muted-foreground" },
  SUBMITTED: { label: "Wysłana", className: "bg-sky-500/15 text-sky-800 dark:text-sky-300" },
  IN_REVIEW: { label: "W weryfikacji", className: "bg-amber-500/15 text-amber-800 dark:text-amber-300" },
  FEEDBACK_GIVEN: { label: "Z odpowiedzią", className: "bg-violet-500/15 text-violet-800 dark:text-violet-300" },
  ACCEPTED: { label: "Zaakceptowana", className: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300" },
  NOT_NOW: { label: "Nie teraz", className: "bg-red-500/10 text-red-700 dark:text-red-300" },
});

export const READINESS = localize({
  IDEA: { label: "Tylko pomysł", icon: "💡" },
  PROTOTYPE: { label: "Prototyp", icon: "🛠️" },
  TESTED: { label: "Testowane w małej skali", icon: "🧪" },
  READY: { label: "Działa", icon: "🚀" },
});

export const ideaTokens = createTokenStore("myIdeaTokens");

export function toIdeaCardRequest(idea, changes = {}) {
  return {
    title: idea.title,
    essence: idea.essence,
    problemDescription: idea.problemDescription,
    whoCategories: idea.whoCategories ?? [],
    disabilityTypes: idea.disabilityTypes ?? [],
    readiness: idea.readiness,
    gminaId: idea.gminaId,
    sourceProblemId: idea.sourceProblemId,
    publishConsent: idea.publishConsent,
    ...changes,
  };
}
