import {
  UserProfile,
  UpdateProfileInput,
  UpdateProfileSchema
} from "@truenorth/shared";
import { userRepository } from "../lib/userRepository";
import { goalRepository } from "../lib/goalRepository";
import { taskRepository } from "../lib/taskRepository";
import { thoughtRepository } from "../lib/thoughtRepository";
import { focusLockRepository } from "../lib/focusLockRepository";
import { logger } from "../lib/logger";

export class UserServiceError extends Error {
  constructor(public code: string, message: string, public statusCode: number = 400) {
    super(message);
    this.name = "UserServiceError";
  }
}

export class UserService {
  /**
   * Retrieves user profile by ID, initializing it if absent.
   */
  async getProfile(userId: string, defaultEmail?: string): Promise<UserProfile> {
    let profile = await userRepository.findById(userId);

    if (!profile && defaultEmail) {
      logger.info("Initializing first-time profile for authenticated user", { userId });
      profile = await userRepository.upsert({
        id: userId,
        email: defaultEmail
      });
    }

    if (!profile) {
      throw new UserServiceError("USER_NOT_FOUND", "User profile not found", 404);
    }

    return profile;
  }

  /**
   * Synchronizes user authenticated from Supabase Auth into backend store.
   */
  async syncUser(userId: string, email: string, displayName?: string): Promise<UserProfile> {
    if (!userId || !email) {
      throw new UserServiceError("INVALID_INPUT", "userId and email are required to sync user");
    }

    return userRepository.upsert({
      id: userId,
      email,
      displayName
    });
  }

  /**
   * Updates user profile with strict input validation and personal values limits.
   */
  async updateProfile(
    userId: string,
    rawInput: unknown,
    defaultEmail?: string
  ): Promise<UserProfile> {
    // Validate schema
    const input: UpdateProfileInput = UpdateProfileSchema.parse(rawInput);

    // Personal Values business constraints
    if (input.personalValues !== undefined) {
      if (input.personalValues.length > 10) {
        throw new UserServiceError(
          "VALUES_LIMIT_EXCEEDED",
          "You can define a maximum of 10 personal values",
          400
        );
      }

      // Check for empty or whitespace-only values
      const cleaned = input.personalValues.map((v) => v.trim()).filter((v) => v.length > 0);
      if (cleaned.length !== input.personalValues.length) {
        throw new UserServiceError(
          "INVALID_PERSONAL_VALUE",
          "Personal values cannot be empty or pure whitespace",
          400
        );
      }

      input.personalValues = Array.from(new Set(cleaned)); // Remove duplicates
    }

    const updated = await userRepository.update(userId, input, defaultEmail);
    logger.info("Updated user profile", {
      userId,
      faithModeEnabled: updated.faithModeEnabled,
      valuesCount: updated.personalValues.length
    });

    return updated;
  }

  /**
   * GDPR/CCPA compliant cascading account purge.
   * Permanently purges user row, goals, tasks, audit trails, thoughts, and focus policies.
   */
  async deleteAccount(userId: string): Promise<void> {
    // 1. Cascading purge across all repositories
    await goalRepository.purgeByUserId(userId);
    await taskRepository.purgeByUserId(userId);
    await thoughtRepository.purgeByUserId(userId);
    await focusLockRepository.purgeByUserId(userId);

    // 2. Delete user profile record
    await userRepository.delete(userId);

    // 3. Privacy-safe log
    logger.info("Purged user account and cascaded data deletion", { userId });
  }
}

export const userService = new UserService();
