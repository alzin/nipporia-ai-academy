// One-time Stripe setup for production (live mode). Safe to run again: it reuses
// what already exists (prices by lookup key, webhook by URL, portal by metadata).
//
// Creates, in the account of STRIPE_SECRET_KEY:
//   - product 「Nipporia AI Academy メンバーシップ」 with 月額 ¥4,980 and 年額 ¥49,800 (tax included)
//   - a customer portal configuration (cancel at period end, switch plan, update card, invoices)
//   - a webhook endpoint for <SITE_URL>/api/payment/webhook
//
// Usage: STRIPE_SECRET_KEY=sk_live_... SITE_URL=https://academy.nipporia.com \
//        npx ts-node --transpile-only src/scripts/setupStripeLive.ts [--webhook-secret-file <path>]
// Prints the IDs to put in the environment. The webhook signing secret is only
// shown by Stripe when the endpoint is created; it is written to --webhook-secret-file
// (never printed).
import fs from 'fs';
import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY || '';
const site = (process.env.SITE_URL || 'https://academy.nipporia.com').replace(/\/+$/, '');
const args = process.argv.slice(2);
const secretFile = args.includes('--webhook-secret-file') ? args[args.indexOf('--webhook-secret-file') + 1] : undefined;

const APP = 'nipporia-ai-academy';
const WEBHOOK_EVENTS: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
];

async function main() {
  if (!key.startsWith('sk_live_') && !key.startsWith('rk_live_') && !args.includes('--allow-test')) {
    throw new Error('STRIPE_SECRET_KEY must be a live key (sk_live_...). Pass --allow-test to try it in test mode.');
  }
  const stripe = new Stripe(key);

  // ---------- product + prices ----------
  const lookup = { monthly: 'nipporia_monthly', yearly: 'nipporia_yearly' };
  const existing = await stripe.prices.list({ lookup_keys: Object.values(lookup), active: true, expand: ['data.product'] });
  let monthly = existing.data.find((p) => p.lookup_key === lookup.monthly);
  let yearly = existing.data.find((p) => p.lookup_key === lookup.yearly);

  let productId = (monthly?.product as Stripe.Product | undefined)?.id || (yearly?.product as Stripe.Product | undefined)?.id;
  if (!productId) {
    const product = await stripe.products.create({
      name: 'Nipporia AI Academy メンバーシップ',
      description: 'すべての講座のレッスンと、コミュニティへの投稿・コメントが使えます。',
      metadata: { app: APP },
    });
    productId = product.id;
  }
  if (!monthly) {
    monthly = await stripe.prices.create({
      product: productId, currency: 'jpy', unit_amount: 4980, tax_behavior: 'inclusive',
      recurring: { interval: 'month' }, nickname: '月額', lookup_key: lookup.monthly, metadata: { app: APP },
    });
  }
  if (!yearly) {
    yearly = await stripe.prices.create({
      product: productId, currency: 'jpy', unit_amount: 49800, tax_behavior: 'inclusive',
      recurring: { interval: 'year' }, nickname: '年額', lookup_key: lookup.yearly, metadata: { app: APP },
    });
  }

  // ---------- customer portal ----------
  const portals = await stripe.billingPortal.configurations.list({ limit: 100 });
  let portal = portals.data.find((c) => c.metadata?.app === APP && c.active);
  const portalParams: Stripe.BillingPortal.ConfigurationCreateParams = {
    business_profile: {
      headline: 'Nipporia AI Academy のメンバーシップ',
      privacy_policy_url: `${site}/privacy-policy`,
    },
    default_return_url: `${site}/manage-subscription`,
    features: {
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      customer_update: { enabled: false },
      subscription_cancel: { enabled: true, mode: 'at_period_end', proration_behavior: 'none' },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ['price'],
        proration_behavior: 'create_prorations',
        products: [{ product: productId, prices: [monthly.id, yearly.id] }],
      },
    },
    metadata: { app: APP },
  };
  if (!portal) {
    portal = await stripe.billingPortal.configurations.create(portalParams);
  }

  // ---------- webhook ----------
  const url = `${site}/api/payment/webhook`;
  const hooks = await stripe.webhookEndpoints.list({ limit: 100 });
  let hook = hooks.data.find((h) => h.url === url);
  let createdSecret: string | undefined;
  if (!hook) {
    hook = await stripe.webhookEndpoints.create({
      url,
      enabled_events: WEBHOOK_EVENTS,
      description: 'Nipporia AI Academy (production)',
      metadata: { app: APP },
    });
    createdSecret = hook.secret;
  }
  if (createdSecret) {
    if (!secretFile) throw new Error('Webhook created but no --webhook-secret-file given; delete it in Stripe and run again.');
    fs.writeFileSync(secretFile, createdSecret, { mode: 0o600 });
  }

  console.log(JSON.stringify({
    mode: key.includes('_live_') ? 'live' : 'test',
    STRIPE_MONTHLY_PRICE_ID: monthly.id,
    STRIPE_YEARLY_PRICE_ID: yearly.id,
    STRIPE_PORTAL_CONFIGURATION_ID: portal.id,
    webhook: { id: hook.id, url: hook.url, newSecretWritten: !!createdSecret },
  }, null, 2));
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
