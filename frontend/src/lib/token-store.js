const NO_TOKENS = [];

function createScopedStore(storageKey) {
  const listeners = new Set();
  let cachedRaw = null;
  let cachedTokens = NO_TOKENS;

  function readRaw() {
    try {
      return localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  }

  function load() {
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

  function save(tokens) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(tokens));
    } catch {}
    listeners.forEach((listener) => listener());
  }

  return {
    load,
    serverSnapshot: () => NO_TOKENS,
    subscribe(listener) {
      listeners.add(listener);
      const onStorage = (e) => { if (e.key === storageKey) listener(); };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", onStorage);
      };
    },
    remember(token) {
      save([token, ...load().filter((t) => t !== token)]);
    },
    forget(token) {
      save(load().filter((t) => t !== token));
    },
  };
}

export function createTokenStore(baseKey) {
  const scopes = new Map();
  return {
    forUser(userId) {
      const key = userId == null ? baseKey : `${baseKey}:user:${userId}`;
      if (!scopes.has(key)) scopes.set(key, createScopedStore(key));
      return scopes.get(key);
    },
  };
}
