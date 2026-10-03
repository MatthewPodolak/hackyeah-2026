import { useQueries, useQuery } from "@tanstack/react-query";
import { IdeaService } from "@/api/services/IdeaService";

export function useIdeasByTokens(tokens) {
  return useQueries({
    queries: tokens.map((token) => ({
      queryKey: ["ideas", "token", token],
      queryFn: ({ signal }) => IdeaService.getByToken(token, { ct: signal }),
      retry: false,
    })),
  });
}

export function useSimilarInnovations(token) {
  return useQuery({
    queryKey: ["ideas", "token", token, "similar"],
    queryFn: ({ signal }) => IdeaService.similar(token, { ct: signal }),
    enabled: !!token,
    staleTime: Infinity,
    retry: false,
  });
}

export function useIdeasGallery() {
  return useQuery({
    queryKey: ["ideas", "gallery"],
    queryFn: ({ signal }) => IdeaService.gallery({ ct: signal }),
  });
}
