import { z } from "zod";
import { TaskResponseSchema } from "./tasks";

export const DailyReportSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  totalTasks: z.number().int().nonnegative(),
  completedCount: z.number().int().nonnegative(),
  pendingCount: z.number().int().nonnegative(),
  rescheduledCount: z.number().int().nonnegative(),
  plannedCount: z.number().int().nonnegative(),
  completionRatePercent: z.number().min(0).max(100),
  tasks: z.array(TaskResponseSchema),
  thoughtsLoggedCount: z.number().int().nonnegative(),
  focusLockSessionsCount: z.number().int().nonnegative()
});

export type DailyReport = z.infer<typeof DailyReportSchema>;
