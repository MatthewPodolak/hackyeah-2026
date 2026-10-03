import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IdeaService } from "@/api/services/IdeaService";

export function useAddIdea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (model) => IdeaService.add(model),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ideas"] }),
  });
}

export function useDraftIdea() {
  return useMutation({
    mutationFn: (model) => IdeaService.draft(model),
  });
}

export function useUpdateIdea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ token, model }) => IdeaService.update(token, model),
    onSuccess: (_, { token }) => queryClient.invalidateQueries({ queryKey: ["ideas", "token", token] }),
  });
}
