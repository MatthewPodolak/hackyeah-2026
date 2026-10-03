import { useQuery } from "@tanstack/react-query";
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

export function useProblem(id) {
  return useQuery({
    queryKey: ["problems", id],
    queryFn: ({ signal }) => ProblemService.getById(id, { ct: signal }),
    enabled: id != null,
    staleTime: 60_000,
  });
}
