import { Router, Request, Response, NextFunction } from "express";
import { requireAuth } from "../middleware/auth";
import { userService } from "../services/userService";

export const profileRouter = Router();

// All profile operations require valid user authentication
profileRouter.use(requireAuth);

/**
 * GET /api/profile
 * Retrieves the authenticated user's profile and personal values.
 */
profileRouter.get("/", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const email = req.user!.email;

    const profile = await userService.getProfile(userId, email);
    res.status(200).json({
      data: profile
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/profile
 * Updates the authenticated user's display name, faith mode, personal values, or timezone.
 */
profileRouter.patch("/", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const email = req.user!.email;

    const updated = await userService.updateProfile(userId, req.body, email);
    res.status(200).json({
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/profile/sync
 * Idempotently registers or updates the user profile upon successful Supabase authentication.
 */
profileRouter.post("/sync", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const email = req.user!.email;
    const displayName = req.body?.displayName;

    const synced = await userService.syncUser(userId, email, displayName);
    res.status(200).json({
      data: synced
    });
  } catch (err) {
    next(err);
  }
});
