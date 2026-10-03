import innovations from "@/data/innovations.json";
import formCategories from "@/data/form-categories.json";

// Static dataset (ROPS Biblioteka Innowacji Społecznych) until the backend serves innovations.
// Kept async so callers don't change when this becomes an API call.
export async function getInnovations() {
  return innovations;
}

export async function getInnovation(id) {
  return innovations.find((innovation) => innovation.id === id) ?? null;
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
