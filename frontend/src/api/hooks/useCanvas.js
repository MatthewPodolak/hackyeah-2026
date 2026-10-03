import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConfigService } from "@/api/services/ConfigService";
import { IdeaService } from "@/api/services/IdeaService";

export function useCanvasSpec() {
  return useQuery({
    queryKey: ["config", "canvas"],
    queryFn: ({ signal }) => ConfigService.canvas({ ct: signal }),
    staleTime: Infinity,
  });
}

export function useIdeaByToken(token) {
  return useQuery({
    queryKey: ["ideas", "token", token],
    queryFn: ({ signal }) => IdeaService.getByToken(token, { ct: signal }),
    enabled: !!token,
    retry: false,
  });
}

export function useSaveCanvas(token) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (answers) => IdeaService.saveCanvas(token, answers),
    onSuccess: (data) => queryClient.setQueryData(["ideas", "token", token], data),
  });
}

export function useSuggestCanvas(token) {
  return useMutation({
    mutationFn: (step) => IdeaService.suggestCanvas(token, step),
  });
}

export function useIdeaFeedback(token) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => IdeaService.feedback(token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ideas", "token", token] }),
  });
}

export function useKnowledgeResources() {
  return useQuery({
    queryKey: ["knowledge", "resources"],
    queryFn: ({ signal }) => ConfigService.resources({ ct: signal }),
    staleTime: 10 * 60_000,
  });
}

export function useVisualize(token) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (description) => IdeaService.visualize(token, description),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ideas", "token", token] }),
  });
}
