import formCategories from "@/data/form-categories.json";
import { localize } from "@/lib/i18n";

export const OTHER = "OTHER";

export const PROBLEM_CATEGORY_OPTIONS = localize([
  ...Object.entries(formCategories.problemCategories).map(([value, { label, icon }]) => ({ value, label, icon })),
  { value: OTHER, label: "Inne", icon: "📌" },
]);

export const TARGET_GROUP_OPTIONS = localize([
  ...Object.entries(formCategories.whoCategories).map(([value, { label, icon }]) => ({ value, label, icon })),
  { value: OTHER, label: "Inna grupa", icon: "👥" },
]);

const byValue = (options) => Object.fromEntries(options.map((option) => [option.value, option]));
const CATEGORY_BY_VALUE = byValue(PROBLEM_CATEGORY_OPTIONS);
const TARGET_GROUP_BY_VALUE = byValue(TARGET_GROUP_OPTIONS);

export function getProblemCategoryOption(value) {
  return CATEGORY_BY_VALUE[value] ?? CATEGORY_BY_VALUE[OTHER];
}

export function getTargetGroupOption(value) {
  return TARGET_GROUP_BY_VALUE[value] ?? TARGET_GROUP_BY_VALUE[OTHER];
}
