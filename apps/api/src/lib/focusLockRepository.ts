import {
  FocusLockPolicy,
  FocusLockExceptionResponse,
  RestrictedApp
} from "@truenorth/shared";
import { prisma } from "./prisma";
import { logger } from "./logger";

const inMemoryPolicies = new Map<string, FocusLockPolicy>();
const inMemoryExceptions = new Map<string, FocusLockExceptionResponse>();

let isDatabaseAvailable = process.env.NODE_ENV !== "test" && Boolean(process.env.DATABASE_URL);

export class FocusLockRepository {
  async findPolicyByUserId(userId: string): Promise<FocusLockPolicy | null> {
    if (isDatabaseAvailable) {
      try {
        const policy = await prisma.focusLockPolicy.findFirst({
          where: { userId }
        });

        if (policy) {
          return {
            id: policy.id,
            userId: policy.userId,
            name: policy.name,
            isActive: policy.isActive,
            restrictedApps: policy.restrictedApps as unknown as RestrictedApp[],
            requireTasksCompleted: policy.requireTasksCompleted,
            requiredTaskIds: policy.requiredTaskIds,
            scheduleStartTime: policy.scheduleStartTime,
            scheduleEndTime: policy.scheduleEndTime,
            daysOfWeek: policy.daysOfWeek,
            strictModeEnabled: policy.strictModeEnabled
          };
        }
      } catch (err) {
        logger.debug("Database find policy failed; using in-memory store", {
          error: (err as Error).message
        });
        isDatabaseAvailable = false;
      }
    }

    return inMemoryPolicies.get(userId) || null;
  }

  async upsertPolicy(userId: string, input: Partial<FocusLockPolicy>): Promise<FocusLockPolicy> {
    const defaultApps: RestrictedApp[] = [
      { id: "1", name: "Instagram", bundleOrPackageId: "com.burbn.instagram", category: "Social" },
      { id: "2", name: "TikTok", bundleOrPackageId: "com.zhiliaoapp.musically", category: "Social" },
      { id: "3", name: "Twitter / X", bundleOrPackageId: "com.atebits.Tweetie2", category: "Social" },
      { id: "4", name: "YouTube", bundleOrPackageId: "com.google.ios.youtube", category: "Entertainment" }
    ];

    if (isDatabaseAvailable) {
      try {
        const existing = await prisma.focusLockPolicy.findFirst({ where: { userId } });

        const policy = existing
          ? await prisma.focusLockPolicy.update({
              where: { id: existing.id },
              data: {
                name: input.name ?? existing.name,
                isActive: input.isActive ?? existing.isActive,
                restrictedApps: input.restrictedApps
                  ? JSON.parse(JSON.stringify(input.restrictedApps))
                  : existing.restrictedApps,
                requireTasksCompleted: input.requireTasksCompleted ?? existing.requireTasksCompleted,
                requiredTaskIds: input.requiredTaskIds ?? existing.requiredTaskIds,
                scheduleStartTime: input.scheduleStartTime !== undefined ? input.scheduleStartTime : existing.scheduleStartTime,
                scheduleEndTime: input.scheduleEndTime !== undefined ? input.scheduleEndTime : existing.scheduleEndTime,
                daysOfWeek: input.daysOfWeek ?? existing.daysOfWeek,
                strictModeEnabled: input.strictModeEnabled ?? existing.strictModeEnabled
              }
            })
          : await prisma.focusLockPolicy.create({
              data: {
                id: crypto.randomUUID(),
                userId,
                name: input.name ?? "Daily Focus Policy",
                isActive: input.isActive ?? true,
                restrictedApps: JSON.parse(JSON.stringify(input.restrictedApps ?? defaultApps)),
                requireTasksCompleted: input.requireTasksCompleted ?? true,
                requiredTaskIds: input.requiredTaskIds ?? [],
                scheduleStartTime: input.scheduleStartTime ?? null,
                scheduleEndTime: input.scheduleEndTime ?? null,
                daysOfWeek: input.daysOfWeek ?? [0, 1, 2, 3, 4, 5, 6],
                strictModeEnabled: input.strictModeEnabled ?? false
              }
            });

        const result: FocusLockPolicy = {
          id: policy.id,
          userId: policy.userId,
          name: policy.name,
          isActive: policy.isActive,
          restrictedApps: policy.restrictedApps as unknown as RestrictedApp[],
          requireTasksCompleted: policy.requireTasksCompleted,
          requiredTaskIds: policy.requiredTaskIds,
          scheduleStartTime: policy.scheduleStartTime,
          scheduleEndTime: policy.scheduleEndTime,
          daysOfWeek: policy.daysOfWeek,
          strictModeEnabled: policy.strictModeEnabled
        };

        inMemoryPolicies.set(userId, result);
        return result;
      } catch (err) {
        logger.debug("Database upsert policy failed; using in-memory store", {
          error: (err as Error).message
        });
        isDatabaseAvailable = false;
      }
    }

    const existing = inMemoryPolicies.get(userId);
    const policy: FocusLockPolicy = {
      id: existing?.id ?? crypto.randomUUID(),
      userId,
      name: input.name ?? existing?.name ?? "Daily Focus Policy",
      isActive: input.isActive ?? existing?.isActive ?? true,
      restrictedApps: input.restrictedApps ?? existing?.restrictedApps ?? defaultApps,
      requireTasksCompleted: input.requireTasksCompleted ?? existing?.requireTasksCompleted ?? true,
      requiredTaskIds: input.requiredTaskIds ?? existing?.requiredTaskIds ?? [],
      scheduleStartTime: input.scheduleStartTime !== undefined ? input.scheduleStartTime : existing?.scheduleStartTime ?? null,
      scheduleEndTime: input.scheduleEndTime !== undefined ? input.scheduleEndTime : existing?.scheduleEndTime ?? null,
      daysOfWeek: input.daysOfWeek ?? existing?.daysOfWeek ?? [0, 1, 2, 3, 4, 5, 6],
      strictModeEnabled: input.strictModeEnabled ?? existing?.strictModeEnabled ?? false
    };

    inMemoryPolicies.set(userId, policy);
    return policy;
  }

