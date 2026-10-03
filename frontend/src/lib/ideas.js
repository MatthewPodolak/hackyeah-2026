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

const MY_IDEAS_KEY = "myIdeaTokens";
const NO_TOKENS = [];
const listeners = new Set();
let cachedRaw = null;
let cachedTokens = NO_TOKENS;

function readRaw() {
  try {
    return localStorage.getItem(MY_IDEAS_KEY);
  } catch {
    return null;
  }
}

export function loadIdeaTokens() {
  const raw = readRaw();
  if (raw === cachedRaw) return cachedTokens;
  cachedRaw = raw;
  try {
    const parsed = JSON.parse(raw ?? "[]");
    cachedTokens = Array.isArray(parsed) ? parsed.filter((t) => typeof t === "string") : NO_TOKENS;
  } catch {
    cachedTokens = NO_TOKENS;
  }
  return cachedTokens;
}

export function getServerIdeaTokens() {
  return NO_TOKENS;
}

export function subscribeIdeaTokens(listener) {
  listeners.add(listener);
  const onStorage = (e) => { if (e.key === MY_IDEAS_KEY) listener(); };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function saveIdeaTokens(tokens) {
  try {
    localStorage.setItem(MY_IDEAS_KEY, JSON.stringify(tokens));
  } catch {}
  listeners.forEach((listener) => listener());
}

export function rememberIdeaToken(token) {
  saveIdeaTokens([token, ...loadIdeaTokens().filter((t) => t !== token)]);
}

export function forgetIdeaToken(token) {
  saveIdeaTokens(loadIdeaTokens().filter((t) => t !== token));
}

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
