import { Router, Request, Response, NextFunction } from "express";
import { requireAuth } from "../middleware/auth";
import { focusLockService } from "../services/focusLockService";

export const focusLockRouter = Router();

focusLockRouter.use(requireAuth);

/**
 * GET /api/focus-lock/policy
 * Retrieve the user's active Focus Lock policy.
 */
focusLockRouter.get(
  "/policy",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const policy = await focusLockService.getPolicy(userId);
      res.status(200).json({ data: policy });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PUT /api/focus-lock/policy
 * Update or configure the user's Focus Lock policy.
 */
focusLockRouter.put(
  "/policy",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const policy = await focusLockService.updatePolicy(userId, req.body);
      res.status(200).json({ data: policy });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/focus-lock/exceptions
 * Request a time-limited emergency exception to bypass restrictions.
 */
focusLockRouter.post(
  "/exceptions",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const exception = await focusLockService.requestException(userId, req.body);
      res.status(201).json({ data: exception });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/focus-lock/exceptions/active
 * Check if the user has an active, unexpired emergency exception.
 */
focusLockRouter.get(
  "/exceptions/active",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const exception = await focusLockService.getActiveException(userId);
      res.status(200).json({ data: exception });
    } catch (err) {
      next(err);
    }
  }
);
