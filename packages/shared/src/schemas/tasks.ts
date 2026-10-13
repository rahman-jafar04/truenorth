import { z } from "zod";

export const TaskStatusEnum = z.enum(["PLANNED", "COMPLETED", "PENDING", "RESCHEDULED"]);
export type TaskStatus = z.infer<typeof TaskStatusEnum>;

export const CreateTaskSchema = z.object({
  title: z.string().trim().min(1, "Task title is required").max(150),
  description: z.string().trim().max(1000).optional(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format"),
  goalId: z.string().uuid().optional().nullable(),
  estimatedMinutes: z.number().int().positive().max(720).optional().nullable(),
  status: TaskStatusEnum.default("PLANNED"),
  isRequiredForUnlock: z.boolean().default(false)
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

export const UpdateTaskSchema = CreateTaskSchema.partial().extend({
  completedAt: z.string().datetime().optional().nullable(),
  rescheduledToDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable()
});

export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;

export const TaskResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  goalId: z.string().uuid().nullable().optional(),
  title: z.string(),
  description: z.string().nullable().optional(),
  scheduledDate: z.string(),
  status: TaskStatusEnum,
  isRequiredForUnlock: z.boolean(),
  estimatedMinutes: z.number().nullable().optional(),
  completedAt: z.string().nullable().optional(),
  rescheduledToDate: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type TaskResponse = z.infer<typeof TaskResponseSchema>;
