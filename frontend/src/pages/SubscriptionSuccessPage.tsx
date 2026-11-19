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

declare global {
  interface Window {
    dataLayer: any[];
  }
}

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
          const {
            transactionDetails,
            metadata,
            isFirstEverPaid,
          } = response.data;

          setPlanName(getPlanName(transactionDetails.plan));

          console.log("📊 GA4 Tracking Decision:", {
            isTrial: transactionDetails.isTrial,
            isFirstEverPaid,
            willPushToGA4: transactionDetails.isTrial || isFirstEverPaid,
          });

          // --- GTM / Data Layer Logic ---
          window.dataLayer = window.dataLayer || [];

          // Determine logic based on whether it is a Trial or Paid
          const isTrial = transactionDetails.isTrial || false;
          const currency = transactionDetails.currency || "USD";

          let eventValue = transactionDetails.value;

          // Helper: format value (divide by 100 if not JPY)
          if (currency.toUpperCase() !== "JPY") {
            eventValue = eventValue / 100;
          }

          if (isTrial) {
            // 🟢 CASE 1: FREE TRIAL (Value 0)
            const trialEventData = {
              event: "signup_free_trial",
              value: 0,
              currency: currency,
              is_trial: true,
              transaction_id: transactionDetails.transactionId,
              ecommerce: {
                transaction_id: transactionDetails.transactionId,
                value: 0, // Explicitly 0
                currency: currency,
                items: [
                  {
                    item_id: `trial_${transactionDetails.plan}`,
                    item_name: transactionDetails.name || "Free Trial",
                    item_category: "Subscription",
                    price: 0,
                    quantity: 1,
                  },
                ],
              },
              user_id: metadata?.userId || null,
              is_subscription_paid: false,
              subscription_status: "trial",
            };

            console.log("📊 DataLayer Push (Free Trial):", trialEventData);
            window.dataLayer.push(trialEventData);
          } else if (isFirstEverPaid) {
            // 🟢 CASE 2: FIRST-TIME PAID SUBSCRIPTION (fires only ONCE per user, ever)
            // This is critical for GA4 tracking - prevents duplicate events on renewal/re-subscription
            const paidEventData = {
              event: "subscription_paid",
              value: eventValue,
              currency: currency,
              subscription_plan: transactionDetails.plan,
              subscription_name: transactionDetails.name,
              billing_interval: transactionDetails.interval || "monthly",
              is_trial: false,
              transaction_id: transactionDetails.transactionId,
              user_id: metadata?.userId || null,
              ecommerce: {
                transaction_id: transactionDetails.transactionId,
                value: eventValue,
                currency: currency,
                items: [
                  {
                    item_id: `subscription_${transactionDetails.plan}`,
                    item_name: transactionDetails.name,
                    item_category: "Subscription",
                    price: eventValue,
                    quantity: 1,
                  },
                ],
              },
            };

            console.log(
              "📊 DataLayer Push (First-Time Paid - ONE TIME ONLY):",
              paidEventData,
            );
            window.dataLayer.push(paidEventData);
          } else {
            // 🔴 CASE 3: SUBSEQUENT PAYMENT (renewal, re-subscription after cancel)
            // Do NOT push to dataLayer - user has already been tracked
            console.log(
              "ℹ️ Subsequent payment detected. NOT pushing to dataLayer (user already tracked).",
            );
            console.log("Payment details:", {
              transaction_id: transactionDetails.transactionId,
              value: eventValue,
              currency: currency,
              plan: transactionDetails.plan,
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
