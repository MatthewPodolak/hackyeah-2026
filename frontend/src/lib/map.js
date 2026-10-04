import { t } from "@/lib/i18n";

export const KRAKOW = [50.0614, 19.9366];

// Małopolska with a small margin (borders: public/geo/malopolska-gminy.geojson)
export const MALOPOLSKA_BOUNDS = [
  [49.13, 19.03],
  [50.57, 21.47],
];

export function lockToMalopolska(map) {
  map.setMaxBounds(MALOPOLSKA_BOUNDS);
  const fitMinZoom = () => {
    const size = map.getSize();
    if (!size.x || !size.y) return;
    map.setMinZoom(map.getBoundsZoom(MALOPOLSKA_BOUNDS, true));
  };
  fitMinZoom();
  map.on("resize", fitMinZoom);
}

export function createAccessibleMap(L, container, { zoom, label }) {
  const map = L.map(container, { maxBoundsViscosity: 1, zoomControl: false }).setView(KRAKOW, zoom);
  L.control.zoom({ position: "bottomleft", zoomInTitle: t("Przybliż mapę"), zoomOutTitle: t("Oddal mapę") }).addTo(map);
  lockToMalopolska(map);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
    bounds: MALOPOLSKA_BOUNDS,
  }).addTo(map);
  container.setAttribute("role", "region");
  container.setAttribute("aria-label", label);
  return map;
}

export function onActivateKey(element, handler) {
  element.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    e.stopPropagation();
    handler();
  });
}
