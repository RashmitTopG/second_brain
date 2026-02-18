import zod from "zod";

export const signupSchema = zod.object({
  email: zod.string().email("Invalid email address"),
  username: zod.string().min(4).max(20),
  password: zod
  .string()
  .min(8)
  .regex(/[A-Z]/, "At least one uppercase letter")
  .regex(/[0-9]/, "At least one number")
  .regex(/[!@#$%^&*]/, "At least one special character"),
});

export const signinSchema = zod.object({
  username: zod.string(),
  password: zod.string().min(1, "Password cannot be empty"),
});

