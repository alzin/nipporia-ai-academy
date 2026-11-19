// frontend/src/components/subscription/SubscriptionManagement.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Divider,
} from "@mui/material";
import {
  Check,
  TrendingUp,
  TrendingDown,
  CreditCard,
  ArrowForward,
  Refresh,
  Lock,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store/store";
import { paymentService, DiscountStatus } from "../../services/paymentService";
import { subscriptionService } from "../../services/subscriptionService";
import { checkPayment } from "../../store/slices/authSlice";
import { useSweetAlert } from "../../utils/sweetAlert";
import { formatJaDate } from "../../utils/formatDateAndTime";
import { colors } from "../../theme/theme";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY!);

// ─── Plan data ────────────────────────────────────────────────
interface PlanInfo {
  id: string;
  name: string;
  regularPrice: number;
  discountedPrice: number;
  currency: string;
  features: string[];
  recommended?: boolean;
  savings?: number;
}

const PLANS: PlanInfo[] = [
  {
    id: "standard",
    name: "スタンダード",
    regularPrice: 12500,
    discountedPrice: 8800,
    currency: "JPY",
    savings: 30,
    features: ["すべての講座とレッスン", "コミュニティへの投稿とコメント"],
  },
  {
    id: "premium",
    name: "プレミアム",
    regularPrice: 35000,
    discountedPrice: 24500,
    currency: "JPY",
    savings: 30,
    recommended: true,
    features: ["すべての講座とレッスン", "コミュニティへの投稿とコメント"],
  },
];

const PLAN_HIERARCHY: Record<string, number> = {
  standard: 1,
  premium: 2,
};

// ─── Helpers ──────────────────────────────────────────────────
const formatPrice = (price: number, currency: string = "JPY") =>
  new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);

