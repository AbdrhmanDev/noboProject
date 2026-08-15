import { z } from "zod";

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(1, "auth.displayNameRequired")
      .max(200, "auth.displayNameTooLong"),
    email: z.string().min(1, "auth.emailRequired").email("auth.emailInvalid"),
    password: z
      .string()
      .min(8, "auth.passwordTooShort")
      .regex(/[a-z]/, "auth.passwordComplexity")
      .regex(/[A-Z]/, "auth.passwordComplexity")
      .regex(/\d/, "auth.passwordComplexity")
      .regex(/[^A-Za-z0-9]/, "auth.passwordComplexity"),
    confirmPassword: z.string().min(1, "auth.confirmPasswordRequired"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "auth.passwordsMustMatch",
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
