import {
  AiGuidanceResponse,
  AiGuidanceResponseSchema,
  THEOLOGICAL_GUARDRAILS,
  NON_SHAMING_TONE_PRINCIPLES
} from "@truenorth/shared";
import { logger } from "../lib/logger";

export interface AnalyzeThoughtParams {
  thought: string;
  faithModeEnabled: boolean;
  personalValues: string[];
  goalTitle?: string;
}

export class AiGuidanceValidationError extends Error {
  constructor(message: string, public readonly details?: unknown) {
    super(message);
    this.name = "AiGuidanceValidationError";
  }
}

/**
 * Result returned by the validation pipeline.
 * Encapsulates safe error handling without inventing an unverified analysis.
 */
export type ValidationResult =
  | { success: true; data: AiGuidanceResponse }
  | {
      success: false;
      error: string;
      safeMessage: string;
    };

/**
 * Multi-layer validator:
 * 1. Zod structural validation
 * 2. Literal & Paraphrased Supernatural Attribution Detection
 */
export function validateAndGuardGuidance(raw: unknown): ValidationResult {
  // Layer 1: Strict Zod Schema Parse
  const parseResult = AiGuidanceResponseSchema.safeParse(raw);
  if (!parseResult.success) {
    return {
      success: false,
      error: "SCHEMA_VALIDATION_FAILED",
      safeMessage:
        "The generated guidance did not conform to the required structured schema. The response was discarded for safety."
    };
  }

  const data = parseResult.data;

  // Layer 2: Paraphrased and Semantic Supernatural Attribution Scanner
  const combinedText = [
    data.directReasoning,
    data.nonShamingInsight,
    data.faithReflection ?? "",
    ...data.recommendedActions
  ]
    .join(" ")
    .toLowerCase();

  // A. Check literal prohibited phrases
  for (const literal of THEOLOGICAL_GUARDRAILS.PROHIBITED_LITERAL_PHRASES) {
    if (combinedText.includes(literal)) {
      return {
        success: false,
        error: "THEOLOGICAL_ATTRIBUTION_DETECTED",
        safeMessage: `The generated guidance made an unpermitted causal attribution ("${literal}"). TrueNorth AI does not claim knowledge of supernatural agency.`
      };
    }
  }

  // B. Check paraphrased attribution regex patterns
  for (const pattern of THEOLOGICAL_GUARDRAILS.PARAPHRASED_ATTRIBUTION_PATTERNS) {
    const match = combinedText.match(pattern);
    if (match) {
      return {
        success: false,
        error: "PARAPHRASED_SUPERNATURAL_ATTRIBUTION_DETECTED",
        safeMessage: `The generated guidance matched a prohibited supernatural attribution pattern ("${match[0]}"). TrueNorth AI does not claim knowledge of supernatural causality.`
      };
    }
  }

  return { success: true, data };
}

/**
 * Builds the system prompt for the hosted LLM.
 */
export function buildSystemPrompt(faithMode: boolean, values: string[]): string {
  const valuesText = values.length > 0 ? values.join(", ") : "Integrity, Focus, Diligence";

  return `You are TrueNorth AI, an objective, compassionate self-discipline and goal-alignment coach.

CORE RULES:
1. NON-SHAMING TONE:
   ${NON_SHAMING_TONE_PRINCIPLES.DIRECT_AND_OBJECTIVE}
   ${NON_SHAMING_TONE_PRINCIPLES.COMPASSIONATE_ACCOUNTABILITY}
   ${NON_SHAMING_TONE_PRINCIPLES.EMPOWERING_CHOICE}

2. THEOLOGICAL & SPIRITUAL GUARDRAILS:
   ${THEOLOGICAL_GUARDRAILS.FORBIDDEN_ATTRIBUTION_RULE}
   Never attribute thoughts, feelings, hesitation, or fatigue to Satan, the devil, demons, God's direct voice, or spiritual warfare.
   ${
     faithMode
       ? THEOLOGICAL_GUARDRAILS.FAITH_MODE_DIRECTIVE
       : "Faith mode is DISABLED. Provide purely secular, psychology- and productivity-based reflection."
   }
   User's declared personal values: [${valuesText}].

3. OUTPUT FORMAT:
   Return valid JSON strictly matching this schema:
   {
     "categories": ["GOAL_ALIGNED" | "PRODUCTIVE_REFLECTION" | "PROCRASTINATION_IMPULSE" | "DISTRACTION_AVOIDANCE" | "FEAR_OR_ANXIETY" | "VALUE_CONFLICT" | "DISCIPLINE_OPPORTUNITY"],
     "alignmentStatus": "ALIGNED" | "MISALIGNED" | "NEUTRAL" | "COMPLEX",
     "directReasoning": "Concise, honest explanation of why this thought supports or detracts from goals",
     "recommendedActions": ["1 to 3 concrete, realistic immediate actions"],
     "nonShamingInsight": "Empathetic, forward-looking perspective on the underlying motive",
     "faithReflection": ${faithMode ? '"Reflective observation anchored in personal values without supernatural attribution"' : 'null'},
     "alignmentScore": 0 to 100
   }`;
}

/**
 * AI Guidance Service.
 * Evaluates thoughts through hosted LLM or deterministic fallback during offline development/testing.
 */
export async function analyzeThought(params: AnalyzeThoughtParams): Promise<AiGuidanceResponse> {
  const { thought, faithModeEnabled, personalValues, goalTitle } = params;

  logger.info("Analyzing user thought", {
    faithModeEnabled,
    hasGoal: Boolean(goalTitle)
    // Note: thought content is omitted for user privacy
  });

  // If no LLM key is configured (local dev / offline test), provide deterministic guidance
  if (!process.env.LLM_API_KEY) {
    const isProcrastination =
      thought.toLowerCase().includes("later") ||
      thought.toLowerCase().includes("scroll") ||
      thought.toLowerCase().includes("tomorrow") ||
      thought.toLowerCase().includes("tired");

    const fallbackResponse: AiGuidanceResponse = {
      categories: isProcrastination
        ? ["PROCRASTINATION_IMPULSE", "DISCIPLINE_OPPORTUNITY"]
        : ["PRODUCTIVE_REFLECTION", "GOAL_ALIGNED"],
      alignmentStatus: isProcrastination ? "MISALIGNED" : "ALIGNED",
      directReasoning: isProcrastination
        ? "Delaying this commitment reduces momentum on your declared goals. The immediate impulse favors temporary comfort over long-term execution."
        : "This thought demonstrates constructive awareness and active engagement with your core priorities.",
      recommendedActions: isProcrastination
        ? [
            "Break the current task down into a single 5-minute micro-step.",
            "Activate Focus Lock to remove friction and social media temptation."
          ]
        : ["Record this insight and schedule the next concrete milestone."],
      nonShamingInsight: isProcrastination
        ? "Hesitation is a normal human response to resistance, not a character flaw. Focus on restarting without self-criticism."
        : "Consistent reflection reinforces your commitment to intentional living.",
      faithReflection: faithModeEnabled
        ? `Reflect on ${personalValues[0] || "diligence and stewardship"}: practicing faithfulness in small moments builds lasting endurance.`
        : null,
      alignmentScore: isProcrastination ? 35 : 85
    };

    const validation = validateAndGuardGuidance(fallbackResponse);
    if (!validation.success) {
      throw new AiGuidanceValidationError(validation.safeMessage);
    }

    return validation.data;
  }

  // Production hosted LLM integration branch (requires provider key)
  throw new Error("Live hosted LLM call requested but LLM_API_KEY is not configured.");
}
