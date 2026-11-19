import { PasswordStrength } from "../types/registration.types";


export const calculatePasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  const feedback = [];

  if (password.length >= 8) score += 25;
  else feedback.push("8文字以上");

  if (/[A-Z]/.test(password)) score += 25;
  else feedback.push("大文字を1つ以上");

  if (/[a-z]/.test(password)) score += 25;
  else feedback.push("小文字を1つ以上");

  if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 25;
  else feedback.push("数字か記号を1つ以上");

  let color = "error";
  if (score >= 75) color = "success";
  else if (score >= 50) color = "warning";

  return { score, feedback, color: color as string };
};