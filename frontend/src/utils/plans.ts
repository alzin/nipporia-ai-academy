// frontend/src/utils/plans.ts
// The two membership plans. Prices are tax included and must match the Stripe prices
// behind STRIPE_MONTHLY_PRICE_ID / STRIPE_YEARLY_PRICE_ID on the backend.

export type MembershipPlanId = "monthly" | "yearly";

export interface MembershipPlan {
  id: MembershipPlanId;
  name: string;
  price: number;
  /** Shown after the price, e.g. "/ 月" */
  periodLabel: string;
  /** Short note shown on the card, e.g. "2か月分お得" */
  badge?: string;
}

export const PLAN_FEATURES: string[] = [
  "すべての講座のすべてのレッスンを見られます",
  "これから増える講座も追加料金なしで見られます",
  "コミュニティで質問や投稿ができます",
  "いつでも解約できます（次の更新日まで使えます）",
];

export const PLANS: MembershipPlan[] = [
  {
    id: "monthly",
    name: "月額プラン",
    price: 4980,
    periodLabel: "/ 月",
  },
  {
    id: "yearly",
    name: "年額プラン",
    price: 49800,
    periodLabel: "/ 年",
    badge: "2か月分お得",
  },
];

/** Monthly → yearly counts as an upgrade. */
export const PLAN_HIERARCHY: Record<string, number> = {
  monthly: 1,
  yearly: 2,
};

export const getPlanName = (planId: string | null | undefined): string | null =>
  PLANS.find((p) => p.id === planId)?.name ?? null;

export const formatYen = (price: number): string =>
  new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
