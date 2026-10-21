import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { userRepository } from "../src/lib/userRepository";
import { goalRepository } from "../src/lib/goalRepository";
import { taskRepository } from "../src/lib/taskRepository";
import { thoughtRepository } from "../src/lib/thoughtRepository";
import { focusLockRepository } from "../src/lib/focusLockRepository";

describe("GDPR/CCPA Cascading Account Deletion & Privacy Verification", () => {
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
    userRepository.clearInMemory();
    goalRepository.clearInMemory();
    taskRepository.clearInMemory();
    thoughtRepository.clearInMemory();
    focusLockRepository.clearInMemory();
  });

  describe("Authentication", () => {
    it("should reject unauthenticated DELETE /api/profile with 401", async () => {
      const res = await request(app).delete("/api/profile");
      expect(res.status).toBe(401);
    });
  });

  describe("Cascading Account Purge", () => {
    it("should irreversibly purge user profile, goals, tasks, audit trails, thoughts, and focus policies", async () => {
      // 1. Setup User A's profile
      await userRepository.upsert({
        id: userA.id,
        email: userA.email,
        displayName: "User A",
        personalValues: ["Discipline", "Integrity"]
      });

      // 2. Create Goal for User A
      const goalRes = await request(app)
        .post("/api/goals")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email)
        .send({
          title: "Complete TrueNorth Monorepo",
          priority: "CRITICAL"
        });
      const goalId = goalRes.body.data.id;

      // 3. Create Task for User A
      const taskRes = await request(app)
        .post("/api/tasks")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email)
        .send({
          title: "Write final integration tests",
          scheduledDate: "2026-10-21",
          goalId
        });
      expect(taskRes.status).toBe(201);

      // 4. Create Thought for User A
      const thoughtRes = await request(app)
        .post("/api/thoughts/analyze")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email)
        .send({
          rawContent: "Reflecting on finishing Phase 7 successfully.",
          contextTag: "Milestone"
        });
      expect(thoughtRes.status).toBe(200);

      // 5. Configure Focus Lock Policy & Exception for User A
      const policyRes = await request(app)
        .put("/api/focus-lock/policy")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email)
        .send({
          name: "User A Active Shield",
          strictModeEnabled: true
        });

      await request(app)
        .post("/api/focus-lock/exceptions")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email)
        .send({
          policyId: policyRes.body.data.id,
          durationMinutes: 10,
          reason: "Emergency exception before purge"
        });

      // Verify all data is active before deletion
      const preGoals = await request(app)
        .get("/api/goals")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email);
      expect(preGoals.body.data).toHaveLength(1);

      const preTasks = await request(app)
        .get("/api/tasks")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email);
      expect(preTasks.body.data).toHaveLength(1);

      const preThoughts = await request(app)
        .get("/api/thoughts")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email);
      expect(preThoughts.body.data).toHaveLength(1);

      const preException = await request(app)
        .get("/api/focus-lock/exceptions/active")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email);
      expect(preException.body.data).toBeDefined();

      // 6. Execute Cascading Account Deletion
      const deleteRes = await request(app)
        .delete("/api/profile")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);

      // 7. Verify all cascading data has been purged
      const postGoals = await request(app)
        .get("/api/goals")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email);
      expect(postGoals.body.data).toHaveLength(0);

      const postTasks = await request(app)
        .get("/api/tasks")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email);
      expect(postTasks.body.data).toHaveLength(0);

      const postThoughts = await request(app)
        .get("/api/thoughts")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email);
      expect(postThoughts.body.data).toHaveLength(0);

      const postException = await request(app)
        .get("/api/focus-lock/exceptions/active")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email);
      expect(postException.body.data).toBeNull();
    });

    it("should preserve other tenants' data when a user purges their account", async () => {
      // Setup User B data
      await userRepository.upsert({
        id: userB.id,
        email: userB.email,
        displayName: "User B"
      });

      const userBGoal = await request(app)
        .post("/api/goals")
        .set("x-test-user-id", userB.id)
        .set("x-test-user-email", userB.email)
        .send({
          title: "User B Preserved Objective",
          priority: "HIGH"
        });

      const userBTask = await request(app)
        .post("/api/tasks")
        .set("x-test-user-id", userB.id)
        .set("x-test-user-email", userB.email)
        .send({
          title: "User B Preserved Task",
          scheduledDate: "2026-10-21"
        });

      // User A creates and purges account
      await userRepository.upsert({
        id: userA.id,
        email: userA.email
      });

      await request(app)
        .delete("/api/profile")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email);

      // Verify User B's goal and task remain completely intact
      const verifyGoal = await request(app)
        .get(`/api/goals/${userBGoal.body.data.id}`)
        .set("x-test-user-id", userB.id)
        .set("x-test-user-email", userB.email);
      expect(verifyGoal.status).toBe(200);
      expect(verifyGoal.body.data.title).toBe("User B Preserved Objective");

      const verifyTask = await request(app)
        .get(`/api/tasks/${userBTask.body.data.id}`)
        .set("x-test-user-id", userB.id)
        .set("x-test-user-email", userB.email);
      expect(verifyTask.status).toBe(200);
      expect(verifyTask.body.data.title).toBe("User B Preserved Task");
    });
  });
});
