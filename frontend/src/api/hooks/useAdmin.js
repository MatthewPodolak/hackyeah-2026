import { useCallback, useMemo } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { innovationName } from "@/lib/community";
import { AdminService, CatalogService } from "@/api/services/AdminService";
import { ProblemService } from "@/api/services/ProblemService";

export function useAdminProblems({ enabled = true } = {}) {
  return useQuery({
    queryKey: ["problems", "admin"],
    queryFn: ({ signal }) => AdminService.problems(null, { ct: signal }),
    enabled,
  });
}

export function useAdminProblem(id) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ["problems", "admin", id],
    queryFn: async ({ signal }) => {
      const res = await AdminService.problem(id, { ct: signal });
      queryClient.invalidateQueries({ queryKey: ["problems", "admin", "unseen"] });
      return res;
    },
    enabled: id != null,
  });
}

export function useReviewProblem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, model }) => AdminService.reviewProblem(id, model),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["problems"] }),
  });
}

export function useUnseenProblems(enabled) {
  return useQuery({
    queryKey: ["problems", "admin", "unseen"],
    queryFn: ({ signal }) => AdminService.unseenProblems({ ct: signal }),
    enabled,
    refetchInterval: 60_000,
  });
}

export function useInstitutionAccounts() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: ({ signal }) => AdminService.users(null, { ct: signal }),
  });
}

export function usePendingAccounts(enabled) {
  return useQuery({
    queryKey: ["admin", "users", "pending"],
    queryFn: ({ signal }) => AdminService.pendingUsers({ ct: signal }),
    enabled,
    refetchInterval: 60_000,
  });
}

export function useSetAccountStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => AdminService.setUserStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useCatalog() {
  return useQuery({
    queryKey: ["catalog", "innovations"],
    queryFn: ({ signal }) => CatalogService.innovations({ ct: signal }),
    staleTime: 5 * 60_000,
  });
}

export function useSaveInnovation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, model }) => (id ? AdminService.updateInnovation(id, model) : AdminService.createInnovation(model)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["catalog"] }),
  });
}

export function useRemoveInnovation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => AdminService.removeInnovation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["catalog"] }),
  });
}

export function useSaveResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, model }) => (id ? AdminService.updateResource(id, model) : AdminService.createResource(model)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["knowledge"] }),
  });
}

export function useRemoveResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => AdminService.removeResource(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["knowledge"] }),
  });
}

export function useStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: ({ signal }) => AdminService.stats({ ct: signal }),
  });
}

export function useInsights() {
  return useMutation({ mutationFn: () => AdminService.insights() });
}

export function useRegions() {
  return useQuery({
    queryKey: ["config", "regions"],
    queryFn: ({ signal }) => CatalogService.regions({ ct: signal }),
    staleTime: Infinity,
  });
}

export function useImplementationPlan() {
  return useMutation({ mutationFn: (model) => CatalogService.plan(model) });
}

export function useProblemsByTokens(tokens) {
  return useQueries({
    queries: tokens.map((token) => ({
      queryKey: ["problems", "token", token],
      queryFn: ({ signal }) => ProblemService.byToken(token, { ct: signal }),
      retry: false,
    })),
  });
}

export function useMyProblems(enabled) {
  return useQuery({
    queryKey: ["problems", "mine"],
    queryFn: ({ signal }) => ProblemService.mine({ ct: signal }),
    enabled,
  });
}

export function useInnovationName() {
  const { data } = useCatalog();
  const names = useMemo(() => new Map((data ?? []).map((innovation) => [innovation.id, innovation.name])), [data]);
  return useCallback((id) => names.get(id) ?? innovationName(id), [names]);
}
