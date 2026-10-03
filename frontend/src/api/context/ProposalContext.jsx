"use client";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import ProposeSolution from "@/components/propose-solution";

const ProposalContext = createContext(null);

export function ProposalProvider({ children }) {
  const [proposal, setProposal] = useState(null);

  const openProposal = useCallback((problem = null) => setProposal({ problem }), []);
  const closeProposal = useCallback(() => setProposal(null), []);

  const value = useMemo(() => ({ openProposal, closeProposal }), [openProposal, closeProposal]);

  return (
    <ProposalContext.Provider value={value}>
      {children}
      <ProposeSolution open={!!proposal} problem={proposal?.problem} onClose={closeProposal} />
    </ProposalContext.Provider>
  );
}

export function useProposal() {
  const ctx = useContext(ProposalContext);
  if (!ctx) throw new Error("useProposal must be used inside ProposalProvider");
  return ctx;
}
