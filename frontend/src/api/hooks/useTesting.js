import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TestingService } from "@/api/services/TestingService";

const TESTING_KEY = ["testing"];

export function useInnovationReviews(innovationId) {
  return useQuery({
    queryKey: [...TESTING_KEY, "reviews", innovationId],
    queryFn: ({ signal }) => TestingService.reviews(innovationId, { ct: signal }),
    enabled: !!innovationId,
  });
}

export function useAddReview(innovationId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (model) => TestingService.addReview(innovationId, model),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...TESTING_KEY, "reviews", innovationId] }),
  });
}

export function useParticipate(innovationId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (model) => TestingService.participate(innovationId, model),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TESTING_KEY }),
  });
}

export function useMyParticipations(enabled = true) {
  return useQuery({
    queryKey: [...TESTING_KEY, "mine"],
    queryFn: ({ signal }) => TestingService.mine({ ct: signal }),
    enabled,
  });
}

export function useAdminParticipations() {
  return useQuery({
    queryKey: [...TESTING_KEY, "admin"],
    queryFn: ({ signal }) => TestingService.adminList(null, { ct: signal }),
  });
}

export function useSetParticipationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }) => TestingService.adminStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TESTING_KEY }),
  });
}
