// frontend/src/pages/SubscriptionSuccessPage.tsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  CircularProgress,
  Stack,
  Card,
  CardContent,
} from "@mui/material";
import { CheckCircle, ErrorOutline, Home, School } from "@mui/icons-material";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { getPlanName } from "../utils/plans";
import { trackPurchase } from "../utils/analytics";


// Key for storing processed session IDs
const PROCESSED_SESSIONS_KEY = "processed_payment_sessions";

// Helper to get processed sessions from sessionStorage
const getProcessedSessions = (): string[] => {
  try {
    const stored = sessionStorage.getItem(PROCESSED_SESSIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Helper to mark a session as processed
const markSessionAsProcessed = (sessionId: string): void => {
  const sessions = getProcessedSessions();
  if (!sessions.includes(sessionId)) {
    sessions.push(sessionId);
    sessionStorage.setItem(PROCESSED_SESSIONS_KEY, JSON.stringify(sessions));
  }
};

// Helper to check if session was already processed
const isSessionProcessed = (sessionId: string): boolean => {
  return getProcessedSessions().includes(sessionId);
};

export const SubscriptionSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processed, setProcessed] = useState(false);
  const [planName, setPlanName] = useState<string | null>(null);

  const sessionId = searchParams.get("session_id");

  // Prevent browser back button from returning to this page
  useEffect(() => {
    // Replace the current history entry so user can't go back to this page
    window.history.replaceState(null, "", window.location.href);

    // Handle popstate (back button) - redirect to dashboard
    const handlePopState = () => {
      navigate("/dashboard", { replace: true });
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [navigate]);

  useEffect(() => {
    const verifySession = async () => {
      // 1. Basic Validation
      if (!sessionId) {
        setError("お支払いの情報が見つかりませんでした。");
        setLoading(false);
        return;
      }

      // Check if this session was already processed (prevent revisiting)
      if (isSessionProcessed(sessionId)) {
        navigate("/dashboard", { replace: true });
        return;
      }

      if (processed) return;

      try {
        // 2. Direct API Call
        const response = await api.post("/payment/verify-checkout-session", {
          sessionId,
        });

        // 3. Process Success
        if (
          response.data.status === "paid" &&
          response.data.transactionDetails
        ) {
          const { transactionDetails, isFirstEverPaid } = response.data;

          setPlanName(getPlanName(transactionDetails.plan));

          const currency = (transactionDetails.currency || "JPY").toUpperCase();
          // Stripe amounts are in the smallest unit; yen has no smaller unit.
          const value =
            currency === "JPY"
              ? transactionDetails.value
              : transactionDetails.value / 100;

          // Count only a user's first paid subscription, not renewals or re-subscriptions.
          if (
            !transactionDetails.isTrial &&
            isFirstEverPaid &&
            transactionDetails.transactionId
          ) {
            trackPurchase({
              transactionId: transactionDetails.transactionId,
              value,
              currency,
              plan: transactionDetails.plan,
              name: transactionDetails.name,
            });
          }
        }

        setProcessed(true);

        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("時間をおいて、もう一度お試しください。");
        setLoading(false);
      }
    };

    verifySession();

    // Mark session as processed only when leaving the page (unmount)
    return () => {
      if (sessionId) {
        markSessionAsProcessed(sessionId);
      }
    };
  }, [sessionId, processed, navigate]);

  if (loading) {
    return (
      <Box
        role="status"
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          bgcolor: "background.default",
          px: 2,
        }}
      >
        <CircularProgress />
        <Typography variant="body1" color="text.secondary">
          お支払いを確認しています…
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
          py: 4,
        }}
      >
        <Container maxWidth="sm">
          <Card>
            <CardContent sx={{ p: { xs: 3, md: 4 }, textAlign: "center" }}>
              <ErrorOutline
                aria-hidden
                sx={{ fontSize: 48, color: "error.main", mb: 1 }}
              />
              <Typography variant="h5" component="h1" gutterBottom>
                お支払いを確認できませんでした
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {error}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                お支払いが済んでいる場合は、確認のメールが届きます。
              </Typography>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                justifyContent="center"
              >
                <Button
                  variant="outlined"
                  onClick={() => navigate("/dashboard", { replace: true })}
                >
                  ホームへ
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate("/subscription", { replace: true })}
                >
                  もう一度試す
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        bgcolor: "background.default",
        py: { xs: 4, md: 8 },
      }}
    >
      <Container maxWidth="sm">
        <Card>
          <CardContent sx={{ p: { xs: 3, md: 5 }, textAlign: "center" }}>
            <CheckCircle
              aria-hidden
              sx={{ fontSize: 56, color: "success.main", mb: 1.5 }}
            />
            <Typography variant="h4" component="h1" gutterBottom>
              メンバー登録が済みました
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              {planName ?? "サブスクリプション"}が有効になりました。すべてのレッスンを見られます。コミュニティへの投稿もできます。
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button
                variant="contained"
                size="large"
                startIcon={<School aria-hidden />}
                onClick={() => navigate("/classroom", { replace: true })}
                fullWidth
              >
                講座を見る
              </Button>
              <Button
                variant="outlined"
                size="large"
                startIcon={<Home aria-hidden />}
                onClick={() => navigate("/dashboard", { replace: true })}
                fullWidth
              >
                ホームへ
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};
