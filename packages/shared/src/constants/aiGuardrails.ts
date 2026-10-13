/**
 * AI Guardrails for TrueNorth
 * Defines theological boundaries, non-shaming tone principles,
 * semantic paraphrase detection rules, and analysis categories.
 */

export const THEOLOGICAL_GUARDRAILS = {
  // Absolute rule: The AI must never claim to know supernatural causality
  FORBIDDEN_ATTRIBUTION_RULE:
    "The AI must never claim to know whether Satan, God, or another supernatural entity caused a thought.",

  // Literal and semantic paraphrase patterns detecting supernatural causal attribution
  PARAPHRASED_ATTRIBUTION_PATTERNS: [
    /satan\s+(?:is\s+|was\s+|has\s+been\s+|had\s+)?(?:making|made|telling|told|putting|put|causing|caused|tempting|tempted|attacking|attacked|influencing|influenced|whispering|whispered|prompting|prompted)/i,
    /the\s+devil\s+(?:is\s+|was\s+|has\s+been\s+|had\s+)?(?:making|made|putting|put|telling|told|whispering|whispered|attacking|attacked|tempting|tempted|placing|placed|provoking|provoked)/i,
    /god\s+(?:has\s+|had\s+)?(?:told|commanded|spoke\s+to|spoken\s+to|revealed\s+to|wants|instructed)\s+you\s+to\s+(?:specifically\s+|cancel\s+|abandon\s+|do\s+|quit\s+|drop\s+)?/i,
    /demoni[cs]\s+(?:influence|attack|oppression|spirit|presence|whisper)/i,
    /spiritual\s+(?:warfare|forces|attack|battle)\s+(?:is\s+|was\s+|has\s+been\s+)?(?:what\s+)?(?:caused|made|drove|led\s+to|is\s+why)/i,
    /the\s+enemy\s+(?:is\s+|was\s+|has\s+been\s+)?(?:attacking|whispering|trying\s+to\s+stop|interfering|planting)/i,
    /(?:evil|unclean)\s+spirits?\s+(?:are|is|placed|caused)/i,
    /a\s+supernatural\s+(?:entity|force|power)\s+(?:caused|induced|compelled)/i
  ],

  PROHIBITED_LITERAL_PHRASES: [
    "satan made you",
    "the devil put this",
    "god told you to",
    "demonic influence",
    "satan is tempting you to",
    "god commanded you to",
    "the enemy wants you to",
    "god wants you to specifically"
  ],

  FAITH_MODE_DIRECTIVE:
    "In faith mode, focus on constructive reflection against the user's defined personal and spiritual values (e.g., patience, integrity, stewardship, charity). Offer humble, non-dogmatic encouragement without claiming direct divine authority or attributing thoughts to supernatural agents."
} as const;

export const NON_SHAMING_TONE_PRINCIPLES = {
  DIRECT_AND_OBJECTIVE:
    "Provide clear, direct, and candid analysis of alignment without ambiguity.",
  COMPASSIONATE_ACCOUNTABILITY:
    "Never use shame, condemnation, contempt, or guilt-inducing rhetoric. Acknowledge human struggles with empathy and immediately pivot toward practical, actionable next steps.",
  EMPOWERING_CHOICE:
    "Frame recommendations as autonomous decisions the user can make today to regain alignment with their declared goals."
} as const;

export const THOUGHT_CATEGORIES = [
  "GOAL_ALIGNED",
  "PRODUCTIVE_REFLECTION",
  "PROCRASTINATION_IMPULSE",
  "DISTRACTION_AVOIDANCE",
  "FEAR_OR_ANXIETY",
  "VALUE_CONFLICT",
  "DISCIPLINE_OPPORTUNITY"
] as const;

export type ThoughtCategory = (typeof THOUGHT_CATEGORIES)[number];
