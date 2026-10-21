import { Router, Request, Response, NextFunction } from "express";
import { requireAuth } from "../middleware/auth";
import { reportService } from "../services/reportService";
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

    const report = await reportService.getDailyReport(userId, date, timezone);
    res.status(200).json({ data: report });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/reports/calendar
 * Get multi-day historical overview and calendar analytics for a date range.
 */
reportsRouter.get("/calendar", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const timezone = (req.query.timezone as string) || "UTC";
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const analytics = await reportService.getCalendarAnalytics(
      userId,
      startDate,
      endDate,
      timezone
    );
    res.status(200).json({ data: analytics });
  } catch (err) {
    next(err);
  }
});
