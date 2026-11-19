// frontend/src/components/subscription/SubscriptionManagement.tsx
import React, { useState } from "react";
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
  SwapHoriz,
  CreditCard,
  ArrowForward,
  Refresh,
  Lock,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store/store";
import { paymentService } from "../../services/paymentService";
import { subscriptionService } from "../../services/subscriptionService";
import { checkPayment } from "../../store/slices/authSlice";
import { useSweetAlert } from "../../utils/sweetAlert";
import { colors } from "../../theme/theme";
import {
  PLANS,
  PLAN_FEATURES,
  MembershipPlanId,
  formatYen,
  getPlanName,
} from "../../utils/plans";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY!);

// ─── Component ────────────────────────────────────────────────
export const SubscriptionManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { showSuccessToast, showError } = useSweetAlert();

  const { hasSubscription, currentPlan, status } = useSelector(
    (state: RootState) => state.auth,
  );
  const { user } = useSelector((state: RootState) => state.auth);

  const [loading, setLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  // ── Determine action type for a plan ──────────────────────
  type ActionType = "current" | "change" | "subscribe" | "reactivate";

  const getAction = (planId: MembershipPlanId): ActionType => {
    if (!hasSubscription || !currentPlan) return "subscribe";
    if (status !== "active" && status !== "trialing") {
      return currentPlan === planId ? "reactivate" : "subscribe";
    }
    if (currentPlan === planId) return "current";
    return "change";
  };

  const actionMeta: Record<ActionType, { label: string; icon: React.ReactNode }> = {
    current: {
      label: "利用中のプラン",
      icon: <Check aria-hidden sx={{ fontSize: 18 }} />,
    },
    change: {
      label: "このプランに切り替える",
      icon: <SwapHoriz aria-hidden sx={{ fontSize: 18 }} />,
    },
    subscribe: {
      label: "このプランで登録する",
      icon: <ArrowForward aria-hidden sx={{ fontSize: 18 }} />,
    },
    reactivate: {
      label: "このプランを再開する",
      icon: <Refresh aria-hidden sx={{ fontSize: 18 }} />,
    },
  };

  // ── Handle plan selection (upgrade/downgrade/subscribe) ───
  const handleSelectPlan = async (planId: MembershipPlanId) => {
    setLoading(planId);
    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe failed to load");

      const response = await paymentService.createCheckoutSession({
        planType: planId,
        successUrl: `${window.location.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/manage-subscription`,
        metadata: { plan: planId },
      });

      // Checkout redirect first: when a session is returned (e.g. no card on file),
      // the switch only happens after paying on Stripe.
      if (response.sessionId) {
        const result = await stripe.redirectToCheckout({
          sessionId: response.sessionId,
        });
        if (result.error) throw new Error(result.error.message);
        return;
      }

      // Direct switch — no redirect needed
      if (response.upgraded || response.isPaidNow) {
        showSuccessToast(response.message || "プランを切り替えました。");
        await dispatch(checkPayment());
      }
    } catch (err: any) {
      console.error("Subscription error:", err);
      const conflictMessage =
        err?.response?.status === 409
          ? err.response.data?.error?.message
          : null;
      showError(
        "手続きができませんでした",
        conflictMessage || "時間をおいて、もう一度お試しください。",
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
  const currentPlanName = getPlanName(currentPlan);
  const isActive = status === "active" || status === "trialing";
  const isCanceled =
    hasSubscription && status !== "active" && status !== "trialing";

  // Don't show for admins
  if (user?.role === "ADMIN") return null;

  const statusText = isCanceled ? "解約済み" : isActive ? "利用中" : null;

  // ─── RENDER ───────────────────────────────────────────────
  return (
    <Box>
      {/* ── Status banner ─────────────────────────────────── */}
      {isCanceled && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          サブスクリプションは解約されています。下のプランから再開するか、新しく選んでください。
        </Alert>
      )}

      {/* ── Current plan summary card ─────────────────────── */}
      {hasSubscription && (
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
                    {currentPlanName || "プランなし"}
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

              {hasSubscription && isActive && (
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
          const tag = isCurrentActive ? "利用中" : plan.badge ?? null;

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
                      {formatYen(plan.price)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {plan.periodLabel}（税込）
                    </Typography>
                  </Stack>
                </Box>

                <Divider sx={{ mb: 2.5 }} />

                {/* Features */}
                <Stack
                  component="ul"
                  spacing={1.25}
                  sx={{ listStyle: "none", p: 0, m: 0, mb: 3, flexGrow: 1 }}
                >
                  {PLAN_FEATURES.map((feat) => (
                    <Stack
                      component="li"
                      key={feat}
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
