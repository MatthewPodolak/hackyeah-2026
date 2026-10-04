import { t } from "@/lib/i18n";

// Gminy of Małopolska: borders from public/geo/malopolska-gminy.geojson (PRG, GUGiK),
// names from GET /api/v1/config/regions. Ids are the same in both.

function polygonsOf(feature) {
  const { type, coordinates } = feature.geometry;
  return type === "MultiPolygon" ? coordinates : [coordinates];
}

function inRing([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// even-odd over the outer ring and its holes (a rural gmina around a town has the town as a hole)
function inPolygon(point, polygon) {
  return polygon.reduce((inside, ring) => (inRing(point, ring) ? !inside : inside), false);
}

export function findGmina(features, { lat, lon }) {
  return features?.find((feature) => polygonsOf(feature).some((polygon) => inPolygon([lon, lat], polygon))) ?? null;
}

function ringArea(ring) {
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    area += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  }
  return Math.abs(area / 2);
}

// A point that is always inside the gmina (a centroid can land in a hole): the middle of the widest
// inside stretch of a horizontal line through the gmina's biggest polygon.
export function gminaCenter(feature) {
  const polygon = polygonsOf(feature).reduce((a, b) => (ringArea(b[0]) > ringArea(a[0]) ? b : a));
  const ys = polygon[0].map(([, y]) => y);
  const y = (Math.min(...ys) + Math.max(...ys)) / 2;

  const xs = [];
  for (const ring of polygon) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > y !== yj > y) xs.push(xi + ((y - yi) * (xj - xi)) / (yj - yi));
    }
  }
  xs.sort((a, b) => a - b);

  let best = { width: -1, x: xs[0] };
  for (let k = 0; k + 1 < xs.length; k += 2) {
    const width = xs[k + 1] - xs[k];
    if (width > best.width) best = { width, x: (xs[k] + xs[k + 1]) / 2 };
  }
  return { lat: y, lon: best.x };
}

export function indexGminy(regions) {
  const index = new Map();
  for (const powiat of regions?.powiaty ?? []) {
    for (const gmina of powiat.gminy) index.set(gmina.id, { ...gmina, powiat });
  }
  return index;
}

// one line for where a report is: "Cała gmina: …", or the street (or coordinates) with its gmina
export function problemPlace(problem, gminy) {
  const gmina = gminaName(gminy.get(problem.gminaId));
  if (problem.wholeGmina) return t("Cała gmina: {gmina}", { gmina: gmina ?? "…" });
  const spot = problem.street ?? (problem.latitude != null ? `${problem.latitude.toFixed(5)}, ${problem.longitude.toFixed(5)}` : null);
  return [spot, gmina].filter(Boolean).join(" · ");
}

// "Bochnia – gmina wiejska, powiat bocheński"; cities and duplicate names already say enough
export function gminaName(gmina) {
  if (!gmina) return null;
  return gmina.powiat.isCity || gmina.label.includes("(pow.") ? gmina.label : `${gmina.label}, ${gmina.powiat.label}`;
}
