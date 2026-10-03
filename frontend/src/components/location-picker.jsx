"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { createAccessibleMap } from "@/lib/map";

const LABEL = "Mapa wyboru lokalizacji. Kliknij miejsce, aby je zaznaczyć. Z klawiatury: strzałki przesuwają mapę, Enter zaznacza jej środek.";

export default function LocationPicker({ value, onChange }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (mapRef.current) return;
    const container = containerRef.current;
    const map = createAccessibleMap(L, container, { zoom: 13, label: LABEL });
    map.on("click", (e) => onChangeRef.current?.({ lat: e.latlng.lat, lon: e.latlng.lng }));
    const onKeyDown = (e) => {
      if (e.key !== "Enter" || e.target !== container) return;
      e.preventDefault();
      const center = map.getCenter();
      onChangeRef.current?.({ lat: center.lat, lon: center.lng });
    };
    container.addEventListener("keydown", onKeyDown);
    mapRef.current = map;

    return () => {
      container.removeEventListener("keydown", onKeyDown);
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
      color: "#1d4ed8",
      weight: 3,
      fillColor: "#3b82f6",
      fillOpacity: 0.8,
      interactive: false,
    }).addTo(map);
    if (!map.getBounds().contains(markerRef.current.getLatLng())) {
      map.setView(markerRef.current.getLatLng(), 16);
    }
  }, [value]);

  return <div ref={containerRef} className="relative z-0 isolate w-full h-full" />;
}
