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

export const DaySummarySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  plannedCount: z.number().int().nonnegative(),
  completedCount: z.number().int().nonnegative(),
  rescheduledCount: z.number().int().nonnegative(),
  completionRatePercent: z.number().min(0).max(100),
  thoughtsCount: z.number().int().nonnegative(),
  hasActivity: z.boolean()
});

export type DaySummary = z.infer<typeof DaySummarySchema>;

export const CalendarAnalyticsSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timezone: z.string(),
  days: z.array(DaySummarySchema),
  overallCompletionRate: z.number().min(0).max(100),
  totalPlannedTasks: z.number().int().nonnegative(),
  totalCompletedTasks: z.number().int().nonnegative(),
  totalThoughtsCount: z.number().int().nonnegative(),
  currentStreakDays: z.number().int().nonnegative(),
  bestStreakDays: z.number().int().nonnegative()
});

export type CalendarAnalytics = z.infer<typeof CalendarAnalyticsSchema>;
