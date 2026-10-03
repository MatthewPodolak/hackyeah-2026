"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { KRAKOW, KRAKOW_BOUNDS, lockToKrakow } from "@/lib/map";

export default function LocationPicker({ value, onChange }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (mapRef.current) return;
    const map = L.map(containerRef.current, { maxBoundsViscosity: 1 }).setView(KRAKOW, 13);
    lockToKrakow(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
      bounds: KRAKOW_BOUNDS,
    }).addTo(map);
    map.on("click", (e) => onChangeRef.current?.({ lat: e.latlng.lat, lon: e.latlng.lng }));
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    if (!value) return;
    markerRef.current = L.circleMarker([value.lat, value.lon], {
      radius: 9,
      color: "#2563eb",
      fillColor: "#3b82f6",
      fillOpacity: 0.8,
    }).addTo(map);
    if (!map.getBounds().contains(markerRef.current.getLatLng())) {
      map.setView(markerRef.current.getLatLng(), 16);
    }
  }, [value]);

  return <div ref={containerRef} className="relative z-0 isolate w-full h-full" />;
}
