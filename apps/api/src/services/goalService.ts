import {
  GoalResponse,
  CreateGoalInput,
  CreateGoalSchema,
  UpdateGoalInput,
  UpdateGoalSchema,
  GoalStatus
} from "@truenorth/shared";
import { goalRepository } from "../lib/goalRepository";
import { logger } from "../lib/logger";

export class GoalServiceError extends Error {
  constructor(public code: string, message: string, public statusCode: number = 400) {
    super(message);
    this.name = "GoalServiceError";
  }
}

export class GoalService {
  async getGoals(
    userId: string,
    filter?: { status?: GoalStatus; category?: string }
  ): Promise<GoalResponse[]> {
    return goalRepository.findByUserId(userId, filter);
  }

  async getGoalById(goalId: string, userId: string): Promise<GoalResponse> {
    const goal = await goalRepository.findById(goalId, userId);
    if (!goal) {
      throw new GoalServiceError("GOAL_NOT_FOUND", "Goal not found or access denied", 404);
    }
    return goal;
  }

  async createGoal(userId: string, rawInput: unknown): Promise<GoalResponse> {
    const input: CreateGoalInput = CreateGoalSchema.parse(rawInput);
    const goal = await goalRepository.create(userId, input);

    logger.info("Created goal", {
      goalId: goal.id,
      userId,
      priority: goal.priority
    });
    return goal;
  }

  async updateGoal(
    goalId: string,
    userId: string,
    rawInput: unknown
  ): Promise<GoalResponse> {
    const input: UpdateGoalInput = UpdateGoalSchema.parse(rawInput);

    // Verify existence & ownership
    const existing = await goalRepository.findById(goalId, userId);
    if (!existing) {
      throw new GoalServiceError("GOAL_NOT_FOUND", "Goal not found or access denied", 404);
    }

    const updated = await goalRepository.update(goalId, userId, input);
    logger.info("Updated goal", { goalId, userId, status: updated.status });
    return updated;
  }

  async deleteGoal(goalId: string, userId: string): Promise<void> {
    const existing = await goalRepository.findById(goalId, userId);
    if (!existing) {
      throw new GoalServiceError("GOAL_NOT_FOUND", "Goal not found or access denied", 404);
    }

    await goalRepository.delete(goalId, userId);
    logger.info("Deleted goal", { goalId, userId });
  }
}

export const goalService = new GoalService();
