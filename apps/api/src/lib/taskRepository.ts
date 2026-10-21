import {
  TaskResponse,
  CreateTaskInput,
  UpdateTaskInput,
  TaskStatus,
  TaskAuditEvent
} from "@truenorth/shared";
import { prisma } from "./prisma";
import { logger } from "./logger";
import { InMemoryTask } from "../services/taskHistory";

const inMemoryTasks = new Map<string, InMemoryTask>();
let isDatabaseAvailable = process.env.NODE_ENV !== "test" && Boolean(process.env.DATABASE_URL);

export class TaskRepository {
  async findByUserId(
    userId: string,
    filter?: { date?: string; status?: TaskStatus; goalId?: string }
  ): Promise<InMemoryTask[]> {
    if (isDatabaseAvailable) {
      try {
        const dbTasks = await prisma.task.findMany({
          where: {
            userId,
            ...(filter?.date ? { scheduledDate: filter.date } : {}),
            ...(filter?.status ? { status: filter.status } : {}),
            ...(filter?.goalId ? { goalId: filter.goalId } : {})
          },
          include: { auditEvents: true },
          orderBy: { createdAt: "desc" }
        });

        return dbTasks.map((t) => ({
          id: t.id,
          userId: t.userId,
          goalId: t.goalId,
          title: t.title,
          description: t.description,
          originalScheduledDate: t.originalScheduledDate,
          scheduledDate: t.scheduledDate,
          status: t.status,
          isRequiredForUnlock: t.isRequiredForUnlock,
          estimatedMinutes: t.estimatedMinutes,
          completedAt: t.completedAt?.toISOString() ?? null,
          reopenedAt: t.reopenedAt?.toISOString() ?? null,
          rescheduleCount: t.rescheduleCount,
          rescheduledToDate: null,
          auditEvents: t.auditEvents.map((ev) => ({
            id: ev.id,
            taskId: ev.taskId,
            userId: ev.userId,
            eventType: ev.eventType,
            previousStatus: ev.previousStatus,
            newStatus: ev.newStatus,
            previousDate: ev.previousDate,
            newDate: ev.newDate,
            reason: ev.reason,
            createdAt: ev.createdAt.toISOString()
          })),
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString()
        }));
      } catch (err) {
        logger.debug("Database findMany tasks failed; using in-memory store", {
          error: (err as Error).message
        });
        isDatabaseAvailable = false;
      }
    }

    const results: InMemoryTask[] = [];
    for (const t of inMemoryTasks.values()) {
      if (t.userId === userId) {
        if (filter?.date && t.scheduledDate !== filter.date) continue;
        if (filter?.status && t.status !== filter.status) continue;
        if (filter?.goalId && t.goalId !== filter.goalId) continue;
        results.push(t);
      }
    }
    return results.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async findById(taskId: string, userId: string): Promise<InMemoryTask | null> {
    if (isDatabaseAvailable) {
      try {
        const t = await prisma.task.findFirst({
          where: { id: taskId, userId },
          include: { auditEvents: true }
        });

        if (t) {
          return {
            id: t.id,
            userId: t.userId,
            goalId: t.goalId,
            title: t.title,
            description: t.description,
            originalScheduledDate: t.originalScheduledDate,
            scheduledDate: t.scheduledDate,
            status: t.status,
            isRequiredForUnlock: t.isRequiredForUnlock,
            estimatedMinutes: t.estimatedMinutes,
            completedAt: t.completedAt?.toISOString() ?? null,
            reopenedAt: t.reopenedAt?.toISOString() ?? null,
            rescheduleCount: t.rescheduleCount,
            rescheduledToDate: null,
            auditEvents: t.auditEvents.map((ev) => ({
              id: ev.id,
              taskId: ev.taskId,
              userId: ev.userId,
              eventType: ev.eventType,
              previousStatus: ev.previousStatus,
              newStatus: ev.newStatus,
              previousDate: ev.previousDate,
              newDate: ev.newDate,
              reason: ev.reason,
              createdAt: ev.createdAt.toISOString()
            })),
            createdAt: t.createdAt.toISOString(),
            updatedAt: t.updatedAt.toISOString()
          };
        }
      } catch {
        isDatabaseAvailable = false;
      }
    }

    const task = inMemoryTasks.get(taskId);
    if (task && task.userId === userId) {
      return task;
    }
    return null;
  }

  async create(userId: string, input: CreateTaskInput): Promise<InMemoryTask> {
    const id = crypto.randomUUID();
    const eventId = crypto.randomUUID();
    const now = new Date().toISOString();

    const initialAuditEvent: TaskAuditEvent = {
      id: eventId,
      taskId: id,
      userId,
      eventType: "CREATED",
      previousStatus: null,
      newStatus: input.status,
      previousDate: null,
      newDate: input.scheduledDate,
      reason: null,
      createdAt: now
    };

    if (isDatabaseAvailable) {
      try {
        const t = await prisma.task.create({
          data: {
            id,
            userId,
            goalId: input.goalId,
            title: input.title,
            description: input.description,
            originalScheduledDate: input.scheduledDate,
            scheduledDate: input.scheduledDate,
            status: input.status,
            isRequiredForUnlock: input.isRequiredForUnlock,
            estimatedMinutes: input.estimatedMinutes,
            rescheduleCount: 0,
            auditEvents: {
              create: {
                id: initialAuditEvent.id,
                userId,
                eventType: "CREATED",
                newStatus: input.status,
                newDate: input.scheduledDate
              }
            }
          },
          include: { auditEvents: true }
        });

        const created: InMemoryTask = {
          id: t.id,
          userId: t.userId,
          goalId: t.goalId,
          title: t.title,
          description: t.description,
          originalScheduledDate: t.originalScheduledDate,
          scheduledDate: t.scheduledDate,
          status: t.status,
          isRequiredForUnlock: t.isRequiredForUnlock,
          estimatedMinutes: t.estimatedMinutes,
          completedAt: t.completedAt?.toISOString() ?? null,
          reopenedAt: t.reopenedAt?.toISOString() ?? null,
          rescheduleCount: t.rescheduleCount,
          rescheduledToDate: null,
          auditEvents: [initialAuditEvent],
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString()
        };
        inMemoryTasks.set(created.id, created);
        return created;
      } catch (err) {
        logger.debug("Database create task failed; using in-memory store", {
          error: (err as Error).message
        });
        isDatabaseAvailable = false;
      }
    }

    const created: InMemoryTask = {
      id,
      userId,
      goalId: input.goalId ?? null,
      title: input.title,
      description: input.description ?? null,
      originalScheduledDate: input.scheduledDate,
      scheduledDate: input.scheduledDate,
      status: input.status,
      isRequiredForUnlock: input.isRequiredForUnlock,
      estimatedMinutes: input.estimatedMinutes ?? null,
      completedAt: null,
      reopenedAt: null,
      rescheduleCount: 0,
      rescheduledToDate: null,
      auditEvents: [initialAuditEvent],
      createdAt: now,
      updatedAt: now
    };

    inMemoryTasks.set(id, created);
    return created;
  }

  async save(task: InMemoryTask): Promise<InMemoryTask> {
    if (isDatabaseAvailable) {
      try {
        await prisma.task.update({
          where: { id: task.id, userId: task.userId },
          data: {
            title: task.title,
            description: task.description,
            scheduledDate: task.scheduledDate,
            status: task.status,
            isRequiredForUnlock: task.isRequiredForUnlock,
            estimatedMinutes: task.estimatedMinutes,
            completedAt: task.completedAt ? new Date(task.completedAt) : null,
            reopenedAt: task.reopenedAt ? new Date(task.reopenedAt) : null,
            rescheduleCount: task.rescheduleCount,
            goalId: task.goalId
          }
        });

        // Insert newest audit event if not already in DB
        const latestEvent = task.auditEvents[task.auditEvents.length - 1];
        if (latestEvent) {
          await prisma.taskAuditEvent.upsert({
            where: { id: latestEvent.id },
            update: {},
            create: {
              id: latestEvent.id,
              taskId: task.id,
              userId: task.userId,
              eventType: latestEvent.eventType,
              previousStatus: latestEvent.previousStatus,
              newStatus: latestEvent.newStatus,
              previousDate: latestEvent.previousDate,
              newDate: latestEvent.newDate,
              reason: latestEvent.reason,
              createdAt: new Date(latestEvent.createdAt)
            }
          });
        }
      } catch (err) {
        logger.debug("Database save task failed; using in-memory store", {
          error: (err as Error).message
        });
        isDatabaseAvailable = false;
      }
    }

    inMemoryTasks.set(task.id, { ...task });
    return task;
  }

  async delete(taskId: string, userId: string): Promise<boolean> {
    if (isDatabaseAvailable) {
      try {
        await prisma.task.delete({
          where: { id: taskId, userId }
        });
        inMemoryTasks.delete(taskId);
        return true;
      } catch {
        isDatabaseAvailable = false;
      }
    }

    const existing = inMemoryTasks.get(taskId);
    if (!existing || existing.userId !== userId) {
      return false;
    }

    inMemoryTasks.delete(taskId);
    return true;
  }

  async purgeByUserId(userId: string): Promise<void> {
    for (const [id, task] of inMemoryTasks.entries()) {
      if (task.userId === userId) {
        inMemoryTasks.delete(id);
      }
    }
  }

  clearInMemory(): void {
    inMemoryTasks.clear();
  }
}

export const taskRepository = new TaskRepository();
