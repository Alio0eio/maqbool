import { z } from "zod";

export const registerRequestSchema = z.object({
  email: z.string().trim().email("Email must be a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  name: z.string().trim().min(1, "Name is required").max(200, "Name is too long"),
});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;