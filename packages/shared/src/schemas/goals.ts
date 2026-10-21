import { z } from "zod";

export const GoalPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export type GoalPriority = z.infer<typeof GoalPriorityEnum>;

export const GoalStatusEnum = z.enum(["ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"]);
export type GoalStatus = z.infer<typeof GoalStatusEnum>;

export const CreateGoalSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  description: z.string().trim().max(1000).optional(),
  priority: GoalPriorityEnum.default("MEDIUM"),
  targetDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  category: z.string().trim().max(50).optional()
});

export type CreateGoalInput = z.infer<typeof CreateGoalSchema>;

export const UpdateGoalSchema = CreateGoalSchema.partial().extend({
  status: GoalStatusEnum.optional()
});

export type UpdateGoalInput = z.infer<typeof UpdateGoalSchema>;

export const GoalResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable().optional(),
  priority: GoalPriorityEnum,
  status: GoalStatusEnum,
  targetDate: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type GoalResponse = z.infer<typeof GoalResponseSchema>;
