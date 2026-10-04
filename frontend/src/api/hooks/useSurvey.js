import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SurveyService } from "@/api/services/SurveyService";

export function useSubmitSurvey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (model) => SurveyService.submit(model),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "survey"] }),
  });
}

export function useSurveySummary(gminaId) {
  return useQuery({
    queryKey: ["admin", "survey", gminaId ?? "region"],
    queryFn: ({ signal }) => SurveyService.summary(gminaId, { ct: signal }),
    placeholderData: (previous) => previous,
  });
}
