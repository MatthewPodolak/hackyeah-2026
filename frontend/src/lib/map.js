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
