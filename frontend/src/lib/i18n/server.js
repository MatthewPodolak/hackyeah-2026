import { cookies } from "next/headers";
import { LOCALE_COOKIE, normalizeLocale, translate, translatePlural } from "./index";

export async function getServerLocale() {
  const store = await cookies();
  return normalizeLocale(store.get(LOCALE_COOKIE)?.value);
}

export async function getServerT() {
  const locale = await getServerLocale();
  return {
    locale,
    t: (text, vars) => translate(locale, text, vars),
    tp: (n, one, few, many, vars) => translatePlural(locale, n, one, few, many, vars),
  };
}
