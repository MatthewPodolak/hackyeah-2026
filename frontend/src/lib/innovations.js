import innovations from "@/data/innovations.json";
import formCategories from "@/data/form-categories.json";

const API_ORIGIN = process.env.API_ORIGIN_INTERNAL ?? "http://localhost:8080";

async function fetchCatalog(path) {
  const res = await fetch(`${API_ORIGIN}/api/v1/knowledge/innovations${path}`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function withDefaults(innovation) {
  return {
    ...innovation,
    links: innovation.links ?? {},
    whoCategories: innovation.whoCategories ?? [],
    problemCategories: innovation.problemCategories ?? [],
    disabilityTypes: innovation.disabilityTypes ?? [],
  };
}

export async function getInnovations() {
  try {
    return (await fetchCatalog("")).map(withDefaults);
  } catch {
    return innovations;
  }
}

export async function getInnovation(id) {
  try {
    const innovation = await fetchCatalog(`/${encodeURIComponent(id)}`);
    return innovation ? withDefaults(innovation) : null;
  } catch {
    return innovations.find((innovation) => innovation.id === id) ?? null;
  }
}

export function getWhoCategory(key) {
  return formCategories.whoCategories[key];
}

export function getProblemCategory(key) {
  return formCategories.problemCategories[key];
}

export function getDisabilityType(key) {
  return formCategories.disabilityTypes[key];
}

// youtube-nocookie: no tracking cookies until the viewer presses play
export function getYoutubeEmbedUrl(innovation) {
  const match = innovation.links.video?.match(/(?:v=|youtu\.be\/)([\w-]{11})/);
  return match ? `https://www.youtube-nocookie.com/embed/${match[1]}` : null;
}
