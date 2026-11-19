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
} from "@mui/material";
import {
  Check,
  Close,
  Logout,
  TrendingUp,
  TrendingDown,
} from "@mui/icons-material";
import { loadStripe } from "@stripe/stripe-js";
import { AppDispatch, RootState } from "../store/store";
import { useDispatch, useSelector } from "react-redux";
import { paymentService, DiscountStatus } from "../services/paymentService";
import { logout, checkPayment } from "../store/slices/authSlice";
import {
  getStoredPlan,
  clearStoredPlan,
  isValidPlanType,
  PlanType,
} from "../utils/planStorage";
import { useSweetAlert } from "../utils/sweetAlert";
import { colors } from "../theme/theme";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY!);

interface PlanOption {
  id: string;
  name: string;
  regularPrice: number;
  discountedPrice: number;
  currency: string;
  period: string;
  features: {
    title: string;
    included: boolean;
  }[];
  recommended?: boolean;
  savings?: number;
}

const plans: PlanOption[] = [
  {
    id: "standard",
    name: "スタンダードプラン",
    regularPrice: 12500,
    discountedPrice: 8800,
    currency: "JPY",
    period: "month",
    savings: 30,
    features: [
      { title: "すべての講座とレッスン", included: true },
      { title: "コミュニティへの投稿とコメント", included: true },
    ],
  },
  {
    id: "premium",
    name: "プレミアムプラン",
    regularPrice: 35000,
    discountedPrice: 24500,
    currency: "JPY",
    period: "month",
    savings: 30,
    recommended: true,
    features: [
      { title: "すべての講座とレッスン", included: true },
      { title: "コミュニティへの投稿とコメント", included: true },
    ],
  },
];

// Plan hierarchy for determining upgrade vs downgrade
const PLAN_HIERARCHY: Record<string, number> = {
  standard: 1,
  premium: 2,
};

type ButtonVariant =
  | "subscribe"
  | "payNow"
  | "upgrade"
  | "downgrade"
  | "current";

interface ButtonState {
  disabled: boolean;
  label: string;
  variant: ButtonVariant;
  icon?: React.ReactNode;
}