// ─── Component ────────────────────────────────────────────────
export const SubscriptionManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { showSuccessToast, showError } = useSweetAlert();

  const {
    hasSubscription,
    currentPlan,
    isTrialing,
    status,
    isInFreeTrial,
    freeTrialExpired,
    freeTrialEndDate,
  } = useSelector((state: RootState) => state.auth);
  const { user } = useSelector((state: RootState) => state.auth);

  const [loading, setLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [discountStatus, setDiscountStatus] = useState<DiscountStatus | null>(
    null,
  );

  // Fetch discount status
  useEffect(() => {
    (async () => {
      try {
        const ds = await paymentService.checkDiscountStatus();
        setDiscountStatus(ds);
      } catch {
        /* silent */
      }
    })();
  }, []);

  // ── Determine action type for a plan ──────────────────────
  type ActionType =
    | "current"
    | "upgrade"
    | "downgrade"
    | "subscribe"
    | "reactivate"
    | "payNow";

  const getAction = (planId: string): ActionType => {
    if (isInFreeTrial || freeTrialExpired) return "subscribe";
    if (!hasSubscription || !currentPlan) return "subscribe";
    if (status !== "active" && status !== "trialing") {
      return currentPlan === planId ? "reactivate" : "subscribe";
    }
    if (currentPlan === planId && isTrialing) return "payNow";
    if (currentPlan === planId) return "current";
    const curr = PLAN_HIERARCHY[currentPlan] || 0;
    const tgt = PLAN_HIERARCHY[planId] || 0;
    return tgt > curr ? "upgrade" : "downgrade";
  };

  const actionMeta: Record<ActionType, { label: string; icon: React.ReactNode }> = {
    current: {
      label: "利用中のプラン",
      icon: <Check aria-hidden sx={{ fontSize: 18 }} />,
    },
    upgrade: {
      label: "このプランに変更する",
      icon: <TrendingUp aria-hidden sx={{ fontSize: 18 }} />,
    },
    downgrade: {
      label: "このプランに変更する",
      icon: <TrendingDown aria-hidden sx={{ fontSize: 18 }} />,
    },
    subscribe: {
      label: "このプランで登録する",
      icon: <ArrowForward aria-hidden sx={{ fontSize: 18 }} />,
    },
    reactivate: {
      label: "このプランを再開する",
      icon: <Refresh aria-hidden sx={{ fontSize: 18 }} />,
    },
    payNow: {
      label: "今すぐ支払う",
      icon: <CreditCard aria-hidden sx={{ fontSize: 18 }} />,
    },
  };

  // ── Handle plan selection (upgrade/downgrade/subscribe) ───
  const handleSelectPlan = async (planId: string) => {
    setLoading(planId);
    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe failed to load");

      const planTypeMap: Record<
        string,
        "monthly" | "yearly" | "monthlySpecial" | "standard" | "premium"
      > = { standard: "standard", premium: "premium" };

      const response = await paymentService.createCheckoutSession({
        planType: planTypeMap[planId],
        mode: "subscription",
        successUrl: `${window.location.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        // /profile was removed; come back to this page instead.
        cancelUrl: `${window.location.origin}/manage-subscription`,
        metadata: { plan: planId },
        hasTrial: false,
      });

      // Direct upgrade/downgrade/payNow — no redirect needed
      if (response.isUpgrade || response.isPaidNow || response.isDowngrade) {
        // The API message is in English, so show our own text.
        showSuccessToast(
          response.isPaidNow
            ? "お支払いが済みました。サブスクリプションが有効になりました。"
            : "プランを変更しました。",
        );
        await dispatch(checkPayment());
        setLoading(null);
        return;
      }

      // Stripe checkout redirect
      if (response.sessionId) {
        const result = await stripe.redirectToCheckout({
          sessionId: response.sessionId,
        });
        if (result.error) throw new Error(result.error.message);
      }
    } catch (err: any) {
      console.error("Subscription error:", err);
      showError(
        "手続きができませんでした",
        "時間をおいて、もう一度お試しください。",
      );
    } finally {
      setLoading(null);
    }
  };

  // ── Open Stripe Customer Portal (billing / cancel) ────────
  const handleManageViaPortal = async () => {
    setPortalLoading(true);
    try {
      const data = await subscriptionService.createCustomerPortal();
      window.location.href = data.session.url;
    } catch {
      showError(
        "お支払い情報のページを開けませんでした",
        "時間をおいて、もう一度お試しください。",
      );
    } finally {
      setPortalLoading(false);
    }
  };

  // ── Derived state ─────────────────────────────────────────
  const currentPlanInfo = PLANS.find((p) => p.id === currentPlan);
  const isActive = status === "active" || status === "trialing";
  const isCanceled =
    hasSubscription && status !== "active" && status !== "trialing";
  const isDiscountActive = discountStatus?.isEligible ?? false;

  // Don't show for admins
  if (user?.role === "ADMIN") return null;

  const statusText = isInFreeTrial
    ? "無料のお試し中"
    : isCanceled
      ? "解約済み"
      : isActive
        ? isTrialing
          ? "お試し中"
          : "利用中"
        : null;

  // ─── RENDER ───────────────────────────────────────────────
  return (
    <Box>
      {/* ── Status banner ─────────────────────────────────── */}
      {(freeTrialExpired || isCanceled) && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {freeTrialExpired
            ? `無料のお試し期間は${freeTrialEndDate ? `${formatJaDate(freeTrialEndDate)}に` : ""}終わりました。続けて学ぶには、プランを選んでください。`
            : "サブスクリプションは解約されています。下のプランから再開するか、新しく選んでください。"}
        </Alert>
      )}

      {/* ── Current plan summary card ─────────────────────── */}
      {(hasSubscription || isInFreeTrial) && (
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={2}
            >
              <Box>
                <Typography variant="body2" color="text.secondary">
                  現在のプラン
                </Typography>
                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="baseline"
                  flexWrap="wrap"
                  useFlexGap
                >
                  <Typography variant="h5" component="h2">
                    {currentPlanInfo?.name ||
                      (isInFreeTrial ? "無料のお試し" : "プランなし")}
                  </Typography>
                  {statusText && (
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        color: isCanceled ? "error.main" : colors.accentHover,
                      }}
                    >
                      {statusText}
                    </Typography>
                  )}
                </Stack>
              </Box>

              {hasSubscription && isActive && !isInFreeTrial && (
                <Button
                  variant="outlined"
                  startIcon={
                    portalLoading ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <CreditCard aria-hidden sx={{ fontSize: 18 }} />
                    )
                  }
                  onClick={handleManageViaPortal}
                  disabled={portalLoading}
                  sx={{ color: "text.primary", flexShrink: 0 }}
                >
                  お支払いと解約
                </Button>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* ── Plan comparison cards ─────────────────────────── */}
      <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
        {hasSubscription ? "プランを変える" : "プランを選ぶ"}
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 3,
        }}
      >
        {PLANS.map((plan) => {
          const action = getAction(plan.id);
          const meta = actionMeta[action];
          const isCurrent = currentPlan === plan.id;
          const isCurrentActive = isCurrent && isActive;
          const showDiscount =
            isDiscountActive && plan.discountedPrice < plan.regularPrice;
          const price = showDiscount ? plan.discountedPrice : plan.regularPrice;
          const tag = isCurrentActive ? "利用中" : plan.recommended ? "おすすめ" : null;

          return (
            <Card
              key={plan.id}
              component="section"
              aria-labelledby={`manage-plan-${plan.id}`}
              sx={{
                display: "flex",
                flexDirection: "column",
                borderWidth: isCurrentActive ? 2 : 1,
                borderColor: isCurrentActive ? colors.accent : colors.line,
              }}
            >
              <CardContent
                sx={{
                  p: { xs: 2.5, md: 3.5 },
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
                  mb={1.5}
                >
                  <Typography
                    id={`manage-plan-${plan.id}`}
                    variant="subtitle1"
                    component="h3"
                    fontWeight={700}
                  >
                    {plan.name}
                  </Typography>
                  {tag && (
                    <Typography
                      variant="body2"
                      sx={{ color: colors.accentHover, fontWeight: 700 }}
                    >
                      {tag}
                    </Typography>
                  )}
                </Stack>

                {/* Price */}
                <Box mb={2.5}>
                  {showDiscount && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ textDecoration: "line-through" }}
                    >
                      通常 {formatPrice(plan.regularPrice, plan.currency)}
                    </Typography>
                  )}
                  <Stack direction="row" alignItems="baseline" spacing={0.75}>
                    <Typography
                      component="p"
                      sx={{
                        fontSize: "2rem",
                        fontWeight: 700,
                        lineHeight: 1.3,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {formatPrice(price, plan.currency)}
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

                {/* Features */}
                <Stack
                  component="ul"
                  spacing={1.25}
                  sx={{ listStyle: "none", p: 0, m: 0, mb: 3, flexGrow: 1 }}
                >
                  {plan.features.map((feat, i) => (
                    <Stack
                      component="li"
                      key={i}
                      direction="row"
                      spacing={1}
                      alignItems="flex-start"
                    >
                      <Check
                        aria-hidden
                        sx={{
                          fontSize: 18,
                          color: colors.accent,
                          mt: 0.4,
                          flexShrink: 0,
                        }}
                      />
                      <Typography variant="body2">{feat}</Typography>
                    </Stack>
                  ))}
                </Stack>

                {/* Action button */}
                <Button
                  fullWidth
                  variant={action === "current" ? "outlined" : "contained"}
                  disabled={action === "current" || loading === plan.id}
                  onClick={() => handleSelectPlan(plan.id)}
                  startIcon={
                    loading === plan.id ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      meta.icon
                    )
                  }
                >
                  {loading === plan.id ? "手続き中…" : meta.label}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      <Stack
        direction="row"
        spacing={0.75}
        justifyContent="center"
        alignItems="center"
        mt={4}
      >
        <Lock aria-hidden sx={{ fontSize: 16, color: "text.secondary" }} />
        <Typography variant="body2" color="text.secondary">
          お支払いは Stripe で処理します。解約は「お支払いと解約」からいつでもできます。
        </Typography>
      </Stack>
    </Box>
  );
};
