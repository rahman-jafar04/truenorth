import { z } from "zod";

export const PersonalValuesSchema = z.object({
  values: z.array(z.string().min(1).max(50)).max(10),
  faithModeEnabled: z.boolean().default(false),
  traditionOrFocus: z.string().max(100).optional()
});

export type PersonalValues = z.infer<typeof PersonalValuesSchema>;

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().min(1).max(100).optional(),
  faithModeEnabled: z.boolean().default(false),
  personalValues: z.array(z.string()).default([]),
  timezone: z.string().default("UTC"),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

export const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  faithModeEnabled: z.boolean().optional(),
  personalValues: z.array(z.string().min(1).max(50)).max(10).optional(),
  timezone: z.string().optional()
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
