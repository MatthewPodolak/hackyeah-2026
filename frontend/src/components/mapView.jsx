"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const KRAKOW = [50.0614, 19.9366];

export default function MapView({ target }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (mapRef.current) return;
    const map = L.map(containerRef.current).setView(KRAKOW, 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !target) return;
    if (markerRef.current) markerRef.current.remove();
    markerRef.current = L.circleMarker([target.lat, target.lon], {
      radius: 9,
      color: "#2563eb",
      fillColor: "#3b82f6",
      fillOpacity: 0.8,
    })
      .addTo(map)
      .bindPopup(target.name)
      .openPopup();
    map.flyTo([target.lat, target.lon], 16);
  }, [target]);

  return <div ref={containerRef} className="relative z-0 isolate w-full h-full" />;
}