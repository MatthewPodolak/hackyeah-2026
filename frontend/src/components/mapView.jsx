"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { createAccessibleMap, onActivateKey } from "@/lib/map";

const NO_PROBLEMS = [];

function pinIcon(problem, selected) {
  const pin = document.createElement("span");
  pin.className = selected ? "problem-pin problem-pin--selected" : "problem-pin";
  const label = document.createElement("span");
  label.className = "sr-only";
  label.textContent = `Problem: ${problem.title}${problem.street ? `, ${problem.street}` : ""}`;
  pin.appendChild(label);
  const size = selected ? 26 : 18;
  return L.divIcon({ html: pin, className: "problem-pin-wrapper", iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
}

export default function MapView({ target, problems = NO_PROBLEMS, selectedProblemId, onProblemClick, onMapClick, label = "Mapa zgłoszonych problemów" }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const problemsLayerRef = useRef(null);
  const pinsRef = useRef(new Map());
  const onProblemClickRef = useRef(onProblemClick);
  const onMapClickRef = useRef(onMapClick);

  useEffect(() => {
    onProblemClickRef.current = onProblemClick;
    onMapClickRef.current = onMapClick;
  });

  useEffect(() => {
    if (mapRef.current) return;
    const map = createAccessibleMap(L, containerRef.current, { zoom: 15, label });
    problemsLayerRef.current = L.layerGroup().addTo(map);
    map.on("click", () => onMapClickRef.current?.());
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      problemsLayerRef.current = null;
    };
  }, [label]);

  useEffect(() => {
    const layer = problemsLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    pinsRef.current.clear();
    for (const problem of problems) {
      if (problem.latitude == null || problem.longitude == null) continue;
      const pin = L.marker([problem.latitude, problem.longitude], {
        icon: pinIcon(problem, false),
        keyboard: true,
        title: problem.title,
        riseOnHover: true,
      })
        .on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          onProblemClickRef.current?.(problem);
        })
        .on("add", (e) => {
          const element = e.target.getElement();
          if (element) onActivateKey(element, () => onProblemClickRef.current?.(problem));
        })
        .addTo(layer);
      pin.problem = problem;
      pinsRef.current.set(problem.id, pin);
    }
  }, [problems]);

  useEffect(() => {
    const map = mapRef.current;
    for (const [id, pin] of pinsRef.current) {
      const selected = id === selectedProblemId;
      const element = pin.getElement();
      const hadFocus = element && element === document.activeElement;
      pin.setIcon(pinIcon(pin.problem, selected));
      pin.setZIndexOffset(selected ? 1000 : 0);
      const next = pin.getElement();
      if (next) {
        next.setAttribute("aria-pressed", selected ? "true" : "false");
        if (hadFocus) next.focus({ preventScroll: true });
      }
      if (selected) map?.panTo(pin.getLatLng());
    }
  }, [problems, selectedProblemId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !target) return;
    if (markerRef.current) markerRef.current.remove();
    markerRef.current = L.circleMarker([target.lat, target.lon], {
      radius: 9,
      color: "#1d4ed8",
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
