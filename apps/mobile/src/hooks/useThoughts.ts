import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../services/apiClient";
import { SubmitThoughtInput, ThoughtRecord, AiGuidanceResponse } from "@truenorth/shared";

export function useThoughts(filter?: { goalId?: string; limit?: number }) {
  return useQuery<ThoughtRecord[]>({
    queryKey: ["thoughts", filter],
    queryFn: async () => {
      const res = await apiClient.getThoughts(filter?.goalId, filter?.limit);
      return res.data;
    }
  });
}

export function useThought(thoughtId: string) {
  return useQuery<ThoughtRecord>({
    queryKey: ["thoughts", thoughtId],
    queryFn: async () => {
      const res = await apiClient.getThoughtById(thoughtId);
      return res.data;
    },
    enabled: Boolean(thoughtId)
  });
}

export function useSubmitThought() {
  const queryClient = useQueryClient();
  return useMutation<{ data: AiGuidanceResponse; thought?: ThoughtRecord }, Error, SubmitThoughtInput>({
    mutationFn: async (input: SubmitThoughtInput) => {
      return apiClient.analyzeThought(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thoughts"] });
    }
  });
}

export function useDeleteThought() {
  const queryClient = useQueryClient();
  return useMutation<string, Error, string>({
    mutationFn: async (thoughtId: string) => {
      await apiClient.deleteThought(thoughtId);
      return thoughtId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thoughts"] });
    }
  });
}
