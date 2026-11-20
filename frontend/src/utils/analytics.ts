// frontend/src/utils/analytics.ts
//
// Events for Google Analytics 4 (G-Z8BNJK5E36) and the Google Ads conversion
// "Academy subscription purchase". The Google tag itself is loaded in
// public/index.html (and in landing/claude-code/index.html for the LP).
// Every call is a no-op when the tag is blocked or not loaded.

import { PLANS } from "./plans";

/** Google Ads conversion action: Academy subscription purchase (Subscribe goal). */
const ADS_PURCHASE_SEND_TO = "AW-18058706051/2hYZCIiP7LsdEIP5h6ND";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const gtag = (...args: unknown[]): void => {
  if (typeof window.gtag === "function") window.gtag(...args);
};

const planItem = (plan: string, price: number, name?: string | null) => ({
  item_id: `subscription_${plan}`,
  item_name: name || PLANS.find((p) => p.id === plan)?.name || plan,
  item_category: "Subscription",
  price,
  quantity: 1,
});

/** A new account was created. */
export function trackSignUp(method: "email" | "google"): void {
  gtag("event", "sign_up", { method });
}

/** The visitor is being sent to Stripe Checkout for a plan. */
export function trackBeginCheckout(plan: string): void {
  const price = PLANS.find((p) => p.id === plan)?.price;
  if (price === undefined) return;
  gtag("event", "begin_checkout", {
    currency: "JPY",
    value: price,
    items: [planItem(plan, price)],
  });
}

/**
 * First paid subscription. Sends the GA4 purchase and the Google Ads conversion.
 * The transaction ID stops a reload of the success page from counting twice.
 */
export function trackPurchase(p: {
  transactionId: string;
  value: number;
  currency: string;
  plan: string;
  name?: string | null;
}): void {
  const currency = p.currency.toUpperCase();
  gtag("event", "purchase", {
    transaction_id: p.transactionId,
    value: p.value,
    currency,
    items: [planItem(p.plan, p.value, p.name)],
  });
  gtag("event", "conversion", {
    send_to: ADS_PURCHASE_SEND_TO,
    value: p.value,
    currency,
    transaction_id: p.transactionId,
  });
}
