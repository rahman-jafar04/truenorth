import { describe, it, expect } from "vitest";
import {
  rescheduleTask,
  reopenTask,
  completeTask,
  computeHistoricalDailyReport,
  getUserLocalDate,
  InMemoryTask
} from "../src/services/taskHistory";

describe("Historical Accuracy & Timezone Integrity", () => {
  const sampleTask: InMemoryTask = {
    id: "task-101",
    userId: "user-abc",
    title: "Finish TrueNorth Architecture Proposal",
    description: "Write RFC and implementation plan",
    originalScheduledDate: "2026-10-12",
    scheduledDate: "2026-10-12",
    status: "PLANNED",
    isRequiredForUnlock: true,
    estimatedMinutes: 60,
    completedAt: null,
    reopenedAt: null,
    rescheduleCount: 0,
    rescheduledToDate: null,
    auditEvents: [],
    createdAt: "2026-10-12T08:00:00.000Z",
    updatedAt: "2026-10-12T08:00:00.000Z"
  };

  it("should preserve originalScheduledDate and log audit event when rescheduling", () => {
    const { task: rescheduledTask, auditEvent } = rescheduleTask(
      sampleTask,
      "2026-10-13",
      "Meeting ran late; moving to tomorrow morning",
      "UTC",
      new Date("2026-10-12T18:00:00.000Z")
    );

    // Invariant: originalScheduledDate must NOT be rewritten
    expect(rescheduledTask.originalScheduledDate).toBe("2026-10-12");
    expect(rescheduledTask.scheduledDate).toBe("2026-10-13");
    expect(rescheduledTask.rescheduleCount).toBe(1);

    // Audit event must be properly recorded
    expect(auditEvent.eventType).toBe("RESCHEDULED");
    expect(auditEvent.previousDate).toBe("2026-10-12");
    expect(auditEvent.newDate).toBe("2026-10-13");
    expect(auditEvent.reason).toBe("Meeting ran late; moving to tomorrow morning");
  });

  it("should NOT silently rewrite yesterday's daily report when a task is rescheduled today", () => {
    // 1. Task originally planned on 2026-10-12
    const { task: rescheduledTask } = rescheduleTask(
      sampleTask,
      "2026-10-13",
      "Postponed to next day",
      "UTC",
      new Date("2026-10-12T20:00:00.000Z")
    );

    // 2. Query yesterday's historical report (2026-10-12)
    const yesterdayReport = computeHistoricalDailyReport([rescheduledTask], "2026-10-12", "UTC");
    expect(yesterdayReport.plannedCount).toBe(1);
    expect(yesterdayReport.rescheduledCount).toBe(1);
    expect(yesterdayReport.completedCount).toBe(0);

    // 3. Query today's report (2026-10-13)
    const todayReport = computeHistoricalDailyReport([rescheduledTask], "2026-10-13", "UTC");
    expect(todayReport.plannedCount).toBe(1);
    expect(todayReport.completedCount).toBe(0);
  });

  it("should track reopening of previously completed tasks", () => {
    // 1. Complete the task
    const { task: completedTask } = completeTask(
      sampleTask,
      new Date("2026-10-12T15:00:00.000Z")
    );
    expect(completedTask.status).toBe("COMPLETED");
    expect(completedTask.completedAt).toBeTruthy();

    // 2. Reopen the task
    const { task: reopenedTask, auditEvent: reopenEvent } = reopenTask(
      completedTask,
      "Found an omission in the plan",
      "UTC",
      new Date("2026-10-12T16:30:00.000Z")
    );

    expect(reopenedTask.status).toBe("PLANNED");
    expect(reopenedTask.completedAt).toBeNull();
    expect(reopenedTask.reopenedAt).toBeTruthy();
    expect(reopenEvent.eventType).toBe("REOPENED");
    expect(reopenedTask.auditEvents.length).toBe(2); // COMPLETED then REOPENED
  });

  it("should accurately resolve date boundaries across timezones without bleed", () => {
    // Timestamp: 2026-10-13 06:45:00 UTC
    // In UTC: 2026-10-13
    // In America/Los_Angeles (UTC-7): 2026-10-12 at 23:45
    // In Asia/Kolkata (UTC+5:30): 2026-10-13 at 12:15
    const utcTimestamp = "2026-10-13T06:45:00.000Z";

    const dateInUTC = getUserLocalDate(utcTimestamp, "UTC");
    const dateInLA = getUserLocalDate(utcTimestamp, "America/Los_Angeles");
    const dateInKolkata = getUserLocalDate(utcTimestamp, "Asia/Kolkata");

    expect(dateInUTC).toBe("2026-10-13");
    expect(dateInLA).toBe("2026-10-12");
    expect(dateInKolkata).toBe("2026-10-13");
  });
});
