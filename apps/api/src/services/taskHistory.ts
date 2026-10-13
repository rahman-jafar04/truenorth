import {
  TaskResponse,
  TaskAuditEvent,
  DailyReport
} from "@truenorth/shared";

/**
 * Returns the YYYY-MM-DD date string in the user's specified timezone.
 * Handles late-night cutoff points (e.g. 23:59 UTC+5:30 vs UTC-8).
 */
export function getUserLocalDate(dateInput: Date | string, timezone: string = "UTC"): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    return formatter.format(date); // Format: YYYY-MM-DD
  } catch {
    // Fallback to UTC if timezone string is invalid
    return date.toISOString().slice(0, 10);
  }
}

export interface InMemoryTask extends TaskResponse {
  auditEvents: TaskAuditEvent[];
}

export interface PersistedDailyReportSummary extends DailyReport {
  lastEventId: string | null;
  eventCount: number;
  syncedAt: string;
}

/**
 * Reschedules a task to a future date while maintaining strict historical accuracy:
 * - Never overwrites originalScheduledDate.
 * - Leaves the previous date's historical record intact.
 * - Logs an immutable TaskAuditEvent.
 */
export function rescheduleTask(
  task: InMemoryTask,
  newDate: string,
  reason: string,
  _userTimezone: string = "UTC",
  now: Date = new Date()
): { task: InMemoryTask; auditEvent: TaskAuditEvent } {
  const previousDate = task.scheduledDate;
  const previousStatus = task.status;

  const auditEvent: TaskAuditEvent = {
    id: crypto.randomUUID(),
    taskId: task.id,
    userId: task.userId,
    eventType: "RESCHEDULED",
    previousStatus,
    newStatus: "RESCHEDULED",
    previousDate,
    newDate,
    reason,
    createdAt: now.toISOString()
  };

  const updatedTask: InMemoryTask = {
    ...task,
    scheduledDate: newDate,
    status: "PLANNED", // Planned for the new date
    rescheduledToDate: newDate,
    rescheduleCount: task.rescheduleCount + 1,
    updatedAt: now.toISOString(),
    auditEvents: [...task.auditEvents, auditEvent]
  };

  return { task: updatedTask, auditEvent };
}

/**
 * Reopens a completed task while tracking historical completion and reopen events.
 */
export function reopenTask(
  task: InMemoryTask,
  reason?: string,
  _userTimezone: string = "UTC",
  now: Date = new Date()
): { task: InMemoryTask; auditEvent: TaskAuditEvent } {
  const previousStatus = task.status;

  const auditEvent: TaskAuditEvent = {
    id: crypto.randomUUID(),
    taskId: task.id,
    userId: task.userId,
    eventType: "REOPENED",
    previousStatus,
    newStatus: "PLANNED",
    previousDate: task.scheduledDate,
    newDate: task.scheduledDate,
    reason: reason ?? "Reopened by user",
    createdAt: now.toISOString()
  };

  const updatedTask: InMemoryTask = {
    ...task,
    status: "PLANNED",
    reopenedAt: now.toISOString(),
    // Preserve completedAt in audit trail while clearing active completion status
    completedAt: null,
    updatedAt: now.toISOString(),
    auditEvents: [...task.auditEvents, auditEvent]
  };

  return { task: updatedTask, auditEvent };
}

/**
 * Completes a task, recording exact timestamp and audit event.
 */
export function completeTask(
  task: InMemoryTask,
  now: Date = new Date()
): { task: InMemoryTask; auditEvent: TaskAuditEvent } {
  const auditEvent: TaskAuditEvent = {
    id: crypto.randomUUID(),
    taskId: task.id,
    userId: task.userId,
    eventType: "COMPLETED",
    previousStatus: task.status,
    newStatus: "COMPLETED",
    previousDate: task.scheduledDate,
    newDate: task.scheduledDate,
    reason: null,
    createdAt: now.toISOString()
  };

  const updatedTask: InMemoryTask = {
    ...task,
    status: "COMPLETED",
    completedAt: now.toISOString(),
    updatedAt: now.toISOString(),
    auditEvents: [...task.auditEvents, auditEvent]
  };

  return { task: updatedTask, auditEvent };
}

