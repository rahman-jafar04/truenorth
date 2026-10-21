import { Router, Request, Response, NextFunction } from "express";
import { requireAuth } from "../middleware/auth";
import { taskService } from "../services/taskService";
import { getUserLocalDate } from "../services/taskHistory";

export const reportsRouter = Router();

reportsRouter.use(requireAuth);

/**
 * GET /api/reports/daily
 * Get historical or current daily report for a specific date in the user's timezone.
 */
reportsRouter.get("/daily", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const timezone = (req.query.timezone as string) || "UTC";
    const date = (req.query.date as string) || getUserLocalDate(new Date(), timezone);

    const report = await taskService.getDailyReport(userId, date, timezone);
    res.status(200).json({ data: report });
  } catch (err) {
    next(err);
  }
});
