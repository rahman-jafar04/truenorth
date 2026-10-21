import { Router, Request, Response, NextFunction } from "express";
import { requireAuth } from "../middleware/auth";
import { taskService } from "../services/taskService";
import { TaskStatus } from "@truenorth/shared";

export const tasksRouter = Router();

tasksRouter.use(requireAuth);

/**
 * GET /api/tasks
 * List tasks for the authenticated user, optionally filtered by date, status, or goalId.
 */
tasksRouter.get("/", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const date = req.query.date as string | undefined;
    const status = req.query.status as TaskStatus | undefined;
    const goalId = req.query.goalId as string | undefined;

    const tasks = await taskService.getTasks(userId, { date, status, goalId });
    res.status(200).json({ data: tasks });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/tasks
 * Create a new daily task
 */
tasksRouter.post("/", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const task = await taskService.createTask(userId, req.body);
    res.status(201).json({ data: task });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/tasks/:id
 * Retrieve a specific task by ID
 */
tasksRouter.get("/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const taskId = req.params.id as string;
    const task = await taskService.getTaskById(taskId, userId);
    res.status(200).json({ data: task });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/tasks/:id
 * Update task metadata
 */
tasksRouter.patch("/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const taskId = req.params.id as string;
    const updated = await taskService.updateTask(taskId, userId, req.body);
    res.status(200).json({ data: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/tasks/:id/complete
 * Mark task as completed
 */
tasksRouter.post("/:id/complete", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const taskId = req.params.id as string;
    const completed = await taskService.completeTask(taskId, userId);
    res.status(200).json({ data: completed });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/tasks/:id/reopen
 * Reopen a completed task with audit trail
 */
tasksRouter.post("/:id/reopen", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const taskId = req.params.id as string;
    const reopened = await taskService.reopenTask(taskId, userId, req.body);
    res.status(200).json({ data: reopened });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/tasks/:id/reschedule
 * Reschedule a task to a new date with mandatory reason
 */
tasksRouter.post("/:id/reschedule", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const taskId = req.params.id as string;
    const rescheduled = await taskService.rescheduleTask(taskId, userId, req.body);
    res.status(200).json({ data: rescheduled });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/tasks/:id
 * Delete a task
 */
tasksRouter.delete("/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const taskId = req.params.id as string;
    await taskService.deleteTask(taskId, userId);
    res.status(200).json({ success: true, message: "Task deleted successfully" });
  } catch (err) {
    next(err);
  }
});
