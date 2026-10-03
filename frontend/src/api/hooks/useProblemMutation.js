import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ProblemService } from "@/api/services/ProblemService";

export function useAddProblem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (model) => ProblemService.add(model, { timeoutMs: 60000 }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["problems"] }),
  });
}
