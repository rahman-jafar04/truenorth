import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";

describe("Auth Middleware Verification", () => {
  const app = createApp();

  it("should reject requests without authorization header with 401 UNAUTHORIZED", async () => {
    const res = await request(app)
      .post("/api/thoughts/analyze")
      .send({ rawContent: "Testing unauthorized thought" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("should accept valid test user in test environment", async () => {
    const res = await request(app)
      .post("/api/thoughts/analyze")
      .set("x-test-user-id", "11111111-1111-1111-1111-111111111111")
      .send({
        rawContent: "I plan to work on my dissertation today for 2 hours.",
        includeFaithPerspective: false
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("categories");
    expect(res.body.data).toHaveProperty("alignmentStatus");
  });
});
