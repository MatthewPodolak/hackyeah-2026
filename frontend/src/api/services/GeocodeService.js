import { KRAKOW, MALOPOLSKA_BOUNDS } from "@/lib/map";

const NOMINATIM_REVERSE = "https://nominatim.openstreetmap.org/reverse";
const NOMINATIM_SEARCH = "https://nominatim.openstreetmap.org/search";
const PHOTON_SEARCH = "https://photon.komoot.io/api/";

const PLACE_KIND = {
  street: "Ulica",
  house: "Adres",
  district: "Dzielnica",
  locality: "Miejscowość",
  city: "Miejscowość",
  county: "Powiat",
};

function toPlace(feature) {
  const p = feature.properties ?? {};
  const [lon, lat] = feature.geometry?.coordinates ?? [];
  if (lat == null || lon == null) return null;
  const isAddress = p.type === "house" && p.street;
  const name = isAddress && !p.name ? [p.street, p.housenumber].filter(Boolean).join(" ") : p.name;
  if (!name) return null;
  const place = [isAddress && p.name ? [p.street, p.housenumber].filter(Boolean).join(" ") : null, p.district ?? p.locality, p.city ?? p.county]
    .filter((part, i, all) => part && part !== name && all.indexOf(part) === i)
    .join(", ");
  const extent = Array.isArray(p.extent) && p.extent.length === 4 ? [[p.extent[3], p.extent[0]], [p.extent[1], p.extent[2]]] : null;
  return {
    id: `${p.osm_type}${p.osm_id}`,
    name,
    place,
    kind: PLACE_KIND[p.type] ?? "Miejsce",
    lat,
    lon,
    bounds: extent,
  };
}

function formatStreet(address) {
  if (!address) return null;
  const road = address.road ?? address.pedestrian ?? address.footway ?? address.path ?? address.square;
  if (!road) {
    const place = [address.suburb ?? address.quarter, address.city ?? address.town ?? address.village].filter(Boolean);
    return place.length ? place.join(", ") : null;
  }
  return [road, address.house_number].filter(Boolean).join(" ");
}

export const GeocodeService = {
  async suggest(query, { bias, ct } = {}) {
    const [lat, lon] = bias ?? KRAKOW;
    const params = new URLSearchParams({
      q: query,
      limit: "10",
      bbox: [MALOPOLSKA_BOUNDS[0][1], MALOPOLSKA_BOUNDS[0][0], MALOPOLSKA_BOUNDS[1][1], MALOPOLSKA_BOUNDS[1][0]].join(","),
      lat: String(lat),
      lon: String(lon),
      zoom: "14",
      location_bias_scale: "0.2",
    });

    const res = await fetch(`${PHOTON_SEARCH}?${params}`, { signal: ct });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const body = await res.json();
    const seen = new Set();
    const places = [];
    for (const feature of body.features ?? []) {
      const place = toPlace(feature);
      if (!place) continue;
      const key = `${place.name}|${place.place}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      places.push(place);
      if (places.length === 5) break;
    }
    return places;
  },

  async reverse({ lat, lon }, { ct } = {}) {
    const params = new URLSearchParams({
      format: "jsonv2",
      lat: String(lat),
      lon: String(lon),
      zoom: "18",
      addressdetails: "1",
      "accept-language": "pl",
    });

    const res = await fetch(`${NOMINATIM_REVERSE}?${params}`, { signal: ct });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const body = await res.json();
    return formatStreet(body.address) ?? body.display_name ?? null;
  },
  async search(query, { ct } = {}) {
    const params = new URLSearchParams({
      format: "jsonv2",
      q: query,
      countrycodes: "pl",
      viewbox: [MALOPOLSKA_BOUNDS[0][1], MALOPOLSKA_BOUNDS[1][0], MALOPOLSKA_BOUNDS[1][1], MALOPOLSKA_BOUNDS[0][0]].join(","),
      bounded: "1",
      limit: "1",
      "accept-language": "pl",
    });

    const res = await fetch(`${NOMINATIM_SEARCH}?${params}`, { signal: ct });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const [first] = await res.json();
    return first ? { lat: Number(first.lat), lon: Number(first.lon) } : null;
  },
};
