export const GeoService = {
  // gmina borders, served by Next from public/geo
  async gminy({ ct } = {}) {
    const res = await fetch("/geo/malopolska-gminy.geojson", { signal: ct });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const body = await res.json();
    return body.features;
  },
};
