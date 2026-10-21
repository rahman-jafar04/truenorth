import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { userRepository } from "../src/lib/userRepository";

describe("User Profile & Authentication Integration", () => {
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
  });

  it("should reject unauthenticated requests to /api/profile with 401 UNAUTHORIZED", async () => {
    const res = await request(app).get("/api/profile");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("should create and fetch profile on first authenticated request", async () => {
    const res = await request(app)
      .get("/api/profile")
      .set("x-test-user-id", userA.id)
      .set("x-test-user-email", userA.email);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: userA.id,
      email: userA.email,
      faithModeEnabled: false
    });
    expect(Array.isArray(res.body.data.personalValues)).toBe(true);
  });

  it("should update personal values and toggle faith mode", async () => {
    // 1. Initial sync
    await request(app)
      .post("/api/profile/sync")
      .set("x-test-user-id", userA.id)
      .set("x-test-user-email", userA.email)
      .send({ displayName: "Brother Thomas" });

    // 2. Update profile
    const updateRes = await request(app)
      .patch("/api/profile")
      .set("x-test-user-id", userA.id)
      .set("x-test-user-email", userA.email)
      .send({
        displayName: "Thomas",
        faithModeEnabled: true,
        personalValues: ["Stewardship", "Integrity", "Patience", "Courage"],
        timezone: "America/Chicago"
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data).toMatchObject({
      displayName: "Thomas",
      faithModeEnabled: true,
      personalValues: ["Stewardship", "Integrity", "Patience", "Courage"],
      timezone: "America/Chicago"
    });

    // 3. Verify persistence
    const fetchRes = await request(app)
      .get("/api/profile")
      .set("x-test-user-id", userA.id)
      .set("x-test-user-email", userA.email);

    expect(fetchRes.body.data.personalValues).toEqual([
      "Stewardship",
      "Integrity",
      "Patience",
      "Courage"
    ]);
    expect(fetchRes.body.data.faithModeEnabled).toBe(true);
  });

  it("should enforce a strict maximum of 10 personal values", async () => {
    const elevenValues = [
      "V1", "V2", "V3", "V4", "V5",
      "V6", "V7", "V8", "V9", "V10", "V11"
    ];

    const res = await request(app)
      .patch("/api/profile")
      .set("x-test-user-id", userA.id)
      .set("x-test-user-email", userA.email)
      .send({ personalValues: elevenValues });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it("should reject empty or whitespace personal values", async () => {
    const res = await request(app)
      .patch("/api/profile")
      .set("x-test-user-id", userA.id)
      .set("x-test-user-email", userA.email)
      .send({ personalValues: ["Valid", "  ", "Also Valid"] });

    expect(res.status).toBe(400);
  });

  it("should enforce strict tenant isolation between distinct users", async () => {
    // User A sets personal values
    await request(app)
      .patch("/api/profile")
      .set("x-test-user-id", userA.id)
      .set("x-test-user-email", userA.email)
      .send({
        faithModeEnabled: true,
        personalValues: ["Discipline", "Sobriety"]
      });

    // User B initializes profile
    const userBRes = await request(app)
      .get("/api/profile")
      .set("x-test-user-id", userB.id)
      .set("x-test-user-email", userB.email);

    expect(userBRes.status).toBe(200);
    // User B should NOT have User A's values or faith mode
    expect(userBRes.body.data.id).toBe(userB.id);
    expect(userBRes.body.data.faithModeEnabled).toBe(false);
    expect(userBRes.body.data.personalValues).not.toEqual(["Discipline", "Sobriety"]);

    // User B updates their profile
    await request(app)
      .patch("/api/profile")
      .set("x-test-user-id", userB.id)
      .set("x-test-user-email", userB.email)
      .send({
        displayName: "User B Unique",
        personalValues: ["Craft", "Fitness"]
      });

    // Verify User A profile was not modified by User B
    const userAFetch = await request(app)
      .get("/api/profile")
      .set("x-test-user-id", userA.id)
      .set("x-test-user-email", userA.email);

    expect(userAFetch.body.data.personalValues).toEqual(["Discipline", "Sobriety"]);
    expect(userAFetch.body.data.displayName).not.toBe("User B Unique");
  });
});
