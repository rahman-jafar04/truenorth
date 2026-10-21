import {
  TaskResponse,
  CreateTaskInput,
  CreateTaskSchema,
  UpdateTaskInput,
  UpdateTaskSchema,
  RescheduleTaskInput,
  RescheduleTaskSchema,
  ReopenTaskInput,
  ReopenTaskSchema,
  TaskStatus,
  DailyReport
} from "@truenorth/shared";
import { taskRepository } from "../lib/taskRepository";
import { goalRepository } from "../lib/goalRepository";
import {
  InMemoryTask,
  completeTask as completeTaskHistory,
  reopenTask as reopenTaskHistory,
  rescheduleTask as rescheduleTaskHistory,
  computeHistoricalDailyReport
} from "./taskHistory";
import { logger } from "../lib/logger";

export class TaskServiceError extends Error {
  constructor(public code: string, message: string, public statusCode: number = 400) {
    super(message);
    this.name = "TaskServiceError";
  }
}

export class TaskService {
  async getTasks(
    userId: string,
    filter?: { date?: string; status?: TaskStatus; goalId?: string }
  ): Promise<TaskResponse[]> {
    return taskRepository.findByUserId(userId, filter);
  }

  async getTaskById(taskId: string, userId: string): Promise<TaskResponse> {
    const task = await taskRepository.findById(taskId, userId);
    if (!task) {
      throw new TaskServiceError("TASK_NOT_FOUND", "Task not found or access denied", 404);
    }
    return task;
  }

  async createTask(userId: string, rawInput: unknown): Promise<TaskResponse> {
    const input: CreateTaskInput = CreateTaskSchema.parse(rawInput);

    if (input.goalId) {
      const goal = await goalRepository.findById(input.goalId, userId);
      if (!goal) {
        throw new TaskServiceError("GOAL_NOT_FOUND", "Linked goal not found or access denied", 404);
      }
    }

    const task = await taskRepository.create(userId, input);
    logger.info("Created task", {
      taskId: task.id,
      userId,
      scheduledDate: task.scheduledDate,
      isRequiredForUnlock: task.isRequiredForUnlock
    });
    return task;
  }

  async updateTask(
    taskId: string,
    userId: string,
    rawInput: unknown
  ): Promise<TaskResponse> {
    const input: UpdateTaskInput = UpdateTaskSchema.parse(rawInput);

    const existing = await taskRepository.findById(taskId, userId);
    if (!existing) {
      throw new TaskServiceError("TASK_NOT_FOUND", "Task not found or access denied", 404);
    }

    if (input.goalId !== undefined && input.goalId !== null) {
      const goal = await goalRepository.findById(input.goalId, userId);
      if (!goal) {
        throw new TaskServiceError("GOAL_NOT_FOUND", "Linked goal not found or access denied", 404);
      }
    }

    const updatedTask: InMemoryTask = {
      ...existing,
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description ?? null } : {}),
      ...(input.scheduledDate !== undefined ? { scheduledDate: input.scheduledDate } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.isRequiredForUnlock !== undefined ? { isRequiredForUnlock: input.isRequiredForUnlock } : {}),
      ...(input.estimatedMinutes !== undefined ? { estimatedMinutes: input.estimatedMinutes ?? null } : {}),
      ...(input.goalId !== undefined ? { goalId: input.goalId } : {}),
      ...(input.completedAt !== undefined ? { completedAt: input.completedAt } : {}),
      ...(input.reopenedAt !== undefined ? { reopenedAt: input.reopenedAt } : {}),
      ...(input.rescheduledToDate !== undefined ? { rescheduledToDate: input.rescheduledToDate } : {}),
      updatedAt: new Date().toISOString()
    };

    const saved = await taskRepository.save(updatedTask);
    logger.info("Updated task", { taskId, userId, status: saved.status });
    return saved;
  }

  async completeTask(taskId: string, userId: string): Promise<TaskResponse> {
    const existing = await taskRepository.findById(taskId, userId);
    if (!existing) {
      throw new TaskServiceError("TASK_NOT_FOUND", "Task not found or access denied", 404);
    }

    const { task: completed } = completeTaskHistory(existing);
    const saved = await taskRepository.save(completed);

    logger.info("Completed task", { taskId, userId, completedAt: saved.completedAt });
    return saved;
  }

  async reopenTask(
    taskId: string,
    userId: string,
    rawInput: unknown = {}
  ): Promise<TaskResponse> {
    const input: ReopenTaskInput = ReopenTaskSchema.parse(rawInput);

    const existing = await taskRepository.findById(taskId, userId);
    if (!existing) {
      throw new TaskServiceError("TASK_NOT_FOUND", "Task not found or access denied", 404);
    }

    const { task: reopened } = reopenTaskHistory(existing, input.reason);
    const saved = await taskRepository.save(reopened);

    logger.info("Reopened task", { taskId, userId, reopenedAt: saved.reopenedAt });
    return saved;
  }

  async rescheduleTask(
    taskId: string,
    userId: string,
    rawInput: unknown
  ): Promise<TaskResponse> {
    const input: RescheduleTaskInput = RescheduleTaskSchema.parse(rawInput);

    const existing = await taskRepository.findById(taskId, userId);
    if (!existing) {
      throw new TaskServiceError("TASK_NOT_FOUND", "Task not found or access denied", 404);
    }

    const { task: rescheduled } = rescheduleTaskHistory(
      existing,
      input.newDate,
      input.reason
    );
    const saved = await taskRepository.save(rescheduled);

    logger.info("Rescheduled task", {
      taskId,
      userId,
      newDate: input.newDate,
      rescheduleCount: saved.rescheduleCount
    });
    return saved;
  }

  async deleteTask(taskId: string, userId: string): Promise<void> {
    const existing = await taskRepository.findById(taskId, userId);
    if (!existing) {
      throw new TaskServiceError("TASK_NOT_FOUND", "Task not found or access denied", 404);
    }

    await taskRepository.delete(taskId, userId);
    logger.info("Deleted task", { taskId, userId });
  }

  async getDailyReport(
    userId: string,
    date: string,
    timezone: string = "UTC"
  ): Promise<DailyReport> {
    const allTasks = await taskRepository.findByUserId(userId);
    return computeHistoricalDailyReport(allTasks, date, timezone);
  }
}

export const taskService = new TaskService();
