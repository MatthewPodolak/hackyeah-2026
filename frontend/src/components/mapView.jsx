"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { KRAKOW, MALOPOLSKA_BOUNDS, lockToMalopolska } from "@/lib/map";

const PIN_STYLE = { radius: 8, weight: 2, color: "#dc2626", fillColor: "#ef4444", fillOpacity: 0.8 };
const PIN_SELECTED_STYLE = { radius: 12, weight: 3, color: "#7f1d1d", fillColor: "#dc2626", fillOpacity: 1 };

const NO_PROBLEMS = [];

export default function MapView({ target, problems = NO_PROBLEMS, selectedProblemId, onProblemClick, onMapClick }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const problemsLayerRef = useRef(null);
  const pinsRef = useRef(new Map());
  const onProblemClickRef = useRef(onProblemClick);
  const onMapClickRef = useRef(onMapClick);
  onProblemClickRef.current = onProblemClick;
  onMapClickRef.current = onMapClick;

  useEffect(() => {
    if (mapRef.current) return;
    const map = L.map(containerRef.current, { maxBoundsViscosity: 1 }).setView(KRAKOW, 15);
    lockToMalopolska(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
      bounds: MALOPOLSKA_BOUNDS,
    }).addTo(map);
    problemsLayerRef.current = L.layerGroup().addTo(map);
    map.on("click", () => onMapClickRef.current?.());
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      problemsLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const layer = problemsLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    pinsRef.current.clear();
    for (const problem of problems) {
      if (problem.latitude == null || problem.longitude == null) continue;
      const pin = L.circleMarker([problem.latitude, problem.longitude], PIN_STYLE)
        .on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          onProblemClickRef.current?.(problem);
        })
        .addTo(layer);
      pinsRef.current.set(problem.id, pin);
    }
  }, [problems]);

  useEffect(() => {
    const map = mapRef.current;
    for (const [id, pin] of pinsRef.current) {
      const selected = id === selectedProblemId;
      pin.setStyle(selected ? PIN_SELECTED_STYLE : PIN_STYLE);
      if (selected) {
        pin.bringToFront();
        map?.panTo(pin.getLatLng());
      }
    }
  }, [problems, selectedProblemId]);

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