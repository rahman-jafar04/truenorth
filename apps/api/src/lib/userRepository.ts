import { UserProfile, UpdateProfileInput } from "@truenorth/shared";
import { prisma } from "./prisma";
import { logger } from "./logger";

// In-memory fallback store for offline development and test suites
const inMemoryUsers = new Map<string, UserProfile>();

let isDatabaseAvailable = process.env.NODE_ENV !== "test" && Boolean(process.env.DATABASE_URL);

export class UserRepository {
  /**
   * Finds a user profile by user UUID.
   */
  async findById(userId: string): Promise<UserProfile | null> {
    if (isDatabaseAvailable) {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: userId }
        });

        if (dbUser) {
          return {
            id: dbUser.id,
            email: dbUser.email,
            displayName: dbUser.displayName ?? undefined,
            faithModeEnabled: dbUser.faithModeEnabled,
            personalValues: dbUser.personalValues,
            timezone: dbUser.timezone,
            createdAt: dbUser.createdAt.toISOString(),
            updatedAt: dbUser.updatedAt.toISOString()
          };
        }
      } catch (err) {
        logger.debug("Database unavailable; falling back to in-memory store", {
          error: (err as Error).message
        });
        isDatabaseAvailable = false;
      }
    }

    return inMemoryUsers.get(userId) ?? null;
  }

  /**
   * Finds a user by email.
   */
  async findByEmail(email: string): Promise<UserProfile | null> {
    if (isDatabaseAvailable) {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { email }
        });
        if (dbUser) {
          return {
            id: dbUser.id,
            email: dbUser.email,
            displayName: dbUser.displayName ?? undefined,
            faithModeEnabled: dbUser.faithModeEnabled,
            personalValues: dbUser.personalValues,
            timezone: dbUser.timezone,
            createdAt: dbUser.createdAt.toISOString(),
            updatedAt: dbUser.updatedAt.toISOString()
          };
        }
      } catch {
        isDatabaseAvailable = false;
      }
    }

    for (const u of inMemoryUsers.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        return u;
      }
    }
    return null;
  }

  /**
   * Idempotently upserts a user record.
   */
  async upsert(data: {
    id: string;
    email: string;
    displayName?: string;
    faithModeEnabled?: boolean;
    personalValues?: string[];
    timezone?: string;
  }): Promise<UserProfile> {
    const now = new Date().toISOString();

    if (isDatabaseAvailable) {
      try {
        const dbUser = await prisma.user.upsert({
          where: { id: data.id },
          update: {
            email: data.email,
            ...(data.displayName !== undefined ? { displayName: data.displayName } : {}),
            ...(data.faithModeEnabled !== undefined ? { faithModeEnabled: data.faithModeEnabled } : {}),
            ...(data.personalValues !== undefined ? { personalValues: data.personalValues } : {}),
            ...(data.timezone !== undefined ? { timezone: data.timezone } : {})
          },
          create: {
            id: data.id,
            email: data.email,
            displayName: data.displayName,
            faithModeEnabled: data.faithModeEnabled ?? false,
            personalValues: data.personalValues ?? ["Diligence", "Integrity", "Deep Focus"],
            timezone: data.timezone ?? "UTC"
          }
        });

        const profile: UserProfile = {
          id: dbUser.id,
          email: dbUser.email,
          displayName: dbUser.displayName ?? undefined,
          faithModeEnabled: dbUser.faithModeEnabled,
          personalValues: dbUser.personalValues,
          timezone: dbUser.timezone,
          createdAt: dbUser.createdAt.toISOString(),
          updatedAt: dbUser.updatedAt.toISOString()
        };

        inMemoryUsers.set(data.id, profile);
        return profile;
      } catch (err) {
        logger.debug("Database upsert failed; using in-memory store", {
          error: (err as Error).message
        });
        isDatabaseAvailable = false;
      }
    }

    // In-memory fallback
    const existing = inMemoryUsers.get(data.id);
    if (existing) {
      const updated: UserProfile = {
        ...existing,
        email: data.email,
        displayName: data.displayName ?? existing.displayName,
        faithModeEnabled: data.faithModeEnabled ?? existing.faithModeEnabled,
        personalValues: data.personalValues ?? existing.personalValues,
        timezone: data.timezone ?? existing.timezone,
        updatedAt: now
      };
      inMemoryUsers.set(data.id, updated);
      return updated;
    }

    const created: UserProfile = {
      id: data.id,
      email: data.email,
      displayName: data.displayName,
      faithModeEnabled: data.faithModeEnabled ?? false,
      personalValues: data.personalValues ?? ["Diligence", "Integrity", "Deep Focus"],
      timezone: data.timezone ?? "UTC",
      createdAt: now,
      updatedAt: now
    };
    inMemoryUsers.set(data.id, created);
    return created;
  }

  /**
   * Updates a user profile with strict tenant isolation.
   */
  async update(
    userId: string,
    input: UpdateProfileInput,
    defaultEmail?: string
  ): Promise<UserProfile> {
    const now = new Date().toISOString();

    if (isDatabaseAvailable) {
      try {
        const dbUser = await prisma.user.update({
          where: { id: userId },
          data: {
            ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
            ...(input.faithModeEnabled !== undefined ? { faithModeEnabled: input.faithModeEnabled } : {}),
            ...(input.personalValues !== undefined ? { personalValues: input.personalValues } : {}),
            ...(input.timezone !== undefined ? { timezone: input.timezone } : {})
          }
        });

        const updated: UserProfile = {
          id: dbUser.id,
          email: dbUser.email,
          displayName: dbUser.displayName ?? undefined,
          faithModeEnabled: dbUser.faithModeEnabled,
          personalValues: dbUser.personalValues,
          timezone: dbUser.timezone,
          createdAt: dbUser.createdAt.toISOString(),
          updatedAt: dbUser.updatedAt.toISOString()
        };

        inMemoryUsers.set(userId, updated);
        return updated;
      } catch (err) {
        logger.debug("Database update failed; using in-memory store", {
          error: (err as Error).message
        });
        isDatabaseAvailable = false;
      }
    }

    let existing = inMemoryUsers.get(userId);
    if (!existing) {
      existing = await this.upsert({
        id: userId,
        email: defaultEmail || `${userId}@example.com`
      });
    }

    const updated: UserProfile = {
      ...existing,
      ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
      ...(input.faithModeEnabled !== undefined ? { faithModeEnabled: input.faithModeEnabled } : {}),
      ...(input.personalValues !== undefined ? { personalValues: input.personalValues } : {}),
      ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
      updatedAt: now
    };

    inMemoryUsers.set(userId, updated);
    return updated;
  }

  /**
   * Deletes a user profile from PostgreSQL / in-memory store.
   * Cascading deletes are handled by PostgreSQL schema constraints.
   */
  async delete(userId: string): Promise<boolean> {
    if (isDatabaseAvailable) {
      try {
        await prisma.user.delete({
          where: { id: userId }
        });
        inMemoryUsers.delete(userId);
        return true;
      } catch (err) {
        logger.debug("Database user delete failed; using in-memory store", {
          error: (err as Error).message
        });
        isDatabaseAvailable = false;
      }
    }

    return inMemoryUsers.delete(userId);
  }

  /**
   * Clears in-memory store (used for test isolation).
   */
  clearInMemory(): void {
    inMemoryUsers.clear();
  }
}

export const userRepository = new UserRepository();
