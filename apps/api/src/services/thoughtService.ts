import {
  SubmitThoughtInput,
  SubmitThoughtSchema,
  ThoughtRecord,
  AiGuidanceResponse
} from "@truenorth/shared";
import { thoughtRepository } from "../lib/thoughtRepository";
import { userRepository } from "../lib/userRepository";
import { goalRepository } from "../lib/goalRepository";
import { analyzeThought } from "./aiGuidance";
import { logger } from "../lib/logger";

export class ThoughtServiceError extends Error {
  constructor(public code: string, message: string, public statusCode: number = 400) {
    super(message);
    this.name = "ThoughtServiceError";
  }
}

export class ThoughtService {
  async submitAndAnalyze(
    userId: string,
    rawInput: unknown
  ): Promise<{ thought: ThoughtRecord; guidance: AiGuidanceResponse }> {
    const input: SubmitThoughtInput = SubmitThoughtSchema.parse(rawInput);

    // 1. Fetch user profile for personal values and faith preference
    const userProfile = await userRepository.findById(userId);
    const personalValues = userProfile?.personalValues ?? [];
    const isFaithMode = input.includeFaithPerspective ?? userProfile?.faithModeEnabled ?? false;

    // 2. If goal linked, verify ownership and retrieve title
    let goalTitle: string | undefined;
    if (input.associatedGoalId) {
      const goal = await goalRepository.findById(input.associatedGoalId, userId);
      if (!goal) {
        throw new ThoughtServiceError(
          "GOAL_NOT_FOUND",
          "Linked goal not found or access denied",
          404
        );
      }
      goalTitle = goal.title;
    }

    // 3. Analyze through guarded engine
    const guidance = await analyzeThought({
      thought: input.rawContent,
      faithModeEnabled: isFaithMode,
      personalValues,
      goalTitle
    });

    // 4. Persist thought and guidance to repository
    const thought = await thoughtRepository.create(userId, {
      content: input.rawContent,
      contextTag: input.contextTag,
      associatedGoalId: input.associatedGoalId,
      guidance
    });

    // 5. PRIVACY: Log thought submission without exposing thought content
    logger.info("Processed thought analysis", {
      thoughtId: thought.id,
      userId,
      alignmentScore: guidance.alignmentScore,
      alignmentStatus: guidance.alignmentStatus,
      categories: guidance.categories
    });

    return { thought, guidance };
  }

  async getThoughts(
    userId: string,
    filter?: { goalId?: string; limit?: number }
  ): Promise<ThoughtRecord[]> {
    return thoughtRepository.findByUserId(userId, filter);
  }

  async getThoughtById(thoughtId: string, userId: string): Promise<ThoughtRecord> {
    const thought = await thoughtRepository.findById(thoughtId, userId);
    if (!thought) {
      throw new ThoughtServiceError("THOUGHT_NOT_FOUND", "Thought not found or access denied", 404);
    }
    return thought;
  }

  async deleteThought(thoughtId: string, userId: string): Promise<void> {
    const existing = await thoughtRepository.findById(thoughtId, userId);
    if (!existing) {
      throw new ThoughtServiceError("THOUGHT_NOT_FOUND", "Thought not found or access denied", 404);
    }

    await thoughtRepository.delete(thoughtId, userId);
    logger.info("Deleted thought record", { thoughtId, userId });
  }
}

export const thoughtService = new ThoughtService();
