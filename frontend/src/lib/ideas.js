import { createTokenStore } from "@/lib/token-store";

export const IDEA_STATUS = {
  DRAFT: { label: "Szkic", className: "bg-muted text-muted-foreground" },
  SUBMITTED: { label: "Wysłana", className: "bg-sky-500/15 text-sky-800 dark:text-sky-300" },
  IN_REVIEW: { label: "W weryfikacji", className: "bg-amber-500/15 text-amber-800 dark:text-amber-300" },
  FEEDBACK_GIVEN: { label: "Z odpowiedzią", className: "bg-violet-500/15 text-violet-800 dark:text-violet-300" },
  ACCEPTED: { label: "Zaakceptowana", className: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300" },
  NOT_NOW: { label: "Nie teraz", className: "bg-red-500/10 text-red-700 dark:text-red-300" },
};

export const READINESS = {
  IDEA: { label: "Tylko pomysł", icon: "💡" },
  PROTOTYPE: { label: "Prototyp", icon: "🛠️" },
  TESTED: { label: "Testowane w małej skali", icon: "🧪" },
  READY: { label: "Działa", icon: "🚀" },
};

const ideaTokens = createTokenStore("myIdeaTokens");

export const loadIdeaTokens = ideaTokens.load;
export const getServerIdeaTokens = ideaTokens.serverSnapshot;
export const subscribeIdeaTokens = ideaTokens.subscribe;
export const rememberIdeaToken = ideaTokens.remember;
export const forgetIdeaToken = ideaTokens.forget;

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
