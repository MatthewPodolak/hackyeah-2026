"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { useToast } from "@/helpers/ToastProvider";
import ThemeToggler from "@/components/theme-toggler";
import AddQuestionary from "@/components/add-questionary";
import ProblemDetails from "@/components/problem-details";
import ProblemSolutions from "@/components/problem-solutions";
import { useProposal } from "@/api/context/ProposalContext";
import { useProblems } from "@/api/hooks/useProblemsQuery";

const MapView = dynamic(() => import("@/components/mapView"), { ssr: false });

export default function Home() {
  const [query, setQuery] = useState("");
  const [questOpen, setQuestOpen] = useState(false);
  const { showToast } = useToast();
  const { data: problems, isError } = useProblems();
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const { openProposal } = useProposal();

  useEffect(() => {
    if (isError) showToast(null, "error");
  }, [isError]);

  return (
    <div className="flex flex-col flex-1 font-sans bg-background h-screen w-full relative">
      <div className="w-full min-h-12 bg-background flex flex-row items-center justify-center px-3 absolute top-0 z-[1000] border-b">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Szukaj..."
          className="w-[60%] h-9 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="absolute right-3">
          <ThemeToggler />
        </div>
      </div>

      <div className="absolute inset-0 top-12">
        <MapView
          problems={problems}
          selectedProblemId={selectedProblem?.id}
          onProblemClick={setSelectedProblem}
          onMapClick={() => setSelectedProblem(null)}
        />
      </div>

    <div onClick={() => setQuestOpen(true)} className="absolute z-[1000] right-4 bottom-20 w-12 h-12 rounded-full bg-background border shadow-lg flex items-center justify-center cursor-pointer">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    </div>

    <div className="absolute z-[1000] right-4 bottom-4 w-12 h-12 rounded-full bg-background border shadow-lg flex items-center justify-center cursor-pointer">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
      </svg>
    </div>

    <ProblemDetails problem={selectedProblem} onClose={() => setSelectedProblem(null)} onProposeSolution={openProposal} />

    <AddQuestionary open={questOpen} onClose={() => setQuestOpen(false)} onSubmitted={setSubmitResult} />

    <ProblemSolutions result={submitResult} onClose={() => setSubmitResult(null)} />

    </div>
  );
}