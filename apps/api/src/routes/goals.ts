import { Router, Request, Response, NextFunction } from "express";
import { requireAuth } from "../middleware/auth";
import { goalService } from "../services/goalService";
import { GoalStatus } from "@truenorth/shared";

export const goalsRouter = Router();

goalsRouter.use(requireAuth);

/**
 * GET /api/goals
 * List goals for authenticated user
 */
goalsRouter.get("/", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const status = req.query.status as GoalStatus | undefined;
    const category = req.query.category as string | undefined;

    const goals = await goalService.getGoals(userId, { status, category });
    res.status(200).json({ data: goals });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/goals
 * Create new goal
 */
goalsRouter.post("/", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const goal = await goalService.createGoal(userId, req.body);
    res.status(201).json({ data: goal });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/goals/:id
 * Retrieve goal by ID
 */
goalsRouter.get("/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const goalId = req.params.id as string;
    const goal = await goalService.getGoalById(goalId, userId);
    res.status(200).json({ data: goal });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/goals/:id
 * Update goal
 */
goalsRouter.patch("/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const goalId = req.params.id as string;
    const updated = await goalService.updateGoal(goalId, userId, req.body);
    res.status(200).json({ data: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/goals/:id
 * Delete goal
 */
goalsRouter.delete("/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const goalId = req.params.id as string;
    await goalService.deleteGoal(goalId, userId);
    res.status(200).json({ success: true, message: "Goal deleted successfully" });
  } catch (err) {
    next(err);
  }
});
