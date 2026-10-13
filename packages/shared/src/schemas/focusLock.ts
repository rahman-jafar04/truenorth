import { z } from "zod";

export const RestrictedAppSchema = z.object({
  id: z.string(),
  name: z.string(),
  bundleOrPackageId: z.string(),
  category: z.string().optional()
});

export type RestrictedApp = z.infer<typeof RestrictedAppSchema>;

export const FocusLockPolicySchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  isActive: z.boolean().default(true),
  restrictedApps: z.array(RestrictedAppSchema),
  requireTasksCompleted: z.boolean().default(true),
  requiredTaskIds: z.array(z.string().uuid()).default([]),
  scheduleStartTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().nullable(),
  scheduleEndTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().nullable(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).default([0, 1, 2, 3, 4, 5, 6]),
  strictModeEnabled: z.boolean().default(false)
});

export type FocusLockPolicy = z.infer<typeof FocusLockPolicySchema>;

export const RequestExceptionSchema = z.object({
  policyId: z.string().uuid(),
  durationMinutes: z.number().int().min(1).max(30),
  reason: z.string().trim().min(5).max(300)
});

export type RequestExceptionInput = z.infer<typeof RequestExceptionSchema>;

export const FocusLockExceptionResponseSchema = z.object({
  id: z.string().uuid(),
  policyId: z.string().uuid(),
  userId: z.string().uuid(),
  reason: z.string(),
  durationMinutes: z.number().int(),
  grantedAt: z.string().datetime(),
  expiresAt: z.string().datetime()
});

export type FocusLockExceptionResponse = z.infer<typeof FocusLockExceptionResponseSchema>;
