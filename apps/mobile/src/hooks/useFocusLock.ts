import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../services/apiClient";
import {
  FocusLockPolicy,
  RequestExceptionInput,
  FocusLockExceptionResponse
} from "@truenorth/shared";

export function useFocusLockPolicy() {
  return useQuery<FocusLockPolicy>({
    queryKey: ["focusLock", "policy"],
    queryFn: async () => {
      const res = await apiClient.getFocusLockPolicy();
      return res.data;
    }
  });
}

export function useUpdateFocusLockPolicy() {
  const queryClient = useQueryClient();
  return useMutation<FocusLockPolicy, Error, Partial<FocusLockPolicy>>({
    mutationFn: async (input: Partial<FocusLockPolicy>) => {
      const res = await apiClient.updateFocusLockPolicy(input);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["focusLock", "policy"] });
    }
  });
}

export function useActiveFocusLockException() {
  return useQuery<FocusLockExceptionResponse | null>({
    queryKey: ["focusLock", "exception"],
    queryFn: async () => {
      const res = await apiClient.getActiveFocusLockException();
      return res.data;
    },
    refetchInterval: 30000 // Refresh active exception status every 30 seconds
  });
}

export function useRequestFocusLockException() {
  const queryClient = useQueryClient();
  return useMutation<FocusLockExceptionResponse, Error, RequestExceptionInput>({
    mutationFn: async (input: RequestExceptionInput) => {
      const res = await apiClient.requestFocusLockException(input);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["focusLock", "exception"] });
    }
  });
}
