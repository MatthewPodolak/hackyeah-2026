const KEY = "a11yPrefs";
const DEFAULTS = { contrast: false, textScale: 1 };
export const TEXT_SCALES = [1, 1.25, 1.5];

const listeners = new Set();
let cachedRaw;
let cached = DEFAULTS;

function read() {
  let raw = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {}
  if (raw === cachedRaw) return cached;
  cachedRaw = raw;
  try {
    const parsed = JSON.parse(raw ?? "null");
    cached = {
      contrast: parsed?.contrast === true,
      textScale: TEXT_SCALES.includes(parsed?.textScale) ? parsed.textScale : 1,
    };
  } catch {
    cached = DEFAULTS;
  }
  return cached;
}

export function applyPrefs(prefs) {
  const root = document.documentElement;
  root.classList.toggle("hc", prefs.contrast);
  root.style.fontSize = prefs.textScale === 1 ? "" : `${prefs.textScale * 100}%`;
}

export function getPrefs() {
  return read();
}

export function getServerPrefs() {
  return DEFAULTS;
}

export function subscribePrefs(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setPrefs(changes) {
  const next = { ...read(), ...changes };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  applyPrefs(next);
  listeners.forEach((listener) => listener());
}

export const PREFS_BOOT_SCRIPT = `try{var p=JSON.parse(localStorage.getItem("${KEY}")||"null");if(p){if(p.contrast===true)document.documentElement.classList.add("hc");if([1.25,1.5].indexOf(p.textScale)>-1)document.documentElement.style.fontSize=(p.textScale*100)+"%";}}catch(e){}`;
