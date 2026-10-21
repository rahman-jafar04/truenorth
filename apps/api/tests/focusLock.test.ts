import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { focusLockRepository } from "../src/lib/focusLockRepository";

describe("Focus Lock Policy & Emergency Exceptions Integration", () => {
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
    focusLockRepository.clearInMemory();
  });

  describe("Authentication", () => {
    it("should reject unauthenticated requests with 401", async () => {
      const getRes = await request(app).get("/api/focus-lock/policy");
      expect(getRes.status).toBe(401);

      const putRes = await request(app).put("/api/focus-lock/policy").send({});
      expect(putRes.status).toBe(401);

      const postRes = await request(app).post("/api/focus-lock/exceptions").send({});
      expect(postRes.status).toBe(401);

      const activeRes = await request(app).get("/api/focus-lock/exceptions/active");
      expect(activeRes.status).toBe(401);
    });
  });

  describe("Policy Management", () => {
    it("should initialize default policy if none exists", async () => {
      const res = await request(app)
        .get("/api/focus-lock/policy")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.name).toBe("Daily Focus Policy");
      expect(res.body.data.requireTasksCompleted).toBe(true);
      expect(res.body.data.restrictedApps.length).toBeGreaterThan(0);
    });

    it("should update policy with custom restricted apps and strict mode", async () => {
      const res = await request(app)
        .put("/api/focus-lock/policy")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email)
        .send({
          name: "Deep Work Sprint",
          strictModeEnabled: true,
          requireTasksCompleted: true,
          restrictedApps: [
            { id: "app-1", name: "YouTube", bundleOrPackageId: "com.google.ios.youtube" }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Deep Work Sprint");
      expect(res.body.data.strictModeEnabled).toBe(true);
      expect(res.body.data.restrictedApps).toHaveLength(1);
      expect(res.body.data.restrictedApps[0].name).toBe("YouTube");
    });
  });

  describe("Emergency Exceptions", () => {
    it("should grant a valid time-limited emergency exception", async () => {
      // 1. Fetch policy to get policy ID
      const policyRes = await request(app)
        .get("/api/focus-lock/policy")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email);

      const policyId = policyRes.body.data.id;

      // 2. Request emergency exception
      const exRes = await request(app)
        .post("/api/focus-lock/exceptions")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email)
        .send({
          policyId,
          durationMinutes: 15,
          reason: "Urgent two-factor authentication code required"
        });

      expect(exRes.status).toBe(201);
      expect(exRes.body.data).toBeDefined();
      expect(exRes.body.data.durationMinutes).toBe(15);
      expect(exRes.body.data.reason).toBe("Urgent two-factor authentication code required");
      expect(new Date(exRes.body.data.expiresAt).getTime()).toBeGreaterThan(Date.now());

      // 3. Verify active exception endpoint returns it
      const activeRes = await request(app)
        .get("/api/focus-lock/exceptions/active")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email);

      expect(activeRes.status).toBe(200);
      expect(activeRes.body.data).toBeDefined();
      expect(activeRes.body.data.id).toBe(exRes.body.data.id);
    });

    it("should reject emergency exception requests exceeding 30 minutes", async () => {
      const policyRes = await request(app)
        .get("/api/focus-lock/policy")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email);

      const policyId = policyRes.body.data.id;

      const res = await request(app)
        .post("/api/focus-lock/exceptions")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email)
        .send({
          policyId,
          durationMinutes: 60, // Maximum allowed is 30
          reason: "Want to browse for an hour"
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject emergency exception with reason shorter than 5 characters", async () => {
      const policyRes = await request(app)
        .get("/api/focus-lock/policy")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email);

      const policyId = policyRes.body.data.id;

      const res = await request(app)
        .post("/api/focus-lock/exceptions")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email)
        .send({
          policyId,
          durationMinutes: 10,
          reason: "idk" // < 5 chars
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("Tenant Isolation", () => {
    it("should isolate Focus Lock policies and active exceptions between users", async () => {
      // User A creates custom policy
      await request(app)
        .put("/api/focus-lock/policy")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email)
        .send({
          name: "User A Private Strict Policy",
          strictModeEnabled: true
        });

      // User B fetches policy -> should receive default policy, not User A's
      const userBPolicy = await request(app)
        .get("/api/focus-lock/policy")
        .set("x-test-user-id", userB.id)
        .set("x-test-user-email", userB.email);

      expect(userBPolicy.status).toBe(200);
      expect(userBPolicy.body.data.name).toBe("Daily Focus Policy");
      expect(userBPolicy.body.data.strictModeEnabled).toBe(false);

      // User A gets policy ID and creates exception
      const userAPolicy = await request(app)
        .get("/api/focus-lock/policy")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email);

      await request(app)
        .post("/api/focus-lock/exceptions")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email)
        .send({
          policyId: userAPolicy.body.data.id,
          durationMinutes: 10,
          reason: "Urgent access needed"
        });

      // User B checks active exceptions -> should be null
      const userBException = await request(app)
        .get("/api/focus-lock/exceptions/active")
        .set("x-test-user-id", userB.id)
        .set("x-test-user-email", userB.email);

      expect(userBException.status).toBe(200);
      expect(userBException.body.data).toBeNull();
    });
  });
});
