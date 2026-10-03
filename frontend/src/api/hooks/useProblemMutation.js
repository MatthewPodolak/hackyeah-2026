import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ProblemService } from "@/api/services/ProblemService";

export function useAddProblem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (model) => ProblemService.add(model),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["problems"] }),
  });
}
