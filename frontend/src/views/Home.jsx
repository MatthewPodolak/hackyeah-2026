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
import { HugeiconsIcon } from "@hugeicons/react";
import { LibraryIcon, Megaphone01Icon, Search01Icon } from "@hugeicons/core-free-icons";

const MapView = dynamic(() => import("@/components/mapView"), { ssr: false });

const NO_PROBLEMS = [];

function normalize(text) {
  return (text ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l");
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

  const visibleProblems = useMemo(() => {
    const words = normalize(query).split(/\s+/).filter(Boolean);
    const mine = myGminaId ? (problems ?? NO_PROBLEMS).filter((problem) => problem.gminaId === myGminaId) : problems ?? NO_PROBLEMS;
    if (!words.length) return mine;
    return mine.filter((problem) => {
      const text = normalize([problem.title, problem.description, problem.street].join(" "));
      return words.every((word) => text.includes(word));
    });
  }, [problems, query, myGminaId]);

  return (
    <div className="relative flex h-screen w-full flex-1 flex-col bg-background">
      <h1 className="sr-only">Mapa zgłoszonych problemów</h1>

      <div className="absolute inset-0">
        <MapView
          area={myArea}
          problems={visibleProblems}
          selectedProblemId={selectedProblem?.id}
          onProblemClick={setSelectedProblem}
          onMapClick={() => setSelectedProblem(null)}
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-3 z-[1000] flex flex-col items-center gap-2 pr-17 pl-17">
        <div role="search" className="pointer-events-auto relative w-full max-w-xl">
          <label htmlFor="map-search" className="sr-only">Szukaj problemów na mapie</label>
          <HugeiconsIcon icon={Search01Icon} strokeWidth={2} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            id="map-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj problemów, np. chodnik, Floriańska…"
            aria-describedby="map-search-status"
            className="h-11 w-full rounded-full border border-border bg-card pr-4 pl-12 text-sm text-foreground shadow-elevation-2 outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
          />
          <p id="map-search-status" aria-live="polite" className="sr-only">
            {isPending ? "" : query ? `Znaleziono ${problemsLabel(visibleProblems.length)}` : `Na mapie: ${problemsLabel(visibleProblems.length)}`}
          </p>
        </div>
        {!isPending && (
          <p aria-hidden="true" className="pointer-events-auto rounded-full border border-border bg-card/95 px-3 py-1 text-xs font-medium text-muted-foreground shadow-elevation-1 backdrop-blur">
            {myArea ? <>Twoja gmina: <span className="text-foreground">{gminaName(gminy.get(myGminaId)) ?? "…"}</span> · </> : null}
            {query ? `Znaleziono ${problemsLabel(visibleProblems.length)}` : `Na mapie: ${problemsLabel(visibleProblems.length)}`}
          </p>
        )}
      </div>

      {myArea && <p className="sr-only">Twoja gmina: {gminaName(gminy.get(myGminaId)) ?? ""}</p>}

      <ThemeToggler className="absolute top-3 right-3 z-[1000]" />

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
