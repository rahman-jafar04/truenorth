import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { taskRepository } from "../src/lib/taskRepository";
import { thoughtRepository } from "../src/lib/thoughtRepository";
import { taskService } from "../src/services/taskService";

describe("Historical Analytics & Reports Integration", () => {
  const app = createApp();

  const userA = {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    email: "userA@example.com"
  };

  const userB = {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    email: "userB@example.com"
  };

  beforeEach(() => {
    taskRepository.clearInMemory();
    thoughtRepository.clearInMemory();
  });

  describe("Authentication", () => {
    it("should reject unauthenticated request to /api/reports/daily with 401", async () => {
      const res = await request(app).get("/api/reports/daily");
      expect(res.status).toBe(401);
    });

    it("should reject unauthenticated request to /api/reports/calendar with 401", async () => {
      const res = await request(app).get("/api/reports/calendar");
      expect(res.status).toBe(401);
    });
  });

  describe("Daily Report Accuracy & Thoughts Aggregation", () => {
    it("should generate a historically accurate daily report combining tasks and thoughts", async () => {
      const testDate = "2026-10-15";

      // 1. Create two tasks for testDate
      const task1 = await taskService.createTask(userA.id, {
        title: "Task One",
        scheduledDate: testDate
      });
      await taskService.createTask(userA.id, {
        title: "Task Two",
        scheduledDate: testDate
      });

      // 2. Complete task 1 with historical timestamp
      const completedTask1 = await taskService.completeTask(task1.id, userA.id);
      completedTask1.completedAt = `${testDate}T11:00:00.000Z`;
      if (completedTask1.auditEvents && completedTask1.auditEvents.length > 0) {
        completedTask1.auditEvents[completedTask1.auditEvents.length - 1].createdAt = `${testDate}T11:00:00.000Z`;
      }
      await taskRepository.save(completedTask1);

      // 3. Record thoughts on testDate
      const thought1 = await thoughtRepository.create(userA.id, {
        content: "Feeling disciplined and making steady progress.",
        contextTag: "Work"
      });
      (thought1 as any).createdAt = `${testDate}T10:00:00.000Z`;

      const thought2 = await thoughtRepository.create(userA.id, {
        content: "Reflecting on prioritizing high-leverage milestones.",
        contextTag: "Review"
      });
      (thought2 as any).createdAt = `${testDate}T14:30:00.000Z`;

      // 4. Fetch daily report for testDate
      const res = await request(app)
        .get(`/api/reports/daily?date=${testDate}&timezone=UTC`)
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email);

      expect(res.status).toBe(200);
      const report = res.body.data;
      expect(report.date).toBe(testDate);
      expect(report.plannedCount).toBe(2);
      expect(report.completedCount).toBe(1);
      expect(report.pendingCount).toBe(1);
      expect(report.completionRatePercent).toBe(50);
      expect(report.thoughtsLoggedCount).toBe(2);
      expect(report.tasks).toHaveLength(2);
    });

    it("should reflect hard thought deletion by updating thoughts count in daily report", async () => {
      const testDate = "2026-10-15";

      // 1. Create a thought on testDate
      const thought = await thoughtRepository.create(userA.id, {
        content: "Temporary personal observation."
      });
      (thought as any).createdAt = `${testDate}T12:00:00.000Z`;

      // Verify count is 1
      const resBefore = await request(app)
        .get(`/api/reports/daily?date=${testDate}&timezone=UTC`)
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email);

      expect(resBefore.body.data.thoughtsLoggedCount).toBe(1);

      // Delete the thought permanently
      await request(app)
        .delete(`/api/thoughts/${thought.id}`)
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email);

      // Verify count is now 0
      const resAfter = await request(app)
        .get(`/api/reports/daily?date=${testDate}&timezone=UTC`)
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email);

      expect(resAfter.body.data.thoughtsLoggedCount).toBe(0);
    });
  });

  describe("Timezone Boundary Resolution", () => {
    it("should resolve daily thoughts and task events to the user's local timezone", async () => {
      // Thought created at 2026-10-15T23:30:00Z:
      // In UTC: 2026-10-15
      // In Asia/Kolkata (UTC+5:30): 2026-10-16 at 05:00 AM
      const thought = await thoughtRepository.create(userA.id, {
        content: "Late night thought across midnight boundary."
      });
      (thought as any).createdAt = "2026-10-15T23:30:00.000Z";

      // Query UTC report for 2026-10-15 -> Should contain the thought
      const resUtc = await request(app)
        .get("/api/reports/daily?date=2026-10-15&timezone=UTC")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email);

      expect(resUtc.body.data.thoughtsLoggedCount).toBe(1);

      // Query Kolkata report for 2026-10-15 -> Should NOT contain the thought (it occurred on 2026-10-16)
      const resKolkataDay15 = await request(app)
        .get("/api/reports/daily?date=2026-10-15&timezone=Asia/Kolkata")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email);

      expect(resKolkataDay15.body.data.thoughtsLoggedCount).toBe(0);

      // Query Kolkata report for 2026-10-16 -> Should contain the thought
      const resKolkataDay16 = await request(app)
        .get("/api/reports/daily?date=2026-10-16&timezone=Asia/Kolkata")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email);

      expect(resKolkataDay16.body.data.thoughtsLoggedCount).toBe(1);
    });
  });

  describe("Calendar Analytics & Streaks", () => {
    it("should calculate multi-day calendar analytics, streaks, and completion rates", async () => {
      // Setup consecutive days with completed tasks:
      // 2026-10-10: 1 planned, 1 completed
      const t1 = await taskService.createTask(userA.id, {
        title: "Day 1 Task",
        scheduledDate: "2026-10-10"
      });
      const c1 = await taskService.completeTask(t1.id, userA.id);
      c1.completedAt = "2026-10-10T12:00:00.000Z";
      if (c1.auditEvents && c1.auditEvents.length > 0) {
        c1.auditEvents[c1.auditEvents.length - 1].createdAt = "2026-10-10T12:00:00.000Z";
      }
      await taskRepository.save(c1);

      // 2026-10-11: 1 planned, 1 completed
      const t2 = await taskService.createTask(userA.id, {
        title: "Day 2 Task",
        scheduledDate: "2026-10-11"
      });
      const c2 = await taskService.completeTask(t2.id, userA.id);
      c2.completedAt = "2026-10-11T12:00:00.000Z";
      if (c2.auditEvents && c2.auditEvents.length > 0) {
        c2.auditEvents[c2.auditEvents.length - 1].createdAt = "2026-10-11T12:00:00.000Z";
      }
      await taskRepository.save(c2);

      // 2026-10-12: 1 planned, 1 completed
      const t3 = await taskService.createTask(userA.id, {
        title: "Day 3 Task",
        scheduledDate: "2026-10-12"
      });
      const c3 = await taskService.completeTask(t3.id, userA.id);
      c3.completedAt = "2026-10-12T12:00:00.000Z";
      if (c3.auditEvents && c3.auditEvents.length > 0) {
        c3.auditEvents[c3.auditEvents.length - 1].createdAt = "2026-10-12T12:00:00.000Z";
      }
      await taskRepository.save(c3);

      const res = await request(app)
        .get("/api/reports/calendar?startDate=2026-10-10&endDate=2026-10-12&timezone=UTC")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email);

      expect(res.status).toBe(200);
      const analytics = res.body.data;

      expect(analytics.startDate).toBe("2026-10-10");
      expect(analytics.endDate).toBe("2026-10-12");
      expect(analytics.days).toHaveLength(3);
      expect(analytics.totalPlannedTasks).toBe(3);
      expect(analytics.totalCompletedTasks).toBe(3);
      expect(analytics.overallCompletionRate).toBe(100);
      expect(analytics.currentStreakDays).toBe(3);
      expect(analytics.bestStreakDays).toBe(3);
    });

    it("should reject calendar query when startDate is after endDate", async () => {
      const res = await request(app)
        .get("/api/reports/calendar?startDate=2026-10-15&endDate=2026-10-10")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_DATE_RANGE");
    });
  });

  describe("Tenant Isolation", () => {
    it("should never leak daily reports or calendar analytics across tenants", async () => {
      // User A creates tasks and thoughts
      const t = await taskService.createTask(userA.id, {
        title: "User A Confidential Task",
        scheduledDate: "2026-10-14"
      });
      await taskService.completeTask(t.id, userA.id);

      await thoughtRepository.create(userA.id, {
        content: "User A Confidential Thought"
      });

      // User B requests reports for the same date
      const userBReport = await request(app)
        .get("/api/reports/daily?date=2026-10-14&timezone=UTC")
        .set("x-test-user-id", userB.id)
        .set("x-test-user-email", userB.email);

      expect(userBReport.status).toBe(200);
      expect(userBReport.body.data.plannedCount).toBe(0);
      expect(userBReport.body.data.completedCount).toBe(0);
      expect(userBReport.body.data.thoughtsLoggedCount).toBe(0);
      expect(userBReport.body.data.tasks).toHaveLength(0);

      // User B requests calendar analytics
      const userBCalendar = await request(app)
        .get("/api/reports/calendar?startDate=2026-10-10&endDate=2026-10-15&timezone=UTC")
        .set("x-test-user-id", userB.id)
        .set("x-test-user-email", userB.email);

      expect(userBCalendar.status).toBe(200);
      expect(userBCalendar.body.data.totalPlannedTasks).toBe(0);
      expect(userBCalendar.body.data.totalCompletedTasks).toBe(0);
      expect(userBCalendar.body.data.totalThoughtsCount).toBe(0);
      expect(userBCalendar.body.data.currentStreakDays).toBe(0);
    });
  });
});
