"use client";

import { useEffect, useRef } from "react";
import L from "@/lib/leaflet-global";
import "leaflet.markercluster";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { createAccessibleMap, onActivateKey } from "@/lib/map";
import { pinTone, problemStatus } from "@/lib/problems";

const NO_PROBLEMS = [];
const AREA_STYLE = { color: "#1d4ed8", weight: 3, dashArray: "8 6", fillColor: "#3b82f6", fillOpacity: 0.06 };

const PIN_PATH = "M16 1.5C8 1.5 1.5 7.9 1.5 15.8c0 10.3 12.6 23.3 13.5 24.2a1.4 1.4 0 0 0 2 0c.9-.9 13.5-13.9 13.5-24.2C30.5 7.9 24 1.5 16 1.5z";

function pinShape(tone, extraClass = "") {
  const pin = document.createElement("span");
  pin.className = `problem-pin problem-pin--${tone} ${extraClass}`.trim();
  pin.innerHTML = `<span class="problem-pin__area" aria-hidden="true"></span><svg viewBox="0 0 32 42" aria-hidden="true" focusable="false"><path d="${PIN_PATH}"/></svg>`;
  return pin;
}

function pinIcon(problem, selected) {
  const pin = pinShape(pinTone(problem.status), selected ? "problem-pin--selected" : "");
  const dot = document.createElement("span");
  dot.className = "problem-pin__dot";
  dot.setAttribute("aria-hidden", "true");
  pin.appendChild(dot);
  const label = document.createElement("span");
  label.className = "sr-only";
  label.textContent = `Problem: ${problem.title}${problem.street ? `, ${problem.street}` : ""}. Status: ${problemStatus(problem.status).label}`;
  pin.appendChild(label);
  const [w, h] = selected ? [46, 60] : [38, 50];
  return L.divIcon({ html: pin, className: "problem-pin-wrapper", iconSize: [w, h], iconAnchor: [w / 2, h - 2] });
}

function clusterIcon(cluster) {
  const count = cluster.getChildCount();
  const pin = pinShape("open", "problem-pin--cluster");
  const number = document.createElement("span");
  number.className = "problem-pin__count";
  number.setAttribute("aria-hidden", "true");
  number.textContent = count > 99 ? "99+" : String(count);
  pin.appendChild(number);
  const label = document.createElement("span");
  label.className = "sr-only";
  label.textContent = `Grupa ${count} zgłoszeń. Naciśnij, aby przybliżyć`;
  pin.appendChild(label);
  const [w, h] = count >= 20 ? [56, 72] : count >= 5 ? [50, 64] : [44, 58];
  return L.divIcon({ html: pin, className: "problem-pin-wrapper problem-cluster-wrapper", iconSize: [w, h], iconAnchor: [w / 2, h - 2] });
}

function popupContent(target) {
  const box = document.createElement("div");
  const name = document.createElement("strong");
  name.textContent = target.name;
  box.appendChild(name);
  if (target.place) {
    const place = document.createElement("div");
    place.textContent = target.place;
    box.appendChild(place);
  }
  return box;
}

// area: optional GeoJSON feature (e.g. the gmina of a JST account), outlined and zoomed to
export default function MapView({ target, area, problems = NO_PROBLEMS, selectedProblemId, onProblemClick, onMapClick, label = "Mapa zgłoszonych problemów" }) {
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
    const animate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    problemsLayerRef.current = L.markerClusterGroup({
      maxClusterRadius: 56,
      showCoverageOnHover: true,
      polygonOptions: { color: "#4f46e5", weight: 1.5, opacity: 0.6, fillColor: "#6366f1", fillOpacity: 0.08 },
      spiderfyOnMaxZoom: true,
      animate,
      iconCreateFunction: clusterIcon,
    }).addTo(map);
    const container = map.getContainer();
    container.addEventListener("keydown", (e) => {
      const cluster = e.target.closest?.(".problem-cluster-wrapper");
      if (!cluster || (e.key !== "Enter" && e.key !== " ")) return;
      e.preventDefault();
      e.stopPropagation();
      cluster.click();
      map.once("zoomend", () => container.focus({ preventScroll: true }));
    });
    map.on("click", () => onMapClickRef.current?.());
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      problemsLayerRef.current = null;
    };
  }, [label]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !area) return;
    const layer = L.geoJSON(area, { style: AREA_STYLE, interactive: false }).addTo(map);
    map.fitBounds(layer.getBounds(), { padding: [24, 24] });
    return () => layer.remove();
  }, [area]);

  useEffect(() => {
    const layer = problemsLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    pinsRef.current.clear();
    const markers = [];
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
        });
      markers.push(pin);
      pin.problem = problem;
      pinsRef.current.set(problem.id, pin);
    }
    layer.addLayers(markers);
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
      if (selected && map) {
        const layer = problemsLayerRef.current;
        if (layer?.getVisibleParent(pin) && layer.getVisibleParent(pin) !== pin) layer.zoomToShowLayer(pin);
        else map.panTo(pin.getLatLng());
      }
    }
  }, [problems, selectedProblemId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !target) return;
    if (markerRef.current) markerRef.current.remove();
    markerRef.current = null;
    const animate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (target.marker === false) {
      map.flyTo([target.lat, target.lon], target.zoom ?? 17, { animate });
      return;
    }
    markerRef.current = L.circleMarker([target.lat, target.lon], {
      radius: 9,
      color: "#1d4ed8",
      fillColor: "#3b82f6",
      fillOpacity: 0.8,
    })
      .addTo(map)
      .bindPopup(popupContent(target), { autoPan: false });
    const marker = markerRef.current;
    map.once("moveend", () => marker.openPopup());
    if (target.bounds) map.flyToBounds(target.bounds, { maxZoom: 17, padding: [80, 80], animate });
    else map.flyTo([target.lat, target.lon], target.zoom ?? 16, { animate });
  }, [target]);

  return <div ref={containerRef} className="relative z-0 isolate w-full h-full" />;
}
