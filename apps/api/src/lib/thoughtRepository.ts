import { ThoughtRecord, AiGuidanceResponse } from "@truenorth/shared";
import { prisma } from "./prisma";
import { logger } from "./logger";

const inMemoryThoughts = new Map<string, ThoughtRecord>();
let isDatabaseAvailable = process.env.NODE_ENV !== "test" && Boolean(process.env.DATABASE_URL);

export interface CreateThoughtParams {
  content: string;
  contextTag?: string | null;
  associatedGoalId?: string | null;
  guidance?: AiGuidanceResponse | null;
}

export class ThoughtRepository {
  async findByUserId(
    userId: string,
    filter?: { goalId?: string; limit?: number }
  ): Promise<ThoughtRecord[]> {
    if (isDatabaseAvailable) {
      try {
        const dbThoughts = await prisma.thought.findMany({
          where: {
            userId,
            ...(filter?.goalId ? { associatedGoalId: filter.goalId } : {})
          },
          orderBy: { createdAt: "desc" },
          take: filter?.limit ?? 50
        });

        return dbThoughts.map((t) => ({
          id: t.id,
          userId: t.userId,
          content: t.content,
          contextTag: t.contextTag,
          associatedGoalId: t.associatedGoalId,
          guidance: t.guidance as unknown as AiGuidanceResponse | null,
          createdAt: t.createdAt.toISOString()
        }));
      } catch (err) {
        logger.debug("Database findMany thoughts failed; using in-memory store", {
          error: (err as Error).message
        });
        isDatabaseAvailable = false;
      }
    }

    const results: ThoughtRecord[] = [];
    for (const t of inMemoryThoughts.values()) {
      if (t.userId === userId) {
        if (filter?.goalId && t.associatedGoalId !== filter.goalId) continue;
        results.push(t);
      }
    }

    results.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return filter?.limit ? results.slice(0, filter.limit) : results;
  }

  async findById(thoughtId: string, userId: string): Promise<ThoughtRecord | null> {
    if (isDatabaseAvailable) {
      try {
        const t = await prisma.thought.findFirst({
          where: { id: thoughtId, userId }
        });

        if (t) {
          return {
            id: t.id,
            userId: t.userId,
            content: t.content,
            contextTag: t.contextTag,
            associatedGoalId: t.associatedGoalId,
            guidance: t.guidance as unknown as AiGuidanceResponse | null,
            createdAt: t.createdAt.toISOString()
          };
        }
      } catch {
        isDatabaseAvailable = false;
      }
    }

    const thought = inMemoryThoughts.get(thoughtId);
    if (thought && thought.userId === userId) {
      return thought;
    }
    return null;
  }

  async create(userId: string, input: CreateThoughtParams): Promise<ThoughtRecord> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    if (isDatabaseAvailable) {
      try {
        const t = await prisma.thought.create({
          data: {
            id,
            userId,
            content: input.content,
            contextTag: input.contextTag ?? null,
            associatedGoalId: input.associatedGoalId ?? null,
            guidance: input.guidance ? JSON.parse(JSON.stringify(input.guidance)) : null
          }
        });

        const created: ThoughtRecord = {
          id: t.id,
          userId: t.userId,
          content: t.content,
          contextTag: t.contextTag,
          associatedGoalId: t.associatedGoalId,
          guidance: t.guidance as unknown as AiGuidanceResponse | null,
          createdAt: t.createdAt.toISOString()
        };

        inMemoryThoughts.set(created.id, created);
        return created;
      } catch (err) {
        logger.debug("Database create thought failed; using in-memory store", {
          error: (err as Error).message
        });
        isDatabaseAvailable = false;
      }
    }

    const created: ThoughtRecord = {
      id,
      userId,
      content: input.content,
      contextTag: input.contextTag ?? null,
      associatedGoalId: input.associatedGoalId ?? null,
      guidance: input.guidance ?? null,
      createdAt: now
    };

    inMemoryThoughts.set(id, created);
    return created;
  }

  async delete(thoughtId: string, userId: string): Promise<boolean> {
    if (isDatabaseAvailable) {
      try {
        await prisma.thought.delete({
          where: { id: thoughtId, userId }
        });
        inMemoryThoughts.delete(thoughtId);
        return true;
      } catch {
        isDatabaseAvailable = false;
      }
    }

    const existing = inMemoryThoughts.get(thoughtId);
    if (!existing || existing.userId !== userId) {
      return false;
    }

    inMemoryThoughts.delete(thoughtId);
    return true;
  }

  clearInMemory(): void {
    inMemoryThoughts.clear();
  }
}

export const thoughtRepository = new ThoughtRepository();
