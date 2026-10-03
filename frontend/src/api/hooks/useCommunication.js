import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CommunicationService } from "@/api/services/CommunicationService";

const CONVERSATIONS_KEY = ["conversations"];
const PARTNERSHIPS_KEY = ["partnerships"];

export function useConversations(enabled = true) {
  return useQuery({
    queryKey: CONVERSATIONS_KEY,
    queryFn: ({ signal }) => CommunicationService.conversations({ ct: signal }),
    enabled,
    refetchInterval: 30_000,
  });
}

export function useConversationMessages(id) {
  return useQuery({
    queryKey: [...CONVERSATIONS_KEY, id, "messages"],
    queryFn: ({ signal }) => CommunicationService.messages(id, { ct: signal }),
    enabled: id != null,
    refetchInterval: 15_000,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (model) => CommunicationService.createConversation(model),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY }),
  });
}

export function useReply(id) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content) => CommunicationService.reply(id, content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...CONVERSATIONS_KEY, id, "messages"] }),
  });
}

export function useSetConversationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }) => CommunicationService.setStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY }),
  });
}

export function usePartnerships() {
  return useQuery({
    queryKey: PARTNERSHIPS_KEY,
    queryFn: ({ signal }) => CommunicationService.partnerships({ ct: signal }),
  });
}

export function useCreatePartnership() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (model) => CommunicationService.createPartnership(model),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PARTNERSHIPS_KEY }),
  });
}
