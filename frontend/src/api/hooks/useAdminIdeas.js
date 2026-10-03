import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminIdeaService } from "@/api/services/AdminIdeaService";

const ADMIN_KEY = ["ideas", "admin"];

export function useAdminIdeas() {
  return useQuery({
    queryKey: [...ADMIN_KEY, "list"],
    queryFn: ({ signal }) => AdminIdeaService.list({ ct: signal }),
  });
}

export function useAdminIdea(id) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: [...ADMIN_KEY, "detail", id],
    queryFn: async ({ signal }) => {
      const res = await AdminIdeaService.get(id, { ct: signal });
      queryClient.invalidateQueries({ queryKey: [...ADMIN_KEY, "unseen"] });
      return res;
    },
    enabled: id != null,
  });
}

export function useUnseenIdeasCount(enabled) {
  return useQuery({
    queryKey: [...ADMIN_KEY, "unseen"],
    queryFn: ({ signal }) => AdminIdeaService.unseen({ ct: signal }),
    enabled,
    refetchInterval: 60_000,
  });
}

export function useReviewIdea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, model }) => AdminIdeaService.review(id, model),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADMIN_KEY }),
  });
}
