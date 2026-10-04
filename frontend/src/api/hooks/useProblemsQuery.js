import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ProblemService } from "@/api/services/ProblemService";

export function useProblems() {
  return useQuery({
    queryKey: ["problems"],
    queryFn: ({ signal }) => ProblemService.get({ ct: signal }),
  });
}

export function useReportedProblems(userId) {
  return useQuery({
    queryKey: ["problems", "reported", userId],
    queryFn: ({ signal }) => ProblemService.reported({ ct: signal }),
    enabled: userId != null,
  });
}

// JST menu badge: reports of its gmina still to decide
export function useGminaWaiting(enabled) {
  return useQuery({
    queryKey: ["problems", "reported", "waiting"],
    queryFn: ({ signal }) => ProblemService.reportedWaiting({ ct: signal }),
    enabled,
    refetchInterval: 60_000,
  });
}

export function useGminaDecision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, model }) => ProblemService.decide(id, model),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["problems"] }),
  });
}

export function useProblem(id) {
  return useQuery({
    queryKey: ["problems", id],
    queryFn: ({ signal }) => ProblemService.getById(id, { ct: signal }),
    enabled: id != null,
    staleTime: 60_000,
  });
}
