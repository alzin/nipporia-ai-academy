// Local stand-in for `stripe listen` (for machines where the Stripe CLI can't run).
// TEST MODE ONLY. Polls Stripe for new events, keeps the ones that belong to this app,
// signs them with STRIPE_WEBHOOK_SECRET and posts them to the local webhook endpoint.
// Usage: npm run dev:stripe-listen   (backend must be running)
import 'dotenv/config';
import Stripe from 'stripe';

const secretKey = process.env.STRIPE_SECRET_KEY || '';
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
const target = process.env.STRIPE_FORWARD_TO || 'http://localhost:5000/api/payment/webhook';
const ourPrices = [process.env.STRIPE_MONTHLY_PRICE_ID, process.env.STRIPE_YEARLY_PRICE_ID].filter(Boolean) as string[];

const TYPES = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
]);

if (!secretKey.startsWith('sk_test_')) {
  console.error('Refusing to run: STRIPE_SECRET_KEY must be a test key (sk_test_...).');
  process.exit(1);
}
if (!webhookSecret) {
  console.error('Set STRIPE_WEBHOOK_SECRET in backend/.env (any random whsec_... value for local use).');
  process.exit(1);
}

const stripe = new Stripe(secretKey);

function belongsToApp(event: Stripe.Event): boolean {
  const json = JSON.stringify(event.data.object);
  if (ourPrices.some((p) => json.includes(p))) return true;
  if (event.type === 'checkout.session.completed') {
    const s = event.data.object as Stripe.Checkout.Session;
    return ['monthly', 'yearly'].includes(s.metadata?.planType || '') && !!s.metadata?.userId;
  }
  return false;
}

async function forward(event: Stripe.Event) {
  const payload = JSON.stringify(event);
  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: webhookSecret });
  const res = await fetch(target, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Stripe-Signature': signature },
    body: payload,
  });
  console.log(`${new Date().toLocaleTimeString()}  ${event.type}  ${event.id}  -> ${res.status}`);
}

async function main() {
  const seen = new Set<string>();
  let since = Math.floor(Date.now() / 1000) - 5;
  console.log(`Forwarding Stripe test events to ${target} (Ctrl+C to stop)`);
  for (;;) {
    try {
      const events = await stripe.events.list({ created: { gte: since }, limit: 100 });
      for (const event of events.data.reverse()) {
        if (seen.has(event.id)) continue;
        seen.add(event.id);
        since = Math.max(since, event.created - 2);
        if (TYPES.has(event.type) && belongsToApp(event)) await forward(event);
      }
    } catch (e: any) {
      console.error('poll error:', e.message);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
}

main();
