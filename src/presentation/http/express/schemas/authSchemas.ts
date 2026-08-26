import { z } from "zod";

export const RegisterRequestSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  email: z.string().trim().email("email must be a valid email address"),
  password: z.string().min(8, "password must be at least 8 characters"),
});

export const LoginRequestSchema = z.object({
  email: z.string().trim().email("email must be a valid email address"),
  password: z.string().min(1, "password is required"),
});
