import { Router } from "express";
import { healthRouter } from "./health";
import { thoughtsRouter } from "./thoughts";
import { profileRouter } from "./profile";
import { goalsRouter } from "./goals";
import { tasksRouter } from "./tasks";
import { reportsRouter } from "./reports";
import { focusLockRouter } from "./focusLock";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/profile", profileRouter);
apiRouter.use("/goals", goalsRouter);
apiRouter.use("/tasks", tasksRouter);
apiRouter.use("/reports", reportsRouter);
apiRouter.use("/thoughts", thoughtsRouter);
apiRouter.use("/focus-lock", focusLockRouter);
