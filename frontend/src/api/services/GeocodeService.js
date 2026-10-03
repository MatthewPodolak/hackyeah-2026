import { MALOPOLSKA_BOUNDS } from "@/lib/map";

const NOMINATIM_REVERSE = "https://nominatim.openstreetmap.org/reverse";
const NOMINATIM_SEARCH = "https://nominatim.openstreetmap.org/search";

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
