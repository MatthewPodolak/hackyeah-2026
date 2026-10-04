import { PROBLEM_CATEGORY_OPTIONS, OTHER } from "@/lib/problemCategories";

export const SURVEY_PRIORITIES = PROBLEM_CATEGORY_OPTIONS.filter((option) => option.value !== OTHER);

export const SURVEY_ACCESS = [
  { value: 1, icon: "😟", label: "Bardzo trudno" },
  { value: 2, icon: "🙁", label: "Trudno" },
  { value: 3, icon: "😐", label: "Różnie" },
  { value: 4, icon: "🙂", label: "Łatwo" },
  { value: 5, icon: "😀", label: "Bardzo łatwo" },
];

export const SURVEY_LONELINESS = [
  { value: "NEVER", label: "Nigdy" },
  { value: "SOMETIMES", label: "Czasami" },
  { value: "OFTEN", label: "Często" },
  { value: "NO_ANSWER", label: "Wolę nie mówić" },
];

export const SURVEY_AGE = [
  { value: "UNDER_30", label: "Poniżej 30" },
  { value: "AGE_30_44", label: "30–44" },
  { value: "AGE_45_64", label: "45–64" },
  { value: "AGE_65_PLUS", label: "65 i więcej" },
  { value: "NO_ANSWER", label: "Wolę nie mówić" },
];

const STORAGE_KEY = "needsSurvey";

export function readSurveyState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
  } catch {
    return null;
  }
}

export function writeSurveyState(status) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ status, at: Date.now() }));
  } catch {}
}
