"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useToast } from "@/helpers/ToastProvider";
import ThemeToggler from "@/components/theme-toggler";
import AddQuestionary from "@/components/add-questionary";
import ProblemDetails from "@/components/problem-details";
import ProblemSolutions from "@/components/problem-solutions";
import { useProposal } from "@/api/context/ProposalContext";
import { useProblems } from "@/api/hooks/useProblemsQuery";
import { useGminyIndex, useGminyShapes } from "@/api/hooks/useRegionsQuery";
import { useAuth } from "@/api/context/AuthContext";
import { gminaName } from "@/lib/gminy";
import MapSearch, { normalize } from "@/components/map-search";
import { PIN_TONES } from "@/lib/problems";
import { HugeiconsIcon } from "@hugeicons/react";
import { LibraryIcon, Megaphone01Icon } from "@hugeicons/core-free-icons";

const MapView = dynamic(() => import("@/components/mapView"), { ssr: false });

const NO_PROBLEMS = [];

function featureBounds(feature) {
  let minLat = Infinity, minLon = Infinity, maxLat = -Infinity, maxLon = -Infinity;
  const walk = (coords) => {
    if (typeof coords[0] === "number") {
      const [lon, lat] = coords;
      minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
      minLon = Math.min(minLon, lon); maxLon = Math.max(maxLon, lon);
    } else coords.forEach(walk);
  };
  if (!feature?.geometry?.coordinates) return null;
  walk(feature.geometry.coordinates);
  return Number.isFinite(minLat) ? [[minLat, minLon], [maxLat, maxLon]] : null;
}

function problemsLabel(count) {
  if (count === 1) return "1 zgłoszenie";
  const lastDigit = count % 10;
  const lastTwo = count % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14)) return `${count} zgłoszenia`;
  return `${count} zgłoszeń`;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [target, setTarget] = useState(null);
  const [questOpen, setQuestOpen] = useState(false);
  const { showToast } = useToast();
  const { data: problems, isError, isPending } = useProblems();
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const { openProposal } = useProposal();

  const { user, isJst } = useAuth();
  const myGminaId = isJst ? user.gminaId : null;
  const shapes = useGminyShapes({ enabled: !!myGminaId });
  const gminy = useGminyIndex();
  const myArea = useMemo(
    () => (myGminaId ? shapes.data?.find((shape) => shape.properties.id === myGminaId) ?? null : null),
    [shapes.data, myGminaId]
  );

  useEffect(() => {
    if (isError) showToast(null, "error");
  }, [isError, showToast]);

  const scopedProblems = useMemo(
    () => (myGminaId ? (problems ?? NO_PROBLEMS).filter((problem) => problem.gminaId === myGminaId) : problems ?? NO_PROBLEMS),
    [problems, myGminaId]
  );

  const visibleProblems = useMemo(() => {
    const words = normalize(filter).split(/\s+/).filter(Boolean);
    if (!words.length) return scopedProblems;
    return scopedProblems.filter((problem) => {
      const text = normalize([problem.title, problem.description, problem.street].join(" "));
      return words.every((word) => text.includes(word));
    });
  }, [scopedProblems, filter]);

  const bias = useMemo(() => {
    if (!myArea) return null;
    const bounds = featureBounds(myArea);
    return bounds ? [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2] : null;
  }, [myArea]);

  return (
    <div className="relative flex h-screen w-full flex-1 flex-col bg-background">
      <h1 className="sr-only">Mapa zgłoszonych problemów</h1>

      <div className="absolute inset-0">
        <MapView
          area={myArea}
          target={target}
          problems={visibleProblems}
          selectedProblemId={selectedProblem?.id}
          onProblemClick={setSelectedProblem}
          onMapClick={() => setSelectedProblem(null)}
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-3 z-[1000] flex flex-col items-center gap-2 pr-17 pl-17">
        <MapSearch
          className="pointer-events-auto max-w-xl"
          value={query}
          onChange={(text) => {
            setQuery(text);
            setFilter(text);
          }}
          problems={scopedProblems}
          bias={bias}
          onPickPlace={(place) => {
            setQuery(place.name);
            setFilter("");
            setSelectedProblem(null);
            setTarget({ ...place });
          }}
          onPickProblem={(problem) => {
            setQuery(problem.title);
            setFilter("");
            setSelectedProblem(problem);
            if (problem.latitude != null && problem.longitude != null) {
              setTarget({ lat: problem.latitude, lon: problem.longitude, zoom: 18, marker: false });
            }
          }}
        />
        <p id="map-search-status" aria-live="polite" className="sr-only">
          {isPending ? "" : filter ? `Znaleziono ${problemsLabel(visibleProblems.length)}` : `Na mapie: ${problemsLabel(visibleProblems.length)}`}
        </p>
        {!isPending && (
          <p aria-hidden="true" className="pointer-events-auto rounded-full border border-border bg-card/95 px-3 py-1 text-xs font-medium text-muted-foreground shadow-elevation-1 backdrop-blur">
            {myArea ? <>Twoja gmina: <span className="text-foreground">{gminaName(gminy.get(myGminaId)) ?? "…"}</span> · </> : null}
            {filter ? `Znaleziono ${problemsLabel(visibleProblems.length)}` : `Na mapie: ${problemsLabel(visibleProblems.length)}`}
          </p>
        )}
      </div>

      {myArea && <p className="sr-only">Twoja gmina: {gminaName(gminy.get(myGminaId)) ?? ""}</p>}

      <ThemeToggler className="absolute top-3 right-3 z-[1000]" />

      <ul
        aria-label="Legenda kolorów pinezek"
        className="absolute bottom-6 left-[76px] z-[1000] hidden items-center gap-4 rounded-2xl border border-border bg-card/95 px-4 py-2.5 text-xs font-medium shadow-elevation-2 backdrop-blur sm:flex"
      >
        {PIN_TONES.map((tone) => (
          <li key={tone.key} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={`pin-legend-dot problem-pin--${tone.key}`} />
            {tone.label}
          </li>
        ))}
      </ul>

      <div className="absolute right-4 bottom-6 z-[1000] flex flex-col items-end gap-3">
        <Link
          href="/innovations"
          className="flex h-12 items-center gap-2 rounded-2xl border border-border bg-card px-4 text-sm font-semibold text-foreground shadow-elevation-2 transition-shadow hover:bg-muted hover:shadow-elevation-3"
        >
          <HugeiconsIcon icon={LibraryIcon} strokeWidth={1.8} aria-hidden="true" className="size-5" />
          Biblioteka innowacji
        </Link>
        <button
          type="button"
          onClick={() => setQuestOpen(true)}
          className="flex h-14 cursor-pointer items-center gap-3 rounded-2xl bg-primary px-5 text-base font-semibold text-primary-foreground shadow-elevation-3 transition-[box-shadow,background-color] hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <HugeiconsIcon icon={Megaphone01Icon} strokeWidth={2} aria-hidden="true" className="size-6" />
          Zgłoś problem
        </button>
      </div>

      <ProblemDetails problem={selectedProblem} onClose={() => setSelectedProblem(null)} onProposeSolution={openProposal} />

      <AddQuestionary open={questOpen} onClose={() => setQuestOpen(false)} onSubmitted={setSubmitResult} />

      <ProblemSolutions result={submitResult} onClose={() => setSubmitResult(null)} />
    </div>
  );
}
