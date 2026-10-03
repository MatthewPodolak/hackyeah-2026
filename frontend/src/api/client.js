
const BASE_URL = process.env.NEXT_PUBLIC_API_ORIGIN ?? "";

const DEFAULT_TIMEOUT = 8000;

function makeAbortSignal({ ct, timeoutMs } = {}) {
  if (!ct && !timeoutMs) return null;
  const controller = new AbortController();
  const timer = timeoutMs && setTimeout(() => controller.abort("Timeout"), timeoutMs);
  ct?.addEventListener("abort", () => controller.abort(), { once: true });
  return { signal: controller.signal, cleanup: () => clearTimeout(timer) };
}

export async function apiFetch(path, init = {}, opts = {}) {
  const abort = makeAbortSignal({ ct: opts.ct, timeoutMs: opts.timeoutMs ?? DEFAULT_TIMEOUT });

  try {
    return await fetch(BASE_URL + path, {
      ...init,
      credentials: "include",
      signal: abort?.signal,
    });
  } finally {
    abort?.cleanup();
  }
}

export async function apiJson(path, init = {}, opts = {}) {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");

  const res = await apiFetch(path, { ...init, headers }, opts);

  if (res.status === 204) return null;

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const error = new Error(body?.message ?? `HTTP ${res.status}`);
    error.status = res.status;
    error.body = body;
    throw error;
  }

  return body;
}