import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { thoughtRepository } from "../src/lib/thoughtRepository";
import { goalRepository } from "../src/lib/goalRepository";
import { userRepository } from "../src/lib/userRepository";
import { logger } from "../src/lib/logger";
import { validateAndGuardGuidance } from "../src/services/aiGuidance";
import { AiGuidanceResponse } from "@truenorth/shared";

describe("Thought Submission & Guarded AI Guidance Integration", () => {
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
    thoughtRepository.clearInMemory();
    goalRepository.clearInMemory();
    userRepository.clearInMemory();
  });

  describe("Authentication & Authorization", () => {
    it("should reject unauthenticated requests to /api/thoughts with 401", async () => {
      const res = await request(app).get("/api/thoughts");
      expect(res.status).toBe(401);
    });

    it("should reject unauthenticated POST to /api/thoughts/analyze with 401", async () => {
      const res = await request(app)
        .post("/api/thoughts/analyze")
        .send({ rawContent: "Testing unauthorized submission" });
      expect(res.status).toBe(401);
    });
  });

  describe("Input Schema & Validation", () => {
    it("should reject thought submission with content shorter than 3 characters", async () => {
      const res = await request(app)
        .post("/api/thoughts/analyze")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email)
        .send({ rawContent: "No" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject thought submission with empty or whitespace-only content", async () => {
      const res = await request(app)
        .post("/api/thoughts/analyze")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email)
        .send({ rawContent: "     " });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("Thought Submission & AI Analysis", () => {
    it("should analyze and persist a thought with structured, non-shaming guidance", async () => {
      const res = await request(app)
        .post("/api/thoughts/analyze")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email)
        .send({
          rawContent: "I keep wanting to procrastinate and scroll social media instead of writing tests.",
          contextTag: "Work Resistance"
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.thought).toBeDefined();

      const guidance = res.body.data;
      expect(guidance.alignmentStatus).toBe("MISALIGNED");
      expect(guidance.categories).toContain("PROCRASTINATION_IMPULSE");
      expect(guidance.alignmentScore).toBeLessThan(50);
      expect(guidance.recommendedActions.length).toBeGreaterThan(0);
      expect(guidance.nonShamingInsight).toBeTruthy();
      expect(guidance.directReasoning).toBeTruthy();

      const savedThought = res.body.thought;
      expect(savedThought.userId).toBe(userA.id);
      expect(savedThought.contextTag).toBe("Work Resistance");
      expect(savedThought.content).toBe(
        "I keep wanting to procrastinate and scroll social media instead of writing tests."
      );
      expect(savedThought.guidance).toBeDefined();
    });

    it("should include faith reflection when faith perspective is explicitly enabled", async () => {
      await userRepository.upsert({
        id: userA.id,
        email: userA.email,
        personalValues: ["Stewardship", "Integrity"]
      });

      const res = await request(app)
        .post("/api/thoughts/analyze")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email)
        .send({
          rawContent: "I feel anxious about whether our launch will succeed next week.",
          contextTag: "Launch Anxiety",
          includeFaithPerspective: true
        });

      expect(res.status).toBe(200);
      expect(res.body.data.faithReflection).toBeTruthy();
      expect(typeof res.body.data.faithReflection).toBe("string");
      // Must reflect on personal values rather than supernatural causality
      expect(res.body.data.faithReflection).toContain("Stewardship");
    });

    it("should provide secular guidance when faith mode is disabled", async () => {
      const res = await request(app)
        .post("/api/thoughts/analyze")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email)
        .send({
          rawContent: "Planning my focus sprint for the morning.",
          includeFaithPerspective: false
        });

      expect(res.status).toBe(200);
      expect(res.body.data.faithReflection).toBeNull();
      expect(res.body.data.alignmentStatus).toBe("ALIGNED");
    });
  });

  describe("Goal Linkage & Ownership", () => {
    it("should successfully link a thought to a user-owned goal", async () => {
      const goal = await goalRepository.create(userA.id, {
        title: "Finish Monorepo Architecture",
        priority: "CRITICAL"
      });

      const res = await request(app)
        .post("/api/thoughts/analyze")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email)
        .send({
          rawContent: "Drafting the schema for multi-tenant isolation.",
          associatedGoalId: goal.id
        });

      expect(res.status).toBe(200);
      expect(res.body.thought.associatedGoalId).toBe(goal.id);
    });

    it("should reject thought submission linked to another user's goal with 404", async () => {
      const userBGoal = await goalRepository.create(userB.id, {
        title: "User B Private Objective",
        priority: "HIGH"
      });

      const res = await request(app)
        .post("/api/thoughts/analyze")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email)
        .send({
          rawContent: "Trying to attach to User B's goal illicitly.",
          associatedGoalId: userBGoal.id
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("GOAL_NOT_FOUND");
    });
  });

  describe("Tenant Isolation & Thought History", () => {
    it("should isolate thoughts between different users", async () => {
      // User A creates a thought
      const createRes = await request(app)
        .post("/api/thoughts/analyze")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email)
        .send({
          rawContent: "User A private thought entry."
        });

      const thoughtId = createRes.body.thought.id;

      // User A can list and retrieve it
      const userAList = await request(app)
        .get("/api/thoughts")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email);

      expect(userAList.status).toBe(200);
      expect(userAList.body.data).toHaveLength(1);
      expect(userAList.body.data[0].id).toBe(thoughtId);

      const userAGet = await request(app)
        .get(`/api/thoughts/${thoughtId}`)
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email);

      expect(userAGet.status).toBe(200);
      expect(userAGet.body.data.id).toBe(thoughtId);

      // User B cannot see it in list
      const userBList = await request(app)
        .get("/api/thoughts")
        .set("x-test-user-id", userB.id)
        .set("x-test-user-email", userB.email);

      expect(userBList.status).toBe(200);
      expect(userBList.body.data).toHaveLength(0);

      // User B cannot retrieve it by ID
      const userBGet = await request(app)
        .get(`/api/thoughts/${thoughtId}`)
        .set("x-test-user-id", userB.id)
        .set("x-test-user-email", userB.email);

      expect(userBGet.status).toBe(404);
      expect(userBGet.body.error.code).toBe("THOUGHT_NOT_FOUND");
    });

    it("should prevent User B from deleting User A's thought", async () => {
      const createRes = await request(app)
        .post("/api/thoughts/analyze")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email)
        .send({
          rawContent: "Protected User A thought record."
        });

      const thoughtId = createRes.body.thought.id;

      // User B attempts to delete
      const deleteRes = await request(app)
        .delete(`/api/thoughts/${thoughtId}`)
        .set("x-test-user-id", userB.id)
        .set("x-test-user-email", userB.email);

      expect(deleteRes.status).toBe(404);

      // Verify User A's thought still exists
      const verifyRes = await request(app)
        .get(`/api/thoughts/${thoughtId}`)
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email);

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.id).toBe(thoughtId);
    });

    it("should hard delete thought record when deleted by owner", async () => {
      const createRes = await request(app)
        .post("/api/thoughts/analyze")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email)
        .send({
          rawContent: "Thought to be purged for privacy."
        });

      const thoughtId = createRes.body.thought.id;

      // Delete by owner
      const deleteRes = await request(app)
        .delete(`/api/thoughts/${thoughtId}`)
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);

      // Verify it cannot be retrieved
      const getRes = await request(app)
        .get(`/api/thoughts/${thoughtId}`)
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email);

      expect(getRes.status).toBe(404);

      // Verify list is empty
      const listRes = await request(app)
        .get("/api/thoughts")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email);

      expect(listRes.body.data).toHaveLength(0);
    });
  });

  describe("Privacy & Logging Redaction", () => {
    it("should never log raw thought text during submission and processing", async () => {
      const sensitiveThought = "Super-secret personal struggle with procrastination and burnout";
      const infoSpy = vi.spyOn(logger, "info");

      await request(app)
        .post("/api/thoughts/analyze")
        .set("x-test-user-id", userA.id)
        .set("x-test-user-email", userA.email)
        .send({
          rawContent: sensitiveThought,
          contextTag: "Confidential"
        });

      // Verify that NONE of the logger.info calls contain the sensitive raw text in their arguments
      for (const call of infoSpy.mock.calls) {
        const message = call[0];
        const meta = call[1];

        expect(message).not.toContain(sensitiveThought);

        if (meta && typeof meta === "object") {
          const serializedMeta = JSON.stringify(meta);
          expect(serializedMeta).not.toContain(sensitiveThought);
        }
      }

      infoSpy.mockRestore();
    });
  });

  describe("Theological Guardrails & Paraphrased Attribution Scanner", () => {
    it("should reject guidance containing literal supernatural attribution", () => {
      const unsafeGuidance: AiGuidanceResponse = {
        categories: ["VALUE_CONFLICT"],
        alignmentStatus: "MISALIGNED",
        directReasoning: "Satan made you procrastinate today.",
        recommendedActions: ["Pray for strength."],
        nonShamingInsight: "Recognize the struggle.",
        faithReflection: "Overcome spiritual warfare.",
        alignmentScore: 20
      };

      const result = validateAndGuardGuidance(unsafeGuidance);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("THEOLOGICAL_ATTRIBUTION_DETECTED");
      }
    });

    it("should reject semantic paraphrases attributing thoughts to the devil", () => {
      const paraphrasedGuidance: AiGuidanceResponse = {
        categories: ["PROCRASTINATION_IMPULSE"],
        alignmentStatus: "MISALIGNED",
        directReasoning: "The devil has been whispering doubt into your ears regarding this project.",
        recommendedActions: ["Focus on your work."],
        nonShamingInsight: "Stay resilient.",
        faithReflection: null,
        alignmentScore: 35
      };

      const result = validateAndGuardGuidance(paraphrasedGuidance);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("PARAPHRASED_SUPERNATURAL_ATTRIBUTION_DETECTED");
        expect(result.safeMessage).toContain("prohibited supernatural attribution pattern");
      }
    });

    it("should reject semantic paraphrases claiming God specifically commanded an action", () => {
      const claimGuidance: AiGuidanceResponse = {
        categories: ["GOAL_ALIGNED"],
        alignmentStatus: "ALIGNED",
        directReasoning: "God told you to abandon this goal and start a new business immediately.",
        recommendedActions: ["Resign today."],
        nonShamingInsight: "Follow the revelation.",
        faithReflection: null,
        alignmentScore: 90
      };

      const result = validateAndGuardGuidance(claimGuidance);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("THEOLOGICAL_ATTRIBUTION_DETECTED");
      }
    });

    it("should reject claims of spiritual warfare causality", () => {
      const warfareGuidance: AiGuidanceResponse = {
        categories: ["FEAR_OR_ANXIETY"],
        alignmentStatus: "MISALIGNED",
        directReasoning: "Spiritual warfare is why you feel so exhausted and unmotivated this morning.",
        recommendedActions: ["Rest and pray."],
        nonShamingInsight: "You are under attack.",
        faithReflection: null,
        alignmentScore: 40
      };

      const result = validateAndGuardGuidance(warfareGuidance);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("PARAPHRASED_SUPERNATURAL_ATTRIBUTION_DETECTED");
      }
    });
  });
});
