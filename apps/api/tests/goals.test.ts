import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { goalRepository } from "../src/lib/goalRepository";

describe("Goals Integration & Ownership", () => {
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
    goalRepository.clearInMemory();
  });

  it("should reject unauthenticated requests with 401 UNAUTHORIZED", async () => {
    const res = await request(app).get("/api/goals");
    expect(res.status).toBe(401);
  });

  it("should create, list, and retrieve goals for an authenticated user", async () => {
    // 1. Create a goal
    const createRes = await request(app)
      .post("/api/goals")
      .set("x-test-user-id", userA.id)
      .set("x-test-user-email", userA.email)
      .send({
        title: "Master Mobile Engineering",
        description: "Build robust cross-platform applications",
        priority: "CRITICAL",
        category: "Career",
        targetDate: "2026-12-31"
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data).toMatchObject({
      title: "Master Mobile Engineering",
      priority: "CRITICAL",
      status: "ACTIVE",
      userId: userA.id
    });
    const goalId = createRes.body.data.id;

    // 2. List goals
    const listRes = await request(app)
      .get("/api/goals")
      .set("x-test-user-id", userA.id)
      .set("x-test-user-email", userA.email);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toHaveLength(1);
    expect(listRes.body.data[0].id).toBe(goalId);

    // 3. Get goal by ID
    const getRes = await request(app)
      .get(`/api/goals/${goalId}`)
      .set("x-test-user-id", userA.id)
      .set("x-test-user-email", userA.email);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.title).toBe("Master Mobile Engineering");
  });

  it("should update goal properties", async () => {
    const createRes = await request(app)
      .post("/api/goals")
      .set("x-test-user-id", userA.id)
      .set("x-test-user-email", userA.email)
      .send({
        title: "Daily Prayer & Reflection",
        priority: "HIGH"
      });

    const goalId = createRes.body.data.id;

    const updateRes = await request(app)
      .patch(`/api/goals/${goalId}`)
      .set("x-test-user-id", userA.id)
      .set("x-test-user-email", userA.email)
      .send({
        priority: "CRITICAL",
        status: "COMPLETED"
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.priority).toBe("CRITICAL");
    expect(updateRes.body.data.status).toBe("COMPLETED");
  });

  it("should strictly enforce tenant isolation (User B cannot access User A's goals)", async () => {
    // User A creates a goal
    const createRes = await request(app)
      .post("/api/goals")
      .set("x-test-user-id", userA.id)
      .set("x-test-user-email", userA.email)
      .send({
        title: "User A Confidential Goal",
        priority: "HIGH"
      });

    const goalId = createRes.body.data.id;

    // User B tries to read User A's goal
    const getRes = await request(app)
      .get(`/api/goals/${goalId}`)
      .set("x-test-user-id", userB.id)
      .set("x-test-user-email", userB.email);

    expect(getRes.status).toBe(404);

    // User B tries to update User A's goal
    const updateRes = await request(app)
      .patch(`/api/goals/${goalId}`)
      .set("x-test-user-id", userB.id)
      .set("x-test-user-email", userB.email)
      .send({ title: "Hacked Title" });

    expect(updateRes.status).toBe(404);

    // User B tries to delete User A's goal
    const deleteRes = await request(app)
      .delete(`/api/goals/${goalId}`)
      .set("x-test-user-id", userB.id)
      .set("x-test-user-email", userB.email);

    expect(deleteRes.status).toBe(404);

    // User B's list should not include User A's goal
    const listRes = await request(app)
      .get("/api/goals")
      .set("x-test-user-id", userB.id)
      .set("x-test-user-email", userB.email);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toHaveLength(0);
  });

  it("should reject invalid goal creation with 400 Bad Request", async () => {
    const res = await request(app)
      .post("/api/goals")
      .set("x-test-user-id", userA.id)
      .set("x-test-user-email", userA.email)
      .send({
        title: "", // Empty title
        priority: "INVALID_PRIORITY"
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});
