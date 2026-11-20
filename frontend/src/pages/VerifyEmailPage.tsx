// frontend/src/pages/VerifyEmailPage.tsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Stack,
  Alert,
  CircularProgress,
} from "@mui/material";
import api from "../services/api";
import { checkAuth } from "../store/slices/authSlice";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../store/store";
import { handlePasteCode } from "../utils/handlePasteCode";
import { getStoredPlan } from "../utils/planStorage";
import { trackSignUp } from "../utils/analytics";
import { StepIndicator } from "../components/auth";
import { useRegistrationFlowData } from "../utils/registrationFlow";
import { AuthLayout } from "../components/layout/AuthLayout";
import { authErrorFrom } from "../utils/authErrors";

export const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const [verificationCode, setVerificationCode] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [email, setEmail] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const dispatch = useDispatch<AppDispatch>();

  // Get dynamic step configuration based on flow type
  const { totalSteps, currentStepLabel } =
    useRegistrationFlowData("verify_email");

  useEffect(() => {
    // Get email from session storage
    const storedEmail = sessionStorage.getItem("registration_email");
    if (!storedEmail) {
      navigate("/register");
    } else {
      setEmail(storedEmail);
    }
  }, [navigate]);

  useEffect(() => {
    // Handle resend timer countdown
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = verificationCode.join("");
    if (code.length !== 6) {
      setError("6桁のコードをすべて入力してください");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Check if user has a pre-selected plan
      const storedPlan = getStoredPlan();

      // Pass skipTrialSetup=true if user is in paid flow (has pre-selected plan)
      await api.post("/auth/verify-email-code", {
        email,
        code,
        skipTrialSetup: !!storedPlan, // Skip trial setup if going to paid flow
      });
      sessionStorage.removeItem("registration_email");
      trackSignUp("email");

      // With a plan picked on the landing page, continue to checkout;
      // otherwise go to the dashboard.
      if (storedPlan) {
        window.location.href = `/subscription?plan=${storedPlan}`;
      } else {
        window.location.href = "/dashboard";
      }

      await dispatch(checkAuth());
    } catch (err: any) {
      const raw = err.response?.data?.error?.message || err.response?.data?.error;
      setError(
        authErrorFrom(
          raw ? { message: raw } : err,
          "確認できませんでした。コードを確かめて、もう一度お試しください。",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;

    setResendLoading(true);
    setError("");
    setNotice("");

    try {
      await api.post("/auth/resend-verification", { email });

      setResendTimer(60); // Set 60 second cooldown
      setError(""); // Clear any errors

      setNotice("新しい確認コードを送りました。メールをご確認ください。");
    } catch (err: any) {
      const raw = err.response?.data?.error?.message || err.response?.data?.error;
      setError(
        authErrorFrom(
          raw ? { message: raw } : err,
          "コードを送れませんでした。もう一度お試しください。",
        ),
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card>
        <CardContent sx={{ px: { xs: 2.5, sm: 5 }, py: { xs: 4, sm: 5 } }}>
          <Box mb={3}>
            <Typography component="h1" variant="h4" gutterBottom>
              メールアドレスの確認
            </Typography>
            <Typography variant="body1" color="text.secondary">
              確認コードを次のアドレスに送りました。
            </Typography>
            <Typography
              variant="body1"
              fontWeight={700}
              sx={{ overflowWrap: "anywhere" }}
            >
              {email}
            </Typography>
          </Box>

          <StepIndicator
            currentStep={2}
            label={currentStepLabel}
            totalSteps={totalSteps}
          />

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 3 }}
              role="alert"
              onClose={() => setError("")}
              closeText="閉じる"
            >
              {error}
            </Alert>
          )}

          {notice && (
            <Alert
              severity="success"
              sx={{ mb: 3 }}
              onClose={() => setNotice("")}
              closeText="閉じる"
            >
              {notice}
            </Alert>
          )}

          <Box component="fieldset" sx={{ border: 0, m: 0, p: 0 }}>
            <Typography
              component="legend"
              variant="body2"
              color="text.secondary"
              mb={1.5}
            >
              メールに書かれた6桁のコードを入力してください
            </Typography>
            <Stack direction="row" spacing={{ xs: 0.75, sm: 1 }}>
              {verificationCode.map((digit, index) => (
                <TextField
                  key={index}
                  inputRef={(el) => (inputRefs.current[index] = el)}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={(e) =>
                    handlePasteCode(
                      e,
                      verificationCode,
                      setVerificationCode,
                      inputRefs,
                    )
                  }
                  inputProps={{
                    maxLength: 1,
                    inputMode: "numeric",
                    autoComplete: index === 0 ? "one-time-code" : "off",
                    "aria-label": `${index + 1}桁目`,
                    style: {
                      textAlign: "center",
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      padding: 0,
                    },
                  }}
                  sx={{
                    flex: "1 1 0",
                    minWidth: 0,
                    maxWidth: 56,
                    "& .MuiOutlinedInput-root": {
                      height: 56,
                    },
                    "& input": { height: "100%" },
                  }}
                />
              ))}
            </Stack>
          </Box>

          <Stack spacing={2} mt={4}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleVerify}
              disabled={verificationCode.join("").length !== 6 || loading}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" aria-label="確認しています" />
              ) : (
                "確認して進む"
              )}
            </Button>

            <Box>
              <Typography variant="body2" color="text.secondary">
                コードが届かないときは、迷惑メールのフォルダも見てください。
              </Typography>
              <Button
                variant="text"
                color="secondary"
                onClick={handleResend}
                disabled={resendTimer > 0 || resendLoading}
                sx={{ px: 1, ml: -1 }}
              >
                {resendLoading ? (
                  <CircularProgress size={16} color="inherit" aria-label="送信しています" />
                ) : resendTimer > 0 ? (
                  `コードをもう一度送る（あと${resendTimer}秒）`
                ) : (
                  "コードをもう一度送る"
                )}
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </AuthLayout>
  );
};
