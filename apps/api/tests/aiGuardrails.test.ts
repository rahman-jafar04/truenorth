import { describe, it, expect } from "vitest";
import {
  validateAndGuardGuidance,
  analyzeThought
} from "../src/services/aiGuidance";
import { AiGuidanceResponse } from "@truenorth/shared";

describe("AI Guardrails & Semantic Paraphrase Detection", () => {
  it("should accept valid, non-shaming guidance payload", () => {
    const validData: AiGuidanceResponse = {
      categories: ["GOAL_ALIGNED", "PRODUCTIVE_REFLECTION"],
      alignmentStatus: "ALIGNED",
      directReasoning:
        "This action directly moves you closer to completing your high-priority project milestone.",
      recommendedActions: ["Allocate a 45-minute sprint to finish section 1."],
      nonShamingInsight:
        "Clear focus today builds consistency without friction or self-criticism.",
      faithReflection: null,
      alignmentScore: 90
    };

    const result = validateAndGuardGuidance(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.alignmentStatus).toBe("ALIGNED");
      expect(result.data.alignmentScore).toBe(90);
    }
  });

  it("should REJECT paraphrased supernatural attribution: 'the devil is whispering'", () => {
    const paraphrased: AiGuidanceResponse = {
      categories: ["VALUE_CONFLICT"],
      alignmentStatus: "MISALIGNED",
      directReasoning: "The devil is whispering thoughts of doubt and hesitation into your mind.",
      recommendedActions: ["Pray and resist."],
      nonShamingInsight: "Recognize this obstacle.",
      faithReflection: "Stand firm in your resolve.",
      alignmentScore: 30
    };

    const result = validateAndGuardGuidance(paraphrased);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("PARAPHRASED_SUPERNATURAL_ATTRIBUTION_DETECTED");
      expect(result.safeMessage).toContain("prohibited supernatural attribution pattern");
    }
  });

  it("should REJECT paraphrased supernatural attribution: 'demonic oppression is causing'", () => {
    const paraphrased: AiGuidanceResponse = {
      categories: ["DISTRACTION_AVOIDANCE"],
      alignmentStatus: "MISALIGNED",
      directReasoning: "Demonic oppression is causing you to avoid this hard task.",
      recommendedActions: ["Refocus on what matters."],
      nonShamingInsight: "Observe the resistance without judgment.",
      faithReflection: null,
      alignmentScore: 25
    };

    const result = validateAndGuardGuidance(paraphrased);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("PARAPHRASED_SUPERNATURAL_ATTRIBUTION_DETECTED");
    }
  });

  it("should REJECT paraphrased supernatural attribution: 'spiritual warfare is what made you'", () => {
    const paraphrased: AiGuidanceResponse = {
      categories: ["PROCRASTINATION_IMPULSE"],
      alignmentStatus: "MISALIGNED",
      directReasoning: "Spiritual warfare is what made you abandon your writing routine.",
      recommendedActions: ["Reset your schedule."],
      nonShamingInsight: "Hesitation is natural.",
      faithReflection: "Remember your commitment to truth.",
      alignmentScore: 35
    };

    const result = validateAndGuardGuidance(paraphrased);
    expect(result.success).toBe(false);
  });

  it("should REJECT claims of direct divine mandates: 'God commanded you to cancel'", () => {
    const directDivineClaim: AiGuidanceResponse = {
      categories: ["VALUE_CONFLICT"],
      alignmentStatus: "NEUTRAL",
      directReasoning: "God commanded you to specifically abandon this project today.",
      recommendedActions: ["Obey and stop working."],
      nonShamingInsight: "Peace comes from obedience.",
      faithReflection: "Follow divine instruction.",
      alignmentScore: 50
    };

    const result = validateAndGuardGuidance(directDivineClaim);
    expect(result.success).toBe(false);
  });

  it("should reject schema violations via Zod and provide a safe error", () => {
    const malformed = {
      categories: ["NOT_A_REAL_CATEGORY"],
      alignmentStatus: "ALIGNED"
    };

    const result = validateAndGuardGuidance(malformed);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("SCHEMA_VALIDATION_FAILED");
      expect(result.safeMessage).toContain("The generated guidance did not conform to the required structured schema");
    }
  });

  it("should produce valid, guarded fallback guidance adhering to non-shaming tone and values", async () => {
    const result = await analyzeThought({
      thought: "I think I will scroll on social media instead of studying.",
      faithModeEnabled: true,
      personalValues: ["Stewardship", "Integrity"]
    });

    expect(result.categories).toContain("PROCRASTINATION_IMPULSE");
    expect(result.alignmentStatus).toBe("MISALIGNED");
    expect(result.nonShamingInsight).not.toContain("lazy");
    expect(result.nonShamingInsight).not.toContain("guilt");
    expect(result.faithReflection).toBeTruthy();
    expect(result.faithReflection).toContain("Stewardship");
  });
});