/**
 * Computes a historically accurate Daily Report for any date in the user's timezone.
 * Reconstructs state from the task audit trail rather than assuming today's state matches yesterday.
 */
export function computeHistoricalDailyReport(
  allTasks: InMemoryTask[],
  targetDate: string, // YYYY-MM-DD
  userTimezone: string = "UTC"
): DailyReport {
  let plannedCount = 0;
  let completedCount = 0;
  let rescheduledCount = 0;
  let reopenedCount = 0;
  const dayTasks: TaskResponse[] = [];

  for (const task of allTasks) {
    // Check if task was active or planned for this date
    const relevantAudit = task.auditEvents.filter((ev) => {
      const eventDate = getUserLocalDate(ev.createdAt, userTimezone);
      return (
        eventDate === targetDate ||
        ev.previousDate === targetDate ||
        ev.newDate === targetDate
      );
    });

    const isOriginallyPlannedToday = task.originalScheduledDate === targetDate;
    const isCurrentlyScheduledToday = task.scheduledDate === targetDate;
    const wasRescheduledFromToday = relevantAudit.some(
      (ev) => ev.eventType === "RESCHEDULED" && ev.previousDate === targetDate
    );
    const wasCompletedToday = relevantAudit.some(
      (ev) =>
        ev.eventType === "COMPLETED" &&
        getUserLocalDate(ev.createdAt, userTimezone) === targetDate
    );
    const wasReopenedToday = relevantAudit.some(
      (ev) =>
        ev.eventType === "REOPENED" &&
        getUserLocalDate(ev.createdAt, userTimezone) === targetDate
    );

    if (isOriginallyPlannedToday || isCurrentlyScheduledToday || wasRescheduledFromToday) {
      plannedCount++;
      dayTasks.push(task);

      if (wasCompletedToday) {
        completedCount++;
      }
      if (wasRescheduledFromToday) {
        rescheduledCount++;
      }
      if (wasReopenedToday) {
        reopenedCount++;
      }
    }
  }

  const pendingCount = Math.max(0, plannedCount - completedCount - rescheduledCount);
  const completionRatePercent =
    plannedCount > 0 ? Math.round((completedCount / plannedCount) * 100) : 0;

  return {
    date: targetDate,
    timezone: userTimezone,
    totalTasks: plannedCount,
    plannedCount,
    completedCount,
    pendingCount,
    rescheduledCount,
    reopenedCount,
    completionRatePercent,
    tasks: dayTasks,
    thoughtsLoggedCount: 0,
    focusLockSessionsCount: 0
  };
}

/**
 * Syncs and verifies a persisted daily report summary with underlying immutable audit events.
 * Guarantees that any cached or persisted summary stays 100% consistent with the audit log.
 */
export function syncPersistedDailySummary(
  allTasks: InMemoryTask[],
  targetDate: string,
  userTimezone: string = "UTC",
  existingSummary?: PersistedDailyReportSummary | null
): PersistedDailyReportSummary {
  const derivedReport = computeHistoricalDailyReport(allTasks, targetDate, userTimezone);

  // Collect all audit events relevant to this date
  const relevantEvents: TaskAuditEvent[] = [];
  for (const t of allTasks) {
    for (const ev of t.auditEvents) {
      const evDate = getUserLocalDate(ev.createdAt, userTimezone);
      if (evDate === targetDate || ev.previousDate === targetDate || ev.newDate === targetDate) {
        relevantEvents.push(ev);
      }
    }
  }

  // Sort chronologically
  relevantEvents.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const lastEvent = relevantEvents[relevantEvents.length - 1];

  // If existing summary exists and matches event count and last event id, verify consistency
  if (
    existingSummary &&
    existingSummary.date === targetDate &&
    existingSummary.timezone === userTimezone &&
    existingSummary.lastEventId === (lastEvent?.id ?? null) &&
    existingSummary.eventCount === relevantEvents.length
  ) {
    return existingSummary; // Cached summary is fully valid and consistent
  }

  // Otherwise, deterministically rebuild the summary from source-of-truth events
  return {
    ...derivedReport,
    lastEventId: lastEvent?.id ?? null,
    eventCount: relevantEvents.length,
    syncedAt: new Date().toISOString()
  };
}
