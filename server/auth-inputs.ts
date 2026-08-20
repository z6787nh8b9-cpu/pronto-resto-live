import { z } from "zod";

const passwordInputSchema = z.string().min(1).max(72);

export const credentialsInputSchema = z.object({
  email: z.string().trim().email().max(320).transform((value) => value.toLowerCase()),
  password: passwordInputSchema,
});

export const passwordChangeInputSchema = z.object({
  currentPassword: passwordInputSchema,
  newPassword: passwordInputSchema,
});

export const passwordHelpInputSchema = z.object({
  email: z.string().trim().email().max(320).transform((value) => value.toLowerCase()),
});

export const passwordResetInputSchema = z.object({
  token: z.string().min(20).max(512),
  newPassword: passwordInputSchema,
});
