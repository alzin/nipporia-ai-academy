// frontend/src/pages/SubscriptionPage.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Link as MuiLink,
} from "@mui/material";
import { Check, Logout, SwapHoriz } from "@mui/icons-material";
import { loadStripe } from "@stripe/stripe-js";
import { AppDispatch, RootState } from "../store/store";
import { useDispatch, useSelector } from "react-redux";
import { paymentService } from "../services/paymentService";
import { logout, checkPayment } from "../store/slices/authSlice";
import {
  getStoredPlan,
  clearStoredPlan,
  isValidPlanType,
  PlanType,
} from "../utils/planStorage";
import { useSweetAlert } from "../utils/sweetAlert";
import { colors } from "../theme/theme";
import {
  PLANS,
  PLAN_FEATURES,
  MembershipPlanId,
  formatYen,
} from "../utils/plans";
import { trackBeginCheckout } from "../utils/analytics";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY!);

type ButtonVariant = "subscribe" | "change" | "current";

interface ButtonState {
  disabled: boolean;
  label: string;
  variant: ButtonVariant;
  icon?: React.ReactNode;
}

export const SubscriptionPage: React.FC = () => {
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();

  const [selectedPlan, setSelectedPlan] = useState<MembershipPlanId>("monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { showSuccessToast } = useSweetAlert();
  const [autoCheckoutInProgress, setAutoCheckoutInProgress] = useState(false);
  const [, setHasPreSelectedPlan] = useState(false);

  const { hasSubscription, currentPlan, status } = useSelector(
    (state: RootState) => state.auth,
  );

  const autoCheckoutTriggered = useRef(false);

  const getAutoCheckoutPlan = useCallback((): PlanType | null => {
    const params = new URLSearchParams(location.search);
    const urlPlan = params.get("plan");

    if (urlPlan && isValidPlanType(urlPlan)) {
      return urlPlan;
    }

    const storedPlan = getStoredPlan();
    if (storedPlan) {
      return storedPlan;
    }

    return null;
  }, [location.search]);

  useEffect(() => {
    const storedPlan = getStoredPlan();
    const params = new URLSearchParams(location.search);
    const urlPlan = params.get("plan");

    if (
      (storedPlan && isValidPlanType(storedPlan)) ||
      (urlPlan && isValidPlanType(urlPlan))
    ) {
      setHasPreSelectedPlan(true);
    }
  }, [location.search]);

  useEffect(() => {
    const autoCheckoutPlan = getAutoCheckoutPlan();

    if (
      autoCheckoutPlan &&
      !autoCheckoutTriggered.current &&
      !hasSubscription
    ) {
      autoCheckoutTriggered.current = true;
      setAutoCheckoutInProgress(true);
      clearStoredPlan();
      handleSelectPlan(autoCheckoutPlan);
    }
  }, [getAutoCheckoutPlan, hasSubscription]);

  const handleLogout = () => {
    dispatch(logout());
  };

  /**
   * Determine button state for each plan
   */
  const getButtonState = (planId: MembershipPlanId): ButtonState => {
    const isCurrentPlan = currentPlan === planId;

    // No subscription → subscribe
    if (!hasSubscription || !currentPlan) {
      return {
        disabled: false,
        label: "メンバーになる",
        variant: "subscribe",
      };
    }

    // Subscription ended → subscribe again
    if (status !== "active" && status !== "trialing") {
      return {
        disabled: false,
        label: isCurrentPlan ? "このプランを再開する" : "このプランで登録する",
        variant: "subscribe",
      };
    }

    if (isCurrentPlan) {
      return {
        disabled: true,
        label: "利用中のプラン",
        variant: "current",
      };
    }

    // The other plan → switch
    return {
      disabled: false,
      label: "このプランに切り替える",
      variant: "change",
      icon: <SwapHoriz sx={{ fontSize: 18, mr: 1 }} aria-hidden />,
    };
  };

  const handleSelectPlan = async (planId: MembershipPlanId) => {
    setSelectedPlan(planId);
    setError("");
    setLoading(true);

    try {
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Stripe を読み込めませんでした。");
      }

      const response = await paymentService.createCheckoutSession({
        planType: planId,
        successUrl: `${window.location.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/subscription`,
        metadata: {
          plan: planId,
        },
      });

      // Checkout redirect takes priority over a direct change: when a checkout
      // session is created (e.g. no card on file), the user must pay on Stripe first.
      if (response.sessionId) {
        trackBeginCheckout(planId);
        const result = await stripe.redirectToCheckout({
          sessionId: response.sessionId,
        });

        if (result.error) {
          throw new Error(result.error.message);
        }

        setLoading(false);
        return;
      }

      // Direct plan switch (no checkout needed)
      if (response.upgraded || response.isPaidNow) {
        await dispatch(checkPayment());
        setLoading(false);
        showSuccessToast(response.message || "プランを切り替えました。");
        return;
      }

      setLoading(false);
    } catch (err: any) {
      console.error("Checkout error:", err);
      const conflictMessage =
        err?.response?.status === 409
          ? err.response.data?.error?.message
          : null;
      setError(
        conflictMessage ||
          "お支払いの手続きを始められませんでした。時間をおいて、もう一度お試しください。",
      );
      setLoading(false);
      setAutoCheckoutInProgress(false);
    }
  };

  if (autoCheckoutInProgress) {
    return (
      <Box
        role="status"
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          gap: 2,
          bgcolor: "background.default",
        }}
      >
        <CircularProgress />
        <Typography variant="body1" color="text.secondary">
          お支払い画面を準備しています…
        </Typography>
      </Box>
    );
  }

  const statusLabel = (planId: MembershipPlanId): string | null => {
    if (!hasSubscription || currentPlan !== planId) return null;
    if (status !== "active" && status !== "trialing") return "解約済み";
    return "利用中";
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Box
        component="header"
        sx={{
          bgcolor: "background.default",
          borderBottom: `1px solid ${colors.lineStrong}`,
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            minHeight: 60,
            gap: 2,
          }}
        >
          <Box
            component={RouterLink}
            to="/dashboard"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: 44,
              fontWeight: 700,
              letterSpacing: "0.04em",
              color: "text.primary",
              textDecoration: "none",
              borderRadius: 1,
            }}
          >
            Nipporia AI Academy
          </Box>
          <Button
            startIcon={<Logout aria-hidden />}
            onClick={handleLogout}
            sx={{ color: "text.secondary", flexShrink: 0 }}
          >
            ログアウト
          </Button>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: { xs: 5, md: 8 } }}>
        <Box textAlign="center" sx={{ mb: { xs: 4, md: 5 } }}>
          <Typography variant="h3" component="h1" gutterBottom>
            {hasSubscription ? "サブスクリプション管理" : "プランを選ぶ"}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            メンバーになると、すべてのレッスンを見られます。コミュニティへの投稿やコメントもできます。
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 3,
          }}
        >
          {PLANS.map((plan) => {
            const buttonState = getButtonState(plan.id);
            const label = statusLabel(plan.id);
            const isBusy = loading && selectedPlan === plan.id;
            const highlighted = hasSubscription
              ? currentPlan === plan.id
              : Boolean(plan.badge);

            return (
              <Card
                key={plan.id}
                component="section"
                aria-labelledby={`plan-${plan.id}`}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  borderWidth: highlighted ? 2 : 1,
                  borderColor: highlighted ? colors.accent : colors.line,
                }}
              >
                <CardContent
                  sx={{
                    p: { xs: 3, md: 4 },
                    display: "flex",
                    flexDirection: "column",
                    flexGrow: 1,
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="baseline"
                    spacing={1}
                    sx={{ mb: 2 }}
                  >
                    <Typography
                      id={`plan-${plan.id}`}
                      variant="h5"
                      component="h2"
                    >
                      {plan.name}
                    </Typography>
                    {(label || plan.badge) && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: colors.accentHover,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {label || plan.badge}
                      </Typography>
                    )}
                  </Stack>

                  <Box sx={{ mb: 3 }}>
                    <Stack direction="row" alignItems="baseline" spacing={1}>
                      <Typography
                        component="p"
                        sx={{
                          fontSize: { xs: "2.25rem", md: "2.5rem" },
                          fontWeight: 700,
                          lineHeight: 1.3,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {formatYen(plan.price)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {plan.periodLabel}（税込）
                      </Typography>
                    </Stack>
                  </Box>

                  <Divider sx={{ mb: 2.5 }} />

                  <Stack
                    component="ul"
                    spacing={1.25}
                    sx={{ listStyle: "none", p: 0, m: 0, mb: 4, flexGrow: 1 }}
                  >
                    {PLAN_FEATURES.map((feature) => (
                      <Stack
                        component="li"
                        key={feature}
                        direction="row"
                        spacing={1}
                        alignItems="flex-start"
                      >
                        <Check
                          aria-hidden
                          sx={{ color: colors.accent, fontSize: 20, mt: 0.4 }}
                        />
                        <Typography variant="body1">{feature}</Typography>
                      </Stack>
                    ))}
                  </Stack>

                  <Button
                    fullWidth
                    variant={buttonState.variant === "current" ? "outlined" : "contained"}
                    size="large"
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={buttonState.disabled || isBusy}
                    aria-busy={isBusy || undefined}
                  >
                    {isBusy ? (
                      <>
                        <CircularProgress size={22} color="inherit" sx={{ mr: 1 }} />
                        手続き中…
                      </>
                    ) : (
                      <>
                        {buttonState.icon}
                        {buttonState.label}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          textAlign="center"
          sx={{ mt: 4 }}
        >
          お支払いは Stripe の画面で行います。
          <br />
          <MuiLink component={RouterLink} to="/tokushoho" sx={{ display: "inline-flex", alignItems: "center", minHeight: 44, mr: 2 }}>
            特定商取引法に基づく表記
          </MuiLink>
          <MuiLink component={RouterLink} to="/terms" sx={{ display: "inline-flex", alignItems: "center", minHeight: 44, mr: 2 }}>
            利用規約
          </MuiLink>
          <MuiLink component={RouterLink} to="/privacy-policy" sx={{ display: "inline-flex", alignItems: "center", minHeight: 44 }}>
            プライバシーポリシー
          </MuiLink>
        </Typography>
      </Container>
    </Box>
  );
};
