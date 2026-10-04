import en from "./en";
import uk from "./uk";

export const LOCALES = [
  { code: "pl", label: "Polski", short: "PL" },
  { code: "en", label: "English", short: "EN" },
  { code: "uk", label: "Українська", short: "UK" },
];

export const DEFAULT_LOCALE = "pl";
export const LOCALE_COOKIE = "lang";

const DICTIONARIES = { pl: {}, en, uk };
const INTL_LOCALE = { pl: "pl-PL", en: "en-GB", uk: "uk-UA" };

let current = DEFAULT_LOCALE;

export function normalizeLocale(value) {
  return LOCALES.some((l) => l.code === value) ? value : DEFAULT_LOCALE;
}

export function setCurrentLocale(locale) {
  current = normalizeLocale(locale);
}

export function getCurrentLocale() {
  return current;
}

export function intlLocale(locale = current) {
  return INTL_LOCALE[locale] ?? INTL_LOCALE.pl;
}

function fill(text, vars) {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, key) => (vars[key] ?? match));
}

export function translate(locale, text, vars) {
  if (text == null) return text;
  const hit = DICTIONARIES[locale]?.[text];
  return fill(hit ?? text, vars);
}

export function t(text, vars) {
  return translate(current, text, vars);
}

const pluralRules = {};

export function translatePlural(locale, n, one, few, many, vars) {
  const forms = (DICTIONARIES[locale]?.[`${one}|${few}|${many}`] ?? `${one}|${few}|${many}`).split("|");
  const rules = (pluralRules[locale] ??= new Intl.PluralRules(intlLocale(locale)));
  const category = rules.select(n);
  let form;
  if (forms.length === 2) form = category === "one" ? forms[0] : forms[1];
  else form = category === "one" ? forms[0] : category === "few" ? forms[1] : forms[2] ?? forms[1];
  return fill(form, { n: formatNumber(n, locale), ...vars });
}

export function tp(n, one, few, many, vars) {
  return translatePlural(current, n, one, few, many, vars);
}

export function formatNumber(n, locale = current) {
  return new Intl.NumberFormat(intlLocale(locale)).format(n);
}

export function dateFormat(options, locale = current) {
  return new Intl.DateTimeFormat(intlLocale(locale), options);
}

const LOCALIZED_KEYS = new Set(["label", "hint", "short", "example", "title", "text", "badgeLabel", "question", "description", "withText"]);
const LOCALIZED_LISTS = new Set(["hints"]);
const proxies = new WeakMap();

export function localize(value) {
  if (value === null || typeof value !== "object") return value;
  if (proxies.has(value)) return proxies.get(value);
  const proxy = new Proxy(value, {
    get(target, prop, receiver) {
      const v = Reflect.get(target, prop, receiver);
      if (typeof v === "string" && LOCALIZED_KEYS.has(prop)) return t(v);
      if (Array.isArray(v) && LOCALIZED_LISTS.has(prop)) return v.map((item) => (typeof item === "string" ? t(item) : localize(item)));
      if (v !== null && typeof v === "object") return localize(v);
      return v;
    },
  });
  proxies.set(value, proxy);
  return proxy;
}

export function localizeValues(map) {
  return new Proxy(map, {
    get(target, prop, receiver) {
      const v = Reflect.get(target, prop, receiver);
      return typeof v === "string" ? t(v) : v;
    },
  });
}

export function localDateFormat(options) {
  return { format: (value) => new Intl.DateTimeFormat(intlLocale(), options).format(value) };
}

export function localNumberFormat(options) {
  return { format: (value) => new Intl.NumberFormat(intlLocale(), options).format(value) };
}