  async createException(
    userId: string,
    policyId: string,
    durationMinutes: number,
    reason: string
  ): Promise<FocusLockExceptionResponse> {
    const id = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

    if (isDatabaseAvailable) {
      try {
        const record = await prisma.focusLockException.create({
          data: {
            id,
            policyId,
            userId,
            reason,
            durationMinutes,
            grantedAt: now,
            expiresAt
          }
        });

        const created: FocusLockExceptionResponse = {
          id: record.id,
          policyId: record.policyId,
          userId: record.userId,
          reason: record.reason,
          durationMinutes: record.durationMinutes,
          grantedAt: record.grantedAt.toISOString(),
          expiresAt: record.expiresAt.toISOString()
        };

        inMemoryExceptions.set(userId, created);
        return created;
      } catch (err) {
        logger.debug("Database create exception failed; using in-memory store", {
          error: (err as Error).message
        });
        isDatabaseAvailable = false;
      }
    }

    const created: FocusLockExceptionResponse = {
      id,
      policyId,
      userId,
      reason,
      durationMinutes,
      grantedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString()
    };

    inMemoryExceptions.set(userId, created);
    return created;
  }

  async findActiveException(userId: string): Promise<FocusLockExceptionResponse | null> {
    const now = new Date();

    if (isDatabaseAvailable) {
      try {
        const record = await prisma.focusLockException.findFirst({
          where: {
            userId,
            expiresAt: { gt: now }
          },
          orderBy: { expiresAt: "desc" }
        });

        if (record) {
          return {
            id: record.id,
            policyId: record.policyId,
            userId: record.userId,
            reason: record.reason,
            durationMinutes: record.durationMinutes,
            grantedAt: record.grantedAt.toISOString(),
            expiresAt: record.expiresAt.toISOString()
          };
        }
        return null;
      } catch (err) {
        logger.debug("Database find exception failed; using in-memory store", {
          error: (err as Error).message
        });
        isDatabaseAvailable = false;
      }
    }

    const cached = inMemoryExceptions.get(userId);
    if (cached && new Date(cached.expiresAt).getTime() > now.getTime()) {
      return cached;
    }
    return null;
  }

  async purgeByUserId(userId: string): Promise<void> {
    inMemoryPolicies.delete(userId);
    inMemoryExceptions.delete(userId);
  }

  clearInMemory(): void {
    inMemoryPolicies.clear();
    inMemoryExceptions.clear();
  }
}

export const focusLockRepository = new FocusLockRepository();
