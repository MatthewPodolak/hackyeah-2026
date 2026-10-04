import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GrantCallService } from "@/api/services/GrantCallService";

const GRANT_KEY = ["grant-calls"];

export function useGrantCalls() {
  return useQuery({
    queryKey: [...GRANT_KEY, "all"],
    queryFn: ({ signal }) => GrantCallService.all({ ct: signal }),
  });
}

export function useActiveGrantCalls() {
  return useQuery({
    queryKey: [...GRANT_KEY, "active"],
    queryFn: ({ signal }) => GrantCallService.active({ ct: signal }),
  });
}

export function useGrantApplication() {
  return useMutation({
    mutationFn: ({ callId, model }) => GrantCallService.application(callId, model),
  });
}

export function useAdminGrantCalls() {
  return useQuery({
    queryKey: [...GRANT_KEY, "admin"],
    queryFn: ({ signal }) => GrantCallService.adminList({ ct: signal }),
  });
}

export function useSaveGrantCall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (model) => GrantCallService.adminSave(model),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GRANT_KEY }),
  });
}

export function useDeleteGrantCall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => GrantCallService.adminDelete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GRANT_KEY }),
  });
}
