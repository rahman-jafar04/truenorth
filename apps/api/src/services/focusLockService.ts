import {
  FocusLockPolicy,
  FocusLockPolicySchema,
  RequestExceptionInput,
  RequestExceptionSchema,
  FocusLockExceptionResponse
} from "@truenorth/shared";
import { focusLockRepository } from "../lib/focusLockRepository";
import { logger } from "../lib/logger";

export class FocusLockServiceError extends Error {
  constructor(public code: string, message: string, public statusCode: number = 400) {
    super(message);
    this.name = "FocusLockServiceError";
  }
}

export class FocusLockService {
  async getPolicy(userId: string): Promise<FocusLockPolicy> {
    const existing = await focusLockRepository.findPolicyByUserId(userId);
    if (existing) {
      return existing;
    }
    // Idempotently initialize default policy
    return focusLockRepository.upsertPolicy(userId, {});
  }

  async updatePolicy(userId: string, rawInput: unknown): Promise<FocusLockPolicy> {
    const partialSchema = FocusLockPolicySchema.partial();
    const input = partialSchema.parse(rawInput);

    const saved = await focusLockRepository.upsertPolicy(userId, input);
    logger.info("Updated Focus Lock policy", {
      userId,
      restrictedAppsCount: saved.restrictedApps.length,
      strictMode: saved.strictModeEnabled
    });
    return saved;
  }

  async requestException(
    userId: string,
    rawInput: unknown
  ): Promise<FocusLockExceptionResponse> {
    const input: RequestExceptionInput = RequestExceptionSchema.parse(rawInput);

    // Verify policy ownership
    const policy = await this.getPolicy(userId);
    if (policy.id && policy.id !== input.policyId) {
      throw new FocusLockServiceError(
        "POLICY_ACCESS_DENIED",
        "Policy not found or access denied",
        404
      );
    }

    const exception = await focusLockRepository.createException(
      userId,
      input.policyId,
      input.durationMinutes,
      input.reason
    );

    logger.info("Granted Focus Lock emergency exception", {
      userId,
      durationMinutes: input.durationMinutes,
      expiresAt: exception.expiresAt
    });

    return exception;
  }

  async getActiveException(userId: string): Promise<FocusLockExceptionResponse | null> {
    return focusLockRepository.findActiveException(userId);
  }
}

export const focusLockService = new FocusLockService();
