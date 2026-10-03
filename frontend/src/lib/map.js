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
