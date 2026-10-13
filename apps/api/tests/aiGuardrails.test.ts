import { describe, it, expect } from "vitest";
import {
  validateAndGuardGuidance,
  AiGuidanceValidationError,
  analyzeThought
} from "../src/services/aiGuidance";
import { AiGuidanceResponse } from "@truenorth/shared";

describe("AI Guardrails & Guidance Validation", () => {
  it("should accept compliant non-shaming guidance payload", () => {
    const validData: AiGuidanceResponse = {
      categories: ["GOAL_ALIGNED", "PRODUCTIVE_REFLECTION"],
      alignmentStatus: "ALIGNED",
      directReasoning: "This action directly moves you closer to completing your high-priority project milestone.",
      recommendedActions: ["Allocate a 45-minute sprint to finish section 1."],
      nonShamingInsight: "Clear focus today builds consistency without friction.",
      faithReflection: null,
      alignmentScore: 90
    };

    const result = validateAndGuardGuidance(validData);
    expect(result.alignmentStatus).toBe("ALIGNED");
    expect(result.alignmentScore).toBe(90);
  });

  it("should REJECT guidance that violates the theological causality guardrail", () => {
    const prohibitedData: AiGuidanceResponse = {
      categories: ["VALUE_CONFLICT"],
      alignmentStatus: "MISALIGNED",
      directReasoning: "Satan made you procrastinate on this critical assignment.",
      recommendedActions: ["Pray and resist the distraction."],
      nonShamingInsight: "Reflect on this feeling.",
      faithReflection: "The devil put this negative thought in your mind.",
      alignmentScore: 20
    };

    expect(() => validateAndGuardGuidance(prohibitedData)).toThrowError(
      AiGuidanceValidationError
    );
  });

  it("should reject guidance missing required fields (Zod validation)", () => {
    const malformedData = {
      categories: ["GOAL_ALIGNED"],
      alignmentStatus: "ALIGNED"
      // Missing directReasoning, recommendedActions, etc.
    };

    expect(() => validateAndGuardGuidance(malformedData)).toThrow();
  });

  it("should produce valid fallback guidance adhering to guardrails in offline mode", async () => {
    const result = await analyzeThought({
      thought: "I think I will scroll on TikTok instead of studying for my exam.",
      faithModeEnabled: true,
      personalValues: ["Stewardship", "Integrity"]
    });

    expect(result.categories).toContain("PROCRASTINATION_IMPULSE");
    expect(result.alignmentStatus).toBe("MISALIGNED");
    expect(result.recommendedActions.length).toBeGreaterThan(0);
    expect(result.faithReflection).toBeTruthy();
    // Guardrail check: ensure no prohibited supernatural phrasing exists
    expect(result.faithReflection?.toLowerCase()).not.toContain("satan");
    expect(result.faithReflection?.toLowerCase()).not.toContain("devil");
  });
});
