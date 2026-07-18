import { z } from "zod";

export const registerSchema = z
  .object({
    fullName: z.string().min(2).max(120),
    email: z.string().email().max(255),
    company: z.string().max(160).optional().or(z.literal("")),
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
