import {
  DailyReport,
  CalendarAnalytics,
  DaySummary
} from "@truenorth/shared";
import { taskRepository } from "../lib/taskRepository";
import { thoughtRepository } from "../lib/thoughtRepository";
import {
  computeHistoricalDailyReport,
  getUserLocalDate,
  InMemoryTask
} from "./taskHistory";
import { logger } from "../lib/logger";

export class ReportServiceError extends Error {
  constructor(public code: string, message: string, public statusCode: number = 400) {
    super(message);
    this.name = "ReportServiceError";
  }
}

export class ReportService {
  async getDailyReport(
    userId: string,
    targetDate: string,
    timezone: string = "UTC"
  ): Promise<DailyReport> {
    const allTasks = await taskRepository.findByUserId(userId);
    const allThoughts = await thoughtRepository.findByUserId(userId);

    const dayThoughts = allThoughts.filter(
      (t) => getUserLocalDate(t.createdAt, timezone) === targetDate
    );

    const report = computeHistoricalDailyReport(
      allTasks as InMemoryTask[],
      targetDate,
      timezone,
      dayThoughts.length
    );

    return report;
  }

  async getCalendarAnalytics(
    userId: string,
    startDate?: string,
    endDate?: string,
    timezone: string = "UTC"
  ): Promise<CalendarAnalytics> {
    const today = getUserLocalDate(new Date(), timezone);
    const resolvedEndDate = endDate || today;

    // Default to past 14 days if startDate is not provided
    let resolvedStartDate = startDate;
    if (!resolvedStartDate) {
      const endD = new Date(resolvedEndDate + "T00:00:00Z");
      const startD = new Date(endD.getTime() - 13 * 24 * 60 * 60 * 1000);
      resolvedStartDate = startD.toISOString().slice(0, 10);
    }

    if (resolvedStartDate > resolvedEndDate) {
      throw new ReportServiceError(
        "INVALID_DATE_RANGE",
        "startDate must be on or before endDate",
        400
      );
    }

    const allTasks = (await taskRepository.findByUserId(userId)) as InMemoryTask[];
    const allThoughts = await thoughtRepository.findByUserId(userId);

    // Generate list of consecutive dates [resolvedStartDate ... resolvedEndDate]
    const dateList: string[] = [];
    const curr = new Date(resolvedStartDate + "T00:00:00Z");
    const end = new Date(resolvedEndDate + "T00:00:00Z");

    while (curr <= end) {
      dateList.push(curr.toISOString().slice(0, 10));
      curr.setUTCDate(curr.getUTCDate() + 1);
    }

    const days: DaySummary[] = [];
    let totalPlannedTasks = 0;
    let totalCompletedTasks = 0;
    let totalThoughtsCount = 0;

    for (const d of dateList) {
      const dayThoughts = allThoughts.filter(
        (t) => getUserLocalDate(t.createdAt, timezone) === d
      );
      const dayReport = computeHistoricalDailyReport(
        allTasks,
        d,
        timezone,
        dayThoughts.length
      );

      totalPlannedTasks += dayReport.plannedCount;
      totalCompletedTasks += dayReport.completedCount;
      totalThoughtsCount += dayThoughts.length;

      const hasActivity =
        dayReport.plannedCount > 0 ||
        dayReport.completedCount > 0 ||
        dayReport.rescheduledCount > 0 ||
        dayThoughts.length > 0;

      days.push({
        date: d,
        plannedCount: dayReport.plannedCount,
        completedCount: dayReport.completedCount,
        rescheduledCount: dayReport.rescheduledCount,
        completionRatePercent: dayReport.completionRatePercent,
        thoughtsCount: dayThoughts.length,
        hasActivity
      });
    }

    const overallCompletionRate =
      totalPlannedTasks > 0
        ? Math.round((totalCompletedTasks / totalPlannedTasks) * 100)
        : 0;

    // Calculate current streak: consecutive active/completed days ending at or near resolvedEndDate
    let currentStreakDays = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      const day = days[i];
      // If it's today and today has no tasks completed yet, don't break streak if yesterday was completed
      if (day.date === today && day.completedCount === 0 && day.plannedCount === 0) {
        continue;
      }
      if (day.completedCount > 0) {
        currentStreakDays++;
      } else {
        break;
      }
    }

    // Calculate best streak across the entire date window
    let bestStreakDays = 0;
    let tempStreak = 0;
    for (const day of days) {
      if (day.completedCount > 0) {
        tempStreak++;
        if (tempStreak > bestStreakDays) {
          bestStreakDays = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
    }

    logger.info("Generated calendar analytics", {
      userId,
      startDate: resolvedStartDate,
      endDate: resolvedEndDate,
      daysCount: days.length,
      overallCompletionRate,
      currentStreakDays
    });

    return {
      startDate: resolvedStartDate,
      endDate: resolvedEndDate,
      timezone,
      days,
      overallCompletionRate,
      totalPlannedTasks,
      totalCompletedTasks,
      totalThoughtsCount,
      currentStreakDays,
      bestStreakDays
    };
  }
}

export const reportService = new ReportService();
