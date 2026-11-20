import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Stack,
  IconButton,
  FormControlLabel,
  Checkbox,
  Link,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

import { GoogleSignInButton, PasswordStrengthMeter, StepIndicator } from "../components/auth";
import { FormInput } from "../components/ui/FormInput";
import { useRegistration } from "../hooks/useRegistration";
import { AuthLayout } from "../components/layout/AuthLayout";
import { useRegistrationFlowData } from "../utils/registrationFlow";

const PLAN_LABELS: Record<string, string> = {
  monthly: "月額",
  yearly: "年額",
};

const toggleSx = { width: 44, height: 44 };

export const RegistrationPage: React.FC = () => {
  const {
    register,
    handleSubmit,
    onValidSubmit,
    errors,
    isValid,
    loading,
    serverError,
    setServerError,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    passwordStrength,
    passwordValue,
    effectivePlan,
  } = useRegistration();

  // Get dynamic step configuration based on flow type
  const { totalSteps, currentStepLabel } =
    useRegistrationFlowData("basic_info");

  const planLabel = effectivePlan ? PLAN_LABELS[effectivePlan] || effectivePlan : null;

  return (
    <AuthLayout>
      <Card>
        <CardContent sx={{ px: { xs: 2.5, sm: 5 }, py: { xs: 4, sm: 5 } }}>
          <Box mb={3}>
            <Typography component="h1" variant="h4" gutterBottom>
              {planLabel ? `${planLabel}プランで登録` : "無料で登録"}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {planLabel
                ? "アカウントを作ったあと、お支払いの画面に進みます。"
                : "アカウントを作ると、無料公開のレッスンで学んだ記録が残ります。"}
            </Typography>
          </Box>

          <StepIndicator
            currentStep={1}
            label={currentStepLabel}
            totalSteps={totalSteps}
          />

          {serverError && (
            <Alert
              severity="error"
              sx={{ mb: 3 }}
              role="alert"
              onClose={() => setServerError("")}
              closeText="閉じる"
            >
              {serverError}
            </Alert>
          )}

          <GoogleSignInButton mode="signup" />

          <form onSubmit={handleSubmit(onValidSubmit)} noValidate>
            <Stack spacing={3}>
              <FormInput
                label="お名前"
                registration={register("name")}
                error={errors.name}
                autoComplete="name"
                helperText="コミュニティでほかのメンバーに表示されます"
                isRequired
              />
              <FormInput
                label="メールアドレス"
                type="email"
                registration={register("email")}
                error={errors.email}
                autoComplete="email"
                isRequired
              />
              <Box>
                <FormInput
                  label="パスワード"
                  type={showPassword ? "text" : "password"}
                  registration={register("password")}
                  autoComplete="new-password"
                  isRequired
                  endIcon={
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示する"}
                      sx={toggleSx}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  }
                />
                {passwordValue && (
                  <PasswordStrengthMeter passwordStrength={passwordStrength} />
                )}
              </Box>
              <FormInput
                label="パスワード（確認）"
                type={showConfirmPassword ? "text" : "password"}
                registration={register("confirmPassword")}
                error={errors.confirmPassword}
                autoComplete="new-password"
                isRequired
                endIcon={
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                    aria-label={showConfirmPassword ? "パスワードを隠す" : "パスワードを表示する"}
                    sx={toggleSx}
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                }
              />
              <Box>
                <FormControlLabel
                  sx={{ alignItems: "flex-start", mr: 0 }}
                  control={
                    <Checkbox {...register("agreeToTerms")} color="primary" sx={{ mt: -0.5 }} />
                  }
                  label={
                    <Typography variant="body2" sx={{ pt: 0.75 }}>
                      <Link component={RouterLink} to="/terms" target="_blank" rel="noopener noreferrer">
                        利用規約
                      </Link>
                      と
                      <Link
                        component={RouterLink}
                        to="/privacy-policy"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        プライバシーポリシー
                      </Link>
                      に同意します
                      <Box component="span" sx={{ color: "error.main", ml: 0.5 }} aria-hidden="true">
                        *
                      </Box>
                    </Typography>
                  }
                />
                {errors.agreeToTerms && (
                  <Typography variant="body2" color="error" display="block" role="alert">
                    {errors.agreeToTerms.message}
                  </Typography>
                )}
                <FormControlLabel
                  sx={{ alignItems: "flex-start", mr: 0, mt: 1 }}
                  control={
                    <Checkbox
                      {...register("marketingEmails")}
                      color="primary"
                      sx={{ mt: -0.5 }}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ pt: 0.75 }}>
                      新しいレッスンやお知らせをメールで受け取る
                    </Typography>
                  }
                />
              </Box>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || passwordStrength.score < 100 || !isValid}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" aria-label="送信しています" />
                ) : (
                  "次へ（メールアドレスの確認）"
                )}
              </Button>
            </Stack>
          </form>

          <Box mt={3} pt={3} sx={{ borderTop: 1, borderColor: "divider" }}>
            <Typography variant="body2" color="text.secondary">
              すでにアカウントをお持ちの方は{" "}
              <Link
                component={RouterLink}
                to="/login"
                sx={{ display: "inline-flex", alignItems: "center", minHeight: 44 }}
              >
                ログイン
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </AuthLayout>
  );
};
