import { z } from "zod";
import { THOUGHT_CATEGORIES } from "../constants/aiGuardrails";

export const SubmitThoughtSchema = z.object({
  rawContent: z.string().trim().min(3, "Thought must be at least 3 characters").max(2000),
  contextTag: z.string().trim().max(50).optional(),
  associatedGoalId: z.string().uuid().optional().nullable(),
  includeFaithPerspective: z.boolean().optional()
});

export type SubmitThoughtInput = z.infer<typeof SubmitThoughtSchema>;

export const AiGuidanceResponseSchema = z.object({
  categories: z.array(z.enum(THOUGHT_CATEGORIES)).min(1),
  alignmentStatus: z.enum(["ALIGNED", "MISALIGNED", "NEUTRAL", "COMPLEX"]),
  directReasoning: z.string().min(10, "Direct reasoning is required"),
  recommendedActions: z.array(z.string().min(5)).min(1).max(5),
  nonShamingInsight: z.string().min(10),
  faithReflection: z.string().nullable().optional(),
  alignmentScore: z.number().int().min(0).max(100)
});

export type AiGuidanceResponse = z.infer<typeof AiGuidanceResponseSchema>;

export const ThoughtRecordSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  content: z.string(),
  contextTag: z.string().nullable().optional(),
  associatedGoalId: z.string().uuid().nullable().optional(),
  guidance: AiGuidanceResponseSchema.nullable().optional(),
  createdAt: z.string()
});

export type ThoughtRecord = z.infer<typeof ThoughtRecordSchema>;
