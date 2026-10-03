import { useQuery } from "@tanstack/react-query";
import { ProblemService } from "@/api/services/ProblemService";

export function useProblems() {
  return useQuery({
    queryKey: ["problems"],
    queryFn: ({ signal }) => ProblemService.get({ ct: signal }),
  });
}
