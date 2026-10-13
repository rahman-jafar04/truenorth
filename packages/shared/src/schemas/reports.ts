import { z } from "zod";
import { TaskResponseSchema } from "./tasks";

export const DailyReportSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timezone: z.string().default("UTC"),
  totalTasks: z.number().int().nonnegative(),
  completedCount: z.number().int().nonnegative(),
  pendingCount: z.number().int().nonnegative(),
  rescheduledCount: z.number().int().nonnegative(),
  reopenedCount: z.number().int().nonnegative().default(0),
  plannedCount: z.number().int().nonnegative(),
  completionRatePercent: z.number().min(0).max(100),
  tasks: z.array(TaskResponseSchema),
  thoughtsLoggedCount: z.number().int().nonnegative().default(0),
  focusLockSessionsCount: z.number().int().nonnegative().default(0)
});

export type DailyReport = z.infer<typeof DailyReportSchema>;
