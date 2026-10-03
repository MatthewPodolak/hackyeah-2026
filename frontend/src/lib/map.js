export const KRAKOW = [50.0614, 19.9366];

export const KRAKOW_BOUNDS = [
  [49.93, 19.72],
  [50.18, 20.25],
];

export function lockToKrakow(map) {
  map.setMaxBounds(KRAKOW_BOUNDS);
  const fitMinZoom = () => {
    const size = map.getSize();
    if (!size.x || !size.y) return;
    map.setMinZoom(map.getBoundsZoom(KRAKOW_BOUNDS, true));
  };
  fitMinZoom();
  map.on("resize", fitMinZoom);
}

export function createAccessibleMap(L, container, { zoom, label }) {
  const map = L.map(container, { maxBoundsViscosity: 1, zoomControl: false }).setView(KRAKOW, zoom);
  L.control.zoom({ zoomInTitle: "Przybliż mapę", zoomOutTitle: "Oddal mapę" }).addTo(map);
  lockToKrakow(map);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
    bounds: KRAKOW_BOUNDS,
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
