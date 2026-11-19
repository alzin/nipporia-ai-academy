import { z } from 'zod';

export const registrationSchema = z
  .object({
    name: z.string().min(1, "お名前を入力してください"),
    email: z.string().email("メールアドレスの形が正しくありません"),
    password: z.string().min(8, "パスワードは8文字以上にしてください"),
    confirmPassword: z.string(),
    // FIXED: Use z.boolean() + refine instead of z.literal()
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: "プライバシーポリシーへの同意が必要です",
    }),
    marketingEmails: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "パスワードが一致しません",
    path: ["confirmPassword"],
  });

export type RegistrationFormInputs = z.infer<typeof registrationSchema>;