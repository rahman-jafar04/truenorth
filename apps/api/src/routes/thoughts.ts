import { Router, Request, Response, NextFunction } from "express";
import { SubmitThoughtSchema } from "@truenorth/shared";
import { requireAuth } from "../middleware/auth";
import { analyzeThought } from "../services/aiGuidance";

export const thoughtsRouter = Router();

thoughtsRouter.post(
  "/analyze",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = SubmitThoughtSchema.parse(req.body);

      const guidance = await analyzeThought({
        thought: input.rawContent,
        faithModeEnabled: input.includeFaithPerspective ?? false,
        personalValues: []
      });

      res.status(200).json({
        data: guidance
      });
    } catch (err) {
      next(err);
    }
  }
);
