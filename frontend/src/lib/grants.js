import { intlLocale, localize, localizeValues } from "@/lib/i18n";
// applicant types used in the ROPS grant calls (data/grant-calls.json)
export const APPLICANT_TYPES_PL = {
  NGO: "Organizacje pozarządowe (NGO)",
  JST: "Samorządy (JST)",
  JST_UNIT: "Jednostki JST (OPS, PCPR, CUS)",
  SOCIAL_ECONOMY: "Ekonomia społeczna",
  PERSON: "Osoby fizyczne",
  INFORMAL_GROUP: "Grupy nieformalne",
  PUBLIC: "Podmioty publiczne",
  COMPANY: "Firmy",
};

export const APPLICANT_TYPES = localizeValues(APPLICANT_TYPES_PL);

// who fills a section of the real application form
export const FILL_BY = localize({
  AI_DRAFT: { label: "AI szkic", className: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300" },
  USER: { label: "Uzupełniasz Ty", className: "bg-muted text-muted-foreground" },
  USER_CONFIRM: { label: "Do zatwierdzenia", className: "bg-amber-500/15 text-amber-800 dark:text-amber-300" },
});

export const CALL_PHASES = localize({
  open: { label: "Otwarty", className: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300" },
  upcoming: { label: "Zaplanowany", className: "bg-sky-500/15 text-sky-800 dark:text-sky-300" },
  closed: { label: "Zakończony", className: "bg-muted text-muted-foreground" },
});

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function callPhase(call) {
  const now = today();
  if (call.openFrom > now) return "upcoming";
  if (call.openTo < now) return "closed";
  return "open";
}

export function daysLeft(call) {
  const end = new Date(`${call.openTo}T23:59:59`);
  return Math.max(0, Math.ceil((end - new Date()) / 86_400_000));
}

function parse(json, fallback) {
  try {
    return json ? JSON.parse(json) : fallback;
  } catch {
    return fallback;
  }
}

// [{ title, fillBy }] for seeded calls, plain titles for calls typed in by ROPS
export function callSections(call) {
  const sections = parse(call.sectionsJson, null);
  if (sections) return sections;
  return (call.requiredSections ?? "").split("\n").map((title) => title.trim()).filter(Boolean).map((title) => ({ title }));
}

export function callCriteria(call) {
  return parse(call.criteriaJson, null);
}

export const plnFormat = { format: (value) => new Intl.NumberFormat(intlLocale(), { style: "currency", currency: "PLN", maximumFractionDigits: 0 }).format(value) };