export const SubscriptionPage: React.FC = () => {
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();

  const [selectedPlan, setSelectedPlan] = useState<string>("standard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { showSuccessToast } = useSweetAlert();
  const [discountStatus, setDiscountStatus] = useState<DiscountStatus | null>(
    null,
  );
  const [loadingDiscount, setLoadingDiscount] = useState(true);
  const [autoCheckoutInProgress, setAutoCheckoutInProgress] = useState(false);
  const [, setHasPreSelectedPlan] = useState(false);

  const {
    hasSubscription,
    currentPlan,
    isTrialing,
    status,
    isInFreeTrial,
    freeTrialExpired,
  } = useSelector((state: RootState) => state.auth);

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
    fetchDiscountStatus();

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
      !loadingDiscount &&
      !autoCheckoutTriggered.current &&
      !hasSubscription
    ) {
      autoCheckoutTriggered.current = true;
      setAutoCheckoutInProgress(true);
      clearStoredPlan();
      handleSelectPlan(autoCheckoutPlan);
    }
  }, [loadingDiscount, getAutoCheckoutPlan, hasSubscription]);

  const handleLogout = () => {
    dispatch(logout());
  };

  const fetchDiscountStatus = async () => {
    try {
      const status = await paymentService.checkDiscountStatus();
      setDiscountStatus(status);
    } catch (err) {
      // Error silently handled
    } finally {
      setLoadingDiscount(false);
    }
  };

  /**
   * Determine button state for each plan
   */
  const getButtonState = (planId: string): ButtonState => {
    const isCurrentPlan = currentPlan === planId;

    // User is in free trial (no credit card) OR has expired trial - show Subscribe
    if (isInFreeTrial || freeTrialExpired) {
      return {
        disabled: false,
        label: freeTrialExpired ? "メンバーになる" : "有料プランに切り替える",
        variant: "subscribe",
      };
    }

    // No subscription - show normal subscribe button
    if (!hasSubscription || !currentPlan) {
      return {
        disabled: false,
        label: "メンバーになる",
        variant: "subscribe",
      };
    }

    // ===== CASE 2: Subscription is CANCELED =====
    if (status !== "active" && status !== "trialing") {
      return {
        disabled: false,
        label: isCurrentPlan ? "このプランを再開する" : "このプランで登録する",
        variant: "subscribe",
      };
    }

    // Current plan + Trialing → "Pay Now"
    if (isCurrentPlan && isTrialing) {
      return {
        disabled: false,
        label: "今すぐ支払う",
        variant: "payNow",
      };
    }

    // Current plan + Active → Disabled
    if (isCurrentPlan && !isTrialing) {
      return {
        disabled: true,
        label: "利用中のプラン",
        variant: "current",
      };
    }

    // Different plan - check if upgrade or downgrade
    const currentHierarchy = PLAN_HIERARCHY[currentPlan] || 0;
    const targetHierarchy = PLAN_HIERARCHY[planId] || 0;

    if (targetHierarchy > currentHierarchy) {
      // UPGRADE
      return {
        disabled: false,
        label: "このプランに変更する",
        variant: "upgrade",
        icon: <TrendingUp sx={{ fontSize: 18, mr: 1 }} aria-hidden />,
      };
    } else {
      // DOWNGRADE
      return {
        disabled: false,
        label: "このプランに変更する",
        variant: "downgrade",
        icon: <TrendingDown sx={{ fontSize: 18, mr: 1 }} aria-hidden />,
      };
    }
  };

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId);
    setError("");
    setLoading(true);

    try {
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Stripe を読み込めませんでした。");
      }

      const plan = plans.find((p) => p.id === planId);
      if (!plan) {
        throw new Error("プランを選び直してください。");
      }

      const planTypeMap: {
        [key: string]:
          | "monthly"
          | "yearly"
          | "monthlySpecial"
          | "standard"
          | "premium";
      } = {
        standard: "standard",
        premium: "premium",
      };

      // Note: Stripe trials are disabled. Trials are only managed in the application code.
      const response = await paymentService.createCheckoutSession({
        planType: planTypeMap[planId],
        mode: "subscription",
        successUrl: `${window.location.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/subscription`,
        metadata: {
          plan: planId,
        },
        hasTrial: false,
      });

      console.log("Checkout session response:", response);

      // Handle checkout redirect FIRST (takes priority over direct change)
      // When a checkout session is created (e.g. no payment method on file),
      // the user must complete payment on Stripe before the change takes effect.
      if (response.sessionId) {
        const result = await stripe.redirectToCheckout({
          sessionId: response.sessionId,
        });

        if (result.error) {
          throw new Error(result.error.message);
        }

        setLoading(false);
        return;
      }

      // Handle direct upgrade/downgrade or pay now (no checkout needed)
      if (response.upgraded || response.isPaidNow) {
        // Refresh subscription status in Redux FIRST so the UI re-renders
        await dispatch(checkPayment());

        setLoading(false);

        // The API message is in English, so show our own text.
        showSuccessToast(
          response.isPaidNow
            ? "お支払いが済みました。サブスクリプションが有効になりました。"
            : "プランを変更しました。",
        );

        return;
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      setError(
        "お支払いの手続きを始められませんでした。時間をおいて、もう一度お試しください。",
      );
      setLoading(false);
      setAutoCheckoutInProgress(false);
    }
  };

  const formatPrice = (price: number, currency: string = "JPY") => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const isDiscountActive = discountStatus?.isEligible ?? false;



  if (loadingDiscount || autoCheckoutInProgress) {
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
          {autoCheckoutInProgress
            ? "お支払い画面を準備しています…"
            : "読み込み中…"}
        </Typography>
      </Box>
    );
  }

  const statusLabel = (planId: string): string | null => {
    if (currentPlan !== planId) return null;
    if (isTrialing || isInFreeTrial) return "お試し中";
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

        {isDiscountActive && discountStatus?.limit ? (
          <Typography
            variant="body2"
            textAlign="center"
            sx={{ mb: 4, color: colors.accentHover, fontWeight: 700 }}
          >
            割引価格は先着{discountStatus.limit}名までです。
          </Typography>
        ) : null}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 3,
          }}
        >
          {plans.map((plan) => {
            const buttonState = getButtonState(plan.id);
            const isCurrentPlanCard = currentPlan === plan.id;
            const currentPrice = isDiscountActive
              ? plan.discountedPrice
              : plan.regularPrice;
            const showDiscount =
              isDiscountActive && plan.discountedPrice < plan.regularPrice;
            const label = statusLabel(plan.id);
            const isBusy = loading && selectedPlan === plan.id;
            const highlighted = isCurrentPlanCard || plan.recommended;

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
                    {(label || plan.recommended) && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: colors.accentHover,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {label || "おすすめ"}
                      </Typography>
                    )}
                  </Stack>

                  <Box sx={{ mb: 3 }}>
                    {showDiscount && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ textDecoration: "line-through" }}
                      >
                        通常 {formatPrice(plan.regularPrice, plan.currency)}
                      </Typography>
                    )}
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
                        {formatPrice(currentPrice, plan.currency)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        / 月
                      </Typography>
                    </Stack>
                    {showDiscount && plan.savings ? (
                      <Typography
                        variant="body2"
                        sx={{ color: colors.accentHover, fontWeight: 700 }}
                      >
                        通常より{plan.savings}%安くなります
                      </Typography>
                    ) : null}
                  </Box>

                  <Divider sx={{ mb: 2.5 }} />

                  <Stack
                    component="ul"
                    spacing={1.25}
                    sx={{ listStyle: "none", p: 0, m: 0, mb: 4, flexGrow: 1 }}
                  >
                    {plan.features.map((feature, featureIndex) => (
                      <Stack
                        component="li"
                        key={featureIndex}
                        direction="row"
                        spacing={1}
                        alignItems="flex-start"
                      >
                        {feature.included ? (
                          <Check
                            aria-hidden
                            sx={{ color: colors.accent, fontSize: 20, mt: 0.4 }}
                          />
                        ) : (
                          <Close
                            aria-hidden
                            sx={{ color: "text.secondary", fontSize: 20, mt: 0.4 }}
                          />
                        )}
                        <Typography
                          variant="body1"
                          color={feature.included ? "text.primary" : "text.secondary"}
                        >
                          {feature.title}
                        </Typography>
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
        </Typography>
      </Container>
    </Box>
  );
};
