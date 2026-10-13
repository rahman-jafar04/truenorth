import { z } from "zod";

export const TaskStatusEnum = z.enum(["PLANNED", "COMPLETED", "PENDING", "RESCHEDULED"]);
export type TaskStatus = z.infer<typeof TaskStatusEnum>;

export const TaskAuditEventTypeEnum = z.enum([
  "CREATED",
  "COMPLETED",
  "REOPENED",
  "RESCHEDULED",
  "DELETED"
]);
export type TaskAuditEventType = z.infer<typeof TaskAuditEventTypeEnum>;

export const TaskAuditEventSchema = z.object({
  id: z.string().uuid(),
  taskId: z.string().uuid(),
  userId: z.string().uuid(),
  eventType: TaskAuditEventTypeEnum,
  previousStatus: TaskStatusEnum.optional().nullable(),
  newStatus: TaskStatusEnum.optional().nullable(),
  previousDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  reason: z.string().max(500).optional().nullable(),
  createdAt: z.string().datetime()
});

export type TaskAuditEvent = z.infer<typeof TaskAuditEventSchema>;

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

export const RescheduleTaskSchema = z.object({
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format"),
  reason: z.string().trim().min(3, "Reschedule reason must be at least 3 characters").max(300)
});

export type RescheduleTaskInput = z.infer<typeof RescheduleTaskSchema>;

export const ReopenTaskSchema = z.object({
  reason: z.string().trim().max(300).optional()
});

export type ReopenTaskInput = z.infer<typeof ReopenTaskSchema>;

export const UpdateTaskSchema = CreateTaskSchema.partial().extend({
  completedAt: z.string().datetime().optional().nullable(),
  reopenedAt: z.string().datetime().optional().nullable(),
  rescheduledToDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable()
});

export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;

export const TaskResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  goalId: z.string().uuid().nullable().optional(),
  title: z.string(),
  description: z.string().nullable().optional(),
  originalScheduledDate: z.string(), // Preserves original planned date
  scheduledDate: z.string(),         // Current active date
  status: TaskStatusEnum,
  isRequiredForUnlock: z.boolean(),
  estimatedMinutes: z.number().nullable().optional(),
  completedAt: z.string().nullable().optional(),
  reopenedAt: z.string().nullable().optional(),
  rescheduleCount: z.number().int().default(0),
  rescheduledToDate: z.string().nullable().optional(),
  auditEvents: z.array(TaskAuditEventSchema).optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type TaskResponse = z.infer<typeof TaskResponseSchema>;
