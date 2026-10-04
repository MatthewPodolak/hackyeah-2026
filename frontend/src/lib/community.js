import innovations from "@/data/innovations.json";
import { localize } from "@/lib/i18n";

const innovationsById = new Map(innovations.map((innovation) => [innovation.id, innovation]));

export function innovationName(id) {
  return innovationsById.get(id)?.name ?? id;
}

export const PARTICIPATION_STATUS = localize({
  PENDING: { label: "Oczekuje", className: "bg-amber-500/15 text-amber-800 dark:text-amber-300" },
  ACCEPTED: { label: "Zaakceptowane", className: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300" },
  REJECTED: { label: "Odrzucone", className: "bg-red-500/10 text-red-700 dark:text-red-300" },
});

export const CONVERSATION_TYPE = localize({
  QUESTION: { label: "Pytanie", hint: "Masz pytanie do ROPS lub eksperta" },
  MENTORING: { label: "Mentoring", hint: "Chcesz wsparcia przy rozwijaniu pomysłu" },
  PARTNERSHIP: { label: "Partnerstwo", hint: "Szukasz współpracy przy wdrożeniu" },
});

export const CONVERSATION_STATUS = localize({
  OPEN: { label: "Otwarta", className: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300" },
  CLOSED: { label: "Zamknięta", className: "bg-muted text-muted-foreground" },
});
