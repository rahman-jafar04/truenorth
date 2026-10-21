import { Router, Request, Response, NextFunction } from "express";
import { requireAuth } from "../middleware/auth";
import { thoughtService } from "../services/thoughtService";

export const thoughtsRouter = Router();

thoughtsRouter.use(requireAuth);

/**
 * POST /api/thoughts/analyze
 * Submit a thought for guarded AI guidance and persist the record.
 */
thoughtsRouter.post(
  "/analyze",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const result = await thoughtService.submitAndAnalyze(userId, req.body);
      res.status(200).json({
        data: result.guidance,
        thought: result.thought
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/thoughts
 * Retrieve the user's historical thoughts and AI evaluations.
 */
thoughtsRouter.get(
  "/",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const goalId = req.query.goalId as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      const thoughts = await thoughtService.getThoughts(userId, { goalId, limit });
      res.status(200).json({ data: thoughts });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/thoughts/:id
 * Retrieve a single thought record with its AI analysis.
 */
thoughtsRouter.get(
  "/:id",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const thoughtId = req.params.id as string;
      const thought = await thoughtService.getThoughtById(thoughtId, userId);
      res.status(200).json({ data: thought });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/thoughts/:id
 * Hard delete a thought record for user privacy compliance.
 */
thoughtsRouter.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const thoughtId = req.params.id as string;
      await thoughtService.deleteThought(thoughtId, userId);
      res.status(200).json({ success: true, message: "Thought deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
);
