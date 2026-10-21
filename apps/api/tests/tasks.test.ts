import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { taskRepository } from "../src/lib/taskRepository";
import { goalRepository } from "../src/lib/goalRepository";

describe("Tasks API & Historical Audit Trail Integration", () => {
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
    goalRepository.clearInMemory();
  });

  it("should reject unauthenticated requests with 401 UNAUTHORIZED", async () => {
    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(401);
  });

  it("should create a task and link it to an owned goal", async () => {
    // 1. Create a goal for userA
    const goalRes = await request(app)
      .post("/api/goals")
      .set("x-test-user-id", userA.id)
      .set("x-test-user-email", userA.email)
      .send({
        title: "Deep Work Mastery",
        priority: "HIGH"
      });
    const goalId = goalRes.body.data.id;

    // 2. Create task linked to goal
    const taskRes = await request(app)
      .post("/api/tasks")
      .set("x-test-user-id", userA.id)
      .set("x-test-user-email", userA.email)
      .send({
        title: "2-Hour Deep Code Block",
        scheduledDate: "2026-10-15",
        goalId,
        estimatedMinutes: 120,
        isRequiredForUnlock: true
      });

    expect(taskRes.status).toBe(201);
    expect(taskRes.body.data).toMatchObject({
      title: "2-Hour Deep Code Block",
      scheduledDate: "2026-10-15",
      originalScheduledDate: "2026-10-15",
      goalId,
      status: "PLANNED",
      isRequiredForUnlock: true,
      rescheduleCount: 0
    });
    expect(taskRes.body.data.auditEvents).toHaveLength(1);
    expect(taskRes.body.data.auditEvents[0].eventType).toBe("CREATED");
  });

  it("should prevent linking a task to a goal owned by a different user", async () => {
    // User B creates a goal
    const goalRes = await request(app)
      .post("/api/goals")
      .set("x-test-user-id", userB.id)
      .set("x-test-user-email", userB.email)
      .send({ title: "User B Private Goal", priority: "MEDIUM" });

    const userBGoalId = goalRes.body.data.id;

    // User A tries to create task linked to User B's goal
    const taskRes = await request(app)
      .post("/api/tasks")
      .set("x-test-user-id", userA.id)
      .set("x-test-user-email", userA.email)
      .send({
        title: "User A Intrusion Task",
        scheduledDate: "2026-10-15",
        goalId: userBGoalId
      });

    expect(taskRes.status).toBe(404);
  });

  it("should complete and reopen a task with immutable audit events", async () => {
    // Create task
    const createRes = await request(app)
      .post("/api/tasks")
      .set("x-test-user-id", userA.id)
      .set("x-test-user-email", userA.email)
      .send({
        title: "Morning Routine",
        scheduledDate: "2026-10-15"
      });
    const taskId = createRes.body.data.id;

    // Complete task
    const completeRes = await request(app)
      .post(`/api/tasks/${taskId}/complete`)
      .set("x-test-user-id", userA.id)
      .set("x-test-user-email", userA.email);

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.data.status).toBe("COMPLETED");
    expect(completeRes.body.data.completedAt).toBeDefined();

    // Reopen task
    const reopenRes = await request(app)
      .post(`/api/tasks/${taskId}/reopen`)
      .set("x-test-user-id", userA.id)
      .set("x-test-user-email", userA.email)
      .send({ reason: "Accidental tap; task needs review" });

    expect(reopenRes.status).toBe(200);
    expect(reopenRes.body.data.status).toBe("PLANNED");
    expect(reopenRes.body.data.reopenedAt).toBeDefined();

    // Verify full audit log
    const getRes = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set("x-test-user-id", userA.id)
      .set("x-test-user-email", userA.email);

    const eventTypes = getRes.body.data.auditEvents.map((e: any) => e.eventType);
    expect(eventTypes).toContain("CREATED");
    expect(eventTypes).toContain("COMPLETED");
    expect(eventTypes).toContain("REOPENED");
  });

  it("should reschedule a task without rewriting originalScheduledDate", async () => {
    // Create task for Oct 15
    const createRes = await request(app)
      .post("/api/tasks")
      .set("x-test-user-id", userA.id)
      .set("x-test-user-email", userA.email)
      .send({
        title: "Architecture Review",
        scheduledDate: "2026-10-15"
      });
    const taskId = createRes.body.data.id;

    // Reschedule to Oct 17 with mandatory reason
    const rescheduleRes = await request(app)
      .post(`/api/tasks/${taskId}/reschedule`)
      .set("x-test-user-id", userA.id)
      .set("x-test-user-email", userA.email)
      .send({
        newDate: "2026-10-17",
        reason: "Waiting for RFC approval from stakeholders"
      });

    expect(rescheduleRes.status).toBe(200);
    expect(rescheduleRes.body.data.scheduledDate).toBe("2026-10-17");
    // CRITICAL: originalScheduledDate must NOT be rewritten!
    expect(rescheduleRes.body.data.originalScheduledDate).toBe("2026-10-15");
    expect(rescheduleRes.body.data.rescheduleCount).toBe(1);
    expect(rescheduleRes.body.data.rescheduledToDate).toBe("2026-10-17");

    const latestAudit = rescheduleRes.body.data.auditEvents.find(
      (e: any) => e.eventType === "RESCHEDULED"
    );
    expect(latestAudit).toBeDefined();
    expect(latestAudit.previousDate).toBe("2026-10-15");
    expect(latestAudit.newDate).toBe("2026-10-17");
    expect(latestAudit.reason).toBe("Waiting for RFC approval from stakeholders");
  });

  it("should reject rescheduling if reason is omitted or too short", async () => {
    const createRes = await request(app)
      .post("/api/tasks")
      .set("x-test-user-id", userA.id)
      .set("x-test-user-email", userA.email)
      .send({ title: "Short Test Task", scheduledDate: "2026-10-15" });

    const taskId = createRes.body.data.id;

    const res = await request(app)
      .post(`/api/tasks/${taskId}/reschedule`)
      .set("x-test-user-id", userA.id)
      .set("x-test-user-email", userA.email)
      .send({
        newDate: "2026-10-16",
        reason: "no" // Less than 3 chars
      });

    expect(res.status).toBe(400);
  });

  it("should enforce tenant isolation (User B cannot read, complete, or reschedule User A's task)", async () => {
    const createRes = await request(app)
      .post("/api/tasks")
      .set("x-test-user-id", userA.id)
      .set("x-test-user-email", userA.email)
      .send({ title: "User A Secret Task", scheduledDate: "2026-10-15" });

    const taskId = createRes.body.data.id;

    // User B tries to read
    const getRes = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set("x-test-user-id", userB.id)
      .set("x-test-user-email", userB.email);
    expect(getRes.status).toBe(404);

    // User B tries to complete
    const completeRes = await request(app)
      .post(`/api/tasks/${taskId}/complete`)
      .set("x-test-user-id", userB.id)
      .set("x-test-user-email", userB.email);
    expect(completeRes.status).toBe(404);

    // User B tries to reschedule
    const rescheduleRes = await request(app)
      .post(`/api/tasks/${taskId}/reschedule`)
      .set("x-test-user-id", userB.id)
      .set("x-test-user-email", userB.email)
      .send({ newDate: "2026-10-20", reason: "Malicious attempt" });
    expect(rescheduleRes.status).toBe(404);

    // User B tries to delete
    const deleteRes = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set("x-test-user-id", userB.id)
      .set("x-test-user-email", userB.email);
    expect(deleteRes.status).toBe(404);
  });

  it("should generate a historical daily report accurately from tasks and audit logs", async () => {
    const today = new Date().toISOString().slice(0, 10);

    // Task 1: completed today
    const t1 = await request(app)
      .post("/api/tasks")
      .set("x-test-user-id", userA.id)
      .set("x-test-user-email", userA.email)
      .send({ title: "Task 1", scheduledDate: today });

    await request(app)
      .post(`/api/tasks/${t1.body.data.id}/complete`)
      .set("x-test-user-id", userA.id)
      .set("x-test-user-email", userA.email);

    // Task 2: planned today, left pending
    await request(app)
      .post("/api/tasks")
      .set("x-test-user-id", userA.id)
      .set("x-test-user-email", userA.email)
      .send({ title: "Task 2", scheduledDate: today });

    const reportRes = await request(app)
      .get(`/api/reports/daily?date=${today}&timezone=UTC`)
      .set("x-test-user-id", userA.id)
      .set("x-test-user-email", userA.email);

    expect(reportRes.status).toBe(200);
    expect(reportRes.body.data).toMatchObject({
      date: today,
      plannedCount: 2,
      completedCount: 1,
      pendingCount: 1,
      completionRatePercent: 50
    });
  });
});
