import {
  GoalResponse,
  CreateGoalInput,
  UpdateGoalInput,
  GoalStatus
} from "@truenorth/shared";
import { prisma } from "./prisma";
import { logger } from "./logger";

const inMemoryGoals = new Map<string, GoalResponse>();
let isDatabaseAvailable = process.env.NODE_ENV !== "test" && Boolean(process.env.DATABASE_URL);

export class GoalRepository {
  async findByUserId(
    userId: string,
    filter?: { status?: GoalStatus; category?: string }
  ): Promise<GoalResponse[]> {
    if (isDatabaseAvailable) {
      try {
        const dbGoals = await prisma.goal.findMany({
          where: {
            userId,
            ...(filter?.status ? { status: filter.status } : {}),
            ...(filter?.category ? { category: filter.category } : {})
          },
          orderBy: { createdAt: "desc" }
        });

        return dbGoals.map((g) => ({
          id: g.id,
          userId: g.userId,
          title: g.title,
          description: g.description,
          priority: g.priority,
          status: g.status,
          targetDate: g.targetDate?.toISOString() ?? null,
          category: g.category,
          createdAt: g.createdAt.toISOString(),
          updatedAt: g.updatedAt.toISOString()
        }));
      } catch (err) {
        logger.debug("Database findMany goals failed; using in-memory store", {
          error: (err as Error).message
        });
        isDatabaseAvailable = false;
      }
    }

    // In-memory fallback with strict tenant isolation
    const results: GoalResponse[] = [];
    for (const g of inMemoryGoals.values()) {
      if (g.userId === userId) {
        if (filter?.status && g.status !== filter.status) continue;
        if (filter?.category && g.category !== filter.category) continue;
        results.push(g);
      }
    }
    return results.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async findById(goalId: string, userId: string): Promise<GoalResponse | null> {
    if (isDatabaseAvailable) {
      try {
        const g = await prisma.goal.findFirst({
          where: { id: goalId, userId }
        });
        if (g) {
          return {
            id: g.id,
            userId: g.userId,
            title: g.title,
            description: g.description,
            priority: g.priority,
            status: g.status,
            targetDate: g.targetDate?.toISOString() ?? null,
            category: g.category,
            createdAt: g.createdAt.toISOString(),
            updatedAt: g.updatedAt.toISOString()
          };
        }
      } catch {
        isDatabaseAvailable = false;
      }
    }

    const goal = inMemoryGoals.get(goalId);
    if (goal && goal.userId === userId) {
      return goal;
    }
    return null;
  }

  async create(userId: string, input: CreateGoalInput): Promise<GoalResponse> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    if (isDatabaseAvailable) {
      try {
        const g = await prisma.goal.create({
          data: {
            id,
            userId,
            title: input.title,
            description: input.description,
            priority: input.priority,
            status: "ACTIVE",
            targetDate: input.targetDate ? new Date(input.targetDate) : null,
            category: input.category
          }
        });

        const goal: GoalResponse = {
          id: g.id,
          userId: g.userId,
          title: g.title,
          description: g.description,
          priority: g.priority,
          status: g.status,
          targetDate: g.targetDate?.toISOString() ?? null,
          category: g.category,
          createdAt: g.createdAt.toISOString(),
          updatedAt: g.updatedAt.toISOString()
        };
        inMemoryGoals.set(goal.id, goal);
        return goal;
      } catch (err) {
        logger.debug("Database create goal failed; using in-memory store", {
          error: (err as Error).message
        });
        isDatabaseAvailable = false;
      }
    }

    const goal: GoalResponse = {
      id,
      userId,
      title: input.title,
      description: input.description ?? null,
      priority: input.priority,
      status: "ACTIVE",
      targetDate: input.targetDate ?? null,
      category: input.category ?? null,
      createdAt: now,
      updatedAt: now
    };

    inMemoryGoals.set(id, goal);
    return goal;
  }

  async update(
    goalId: string,
    userId: string,
    input: UpdateGoalInput
  ): Promise<GoalResponse> {
    const now = new Date().toISOString();

    if (isDatabaseAvailable) {
      try {
        const g = await prisma.goal.update({
          where: { id: goalId, userId },
          data: {
            ...(input.title !== undefined ? { title: input.title } : {}),
            ...(input.description !== undefined ? { description: input.description } : {}),
            ...(input.priority !== undefined ? { priority: input.priority } : {}),
            ...(input.status !== undefined ? { status: input.status } : {}),
            ...(input.targetDate !== undefined
              ? { targetDate: input.targetDate ? new Date(input.targetDate) : null }
              : {}),
            ...(input.category !== undefined ? { category: input.category } : {})
          }
        });

        const goal: GoalResponse = {
          id: g.id,
          userId: g.userId,
          title: g.title,
          description: g.description,
          priority: g.priority,
          status: g.status,
          targetDate: g.targetDate?.toISOString() ?? null,
          category: g.category,
          createdAt: g.createdAt.toISOString(),
          updatedAt: g.updatedAt.toISOString()
        };
        inMemoryGoals.set(goal.id, goal);
        return goal;
      } catch (err) {
        logger.debug("Database update goal failed; using in-memory store", {
          error: (err as Error).message
        });
        isDatabaseAvailable = false;
      }
    }

    const existing = inMemoryGoals.get(goalId);
    if (!existing || existing.userId !== userId) {
      throw new Error(`Goal with ID ${goalId} not found or unauthorized`);
    }

    const updated: GoalResponse = {
      ...existing,
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description ?? null } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.targetDate !== undefined ? { targetDate: input.targetDate ?? null } : {}),
      ...(input.category !== undefined ? { category: input.category ?? null } : {}),
      updatedAt: now
    };

    inMemoryGoals.set(goalId, updated);
    return updated;
  }

  async delete(goalId: string, userId: string): Promise<boolean> {
    if (isDatabaseAvailable) {
      try {
        await prisma.goal.delete({
          where: { id: goalId, userId }
        });
        inMemoryGoals.delete(goalId);
        return true;
      } catch {
        isDatabaseAvailable = false;
      }
    }

    const existing = inMemoryGoals.get(goalId);
    if (!existing || existing.userId !== userId) {
      return false;
    }

    inMemoryGoals.delete(goalId);
    return true;
  }

  clearInMemory(): void {
    inMemoryGoals.clear();
  }
}

export const goalRepository = new GoalRepository();
