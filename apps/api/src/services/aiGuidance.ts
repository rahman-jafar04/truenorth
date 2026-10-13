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
  constructor(message: string) {
    super(message);
    this.name = "AiGuidanceValidationError";
  }
}

/**
 * Validates that an AI guidance payload conforms strictly to safety and schema requirements.
 */
export function validateAndGuardGuidance(data: unknown): AiGuidanceResponse {
  const parsed = AiGuidanceResponseSchema.parse(data);

  // Check the strict theological causality guardrail
  const combinedText = [
    parsed.directReasoning,
    parsed.nonShamingInsight,
    parsed.faithReflection ?? "",
    ...parsed.recommendedActions
  ]
    .join(" ")
    .toLowerCase();

  for (const prohibited of THEOLOGICAL_GUARDRAILS.PROHIBITED_PHRASES) {
    if (combinedText.includes(prohibited)) {
      throw new AiGuidanceValidationError(
        `AI response violated theological causality guardrail: contains prohibited phrase "${prohibited}".`
      );
    }
  }

  return parsed;
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
    // Notice thought content is intentionally omitted for privacy
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

    return validateAndGuardGuidance(fallbackResponse);
  }

  // Production hosted LLM integration branch will be invoked in Phase 4
  throw new Error("Live hosted LLM call requested but provider credentials require validation");
}
