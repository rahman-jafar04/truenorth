import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";

describe("Health API Integration", () => {
  const app = createApp();

  it("should return 200 OK with service metadata", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: "ok",
      service: "truenorth-api",
      version: "0.1.0"
    });
    expect(res.body.uptimeSeconds).toBeTypeOf("number");
    expect(res.body.timestamp).toBeTypeOf("string");
  });

  it("should return 404 for unknown endpoints", async () => {
    const res = await request(app).get("/api/non-existent-endpoint");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});
