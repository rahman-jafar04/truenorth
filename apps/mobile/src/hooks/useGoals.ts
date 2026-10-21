import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../services/apiClient";
import { CreateGoalInput, UpdateGoalInput, GoalResponse, GoalStatus } from "@truenorth/shared";

export function useGoals(filter?: { status?: GoalStatus; category?: string }) {
  return useQuery<GoalResponse[]>({
    queryKey: ["goals", filter],
    queryFn: async () => {
      const res = await apiClient.getGoals();
      let goals = res.data;
      if (filter?.status) {
        goals = goals.filter((g) => g.status === filter.status);
      }
      if (filter?.category) {
        goals = goals.filter((g) => g.category === filter.category);
      }
      return goals;
    }
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateGoalInput) => {
      const res = await apiClient.createGoal(input);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    }
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ goalId, input }: { goalId: string; input: UpdateGoalInput }) => {
      const res = await apiClient.updateGoal(goalId, input);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    }
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (goalId: string) => {
      await apiClient.deleteGoal(goalId);
      return goalId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    }
  });
}
