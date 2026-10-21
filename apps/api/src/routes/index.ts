import { Router } from "express";
import { healthRouter } from "./health";
import { thoughtsRouter } from "./thoughts";
import { profileRouter } from "./profile";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/profile", profileRouter);
apiRouter.use("/thoughts", thoughtsRouter);
