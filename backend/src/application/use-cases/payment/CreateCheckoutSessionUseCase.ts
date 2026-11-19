// backend/src/application/use-cases/payment/CreateCheckoutSessionUseCase.ts
import { ENV_CONFIG } from '../../../infrastructure/config/env.config';
import { SubscriptionRepository } from '../../../infrastructure/database/repositories/SubscriptionRepository';
import { PaymentService } from '../../../infrastructure/services/PaymentService';

export type MembershipPlan = 'monthly' | 'yearly';

export const PLAN_LABELS: Record<MembershipPlan, string> = {
    monthly: '月額プラン',
    yearly: '年額プラン',
};

export interface CreateCheckoutSessionRequest {
    /** Ignored: membership checkout is always a subscription. Kept for request compatibility. */
    mode?: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: any;
    planType?: string;
    email: string;
    userId: string;
}

export interface CreateCheckoutSessionResponse {
    sessionId?: string;
    isUpgrade?: boolean;
    isDowngrade?: boolean;
    upgraded?: boolean;
    isPaidNow?: boolean;
    message?: string;
}

const badRequest = (message: string, statusCode = 400): Error =>
    Object.assign(new Error(message), { statusCode });

export class CreateCheckoutSessionUseCase {
    private readonly PRICE_IDS: Record<MembershipPlan, string> = {
        monthly: ENV_CONFIG.STRIPE_MONTHLY_PRICE_ID || '',
        yearly: ENV_CONFIG.STRIPE_YEARLY_PRICE_ID || '',
    };

    // Plan order for upgrade/downgrade (monthly → yearly is an upgrade)
    private readonly PLAN_HIERARCHY: Record<string, number> = {
        monthly: 1,
        yearly: 2,
    };

    constructor(
        private paymentService: PaymentService,
        private subscriptionRepository: SubscriptionRepository
    ) { }

    async execute(request: CreateCheckoutSessionRequest): Promise<CreateCheckoutSessionResponse> {
        const { successUrl, cancelUrl, metadata, planType, email, userId } = request;

        if (planType !== 'monthly' && planType !== 'yearly') {
            throw badRequest('planType must be "monthly" or "yearly".');
        }

        const priceId = this.PRICE_IDS[planType];
        if (!priceId) {
            throw new Error(`Price ID for plan "${planType}" is not configured.`);
        }

        // Check for existing subscription
        const existingSubscription = await this.subscriptionRepository.findByUserId(userId);

        // ========== EXISTING SUBSCRIPTION LOGIC ==========
        if (
            existingSubscription &&
            existingSubscription.stripeSubscriptionId &&
            existingSubscription.stripeCustomerId &&
            ['active', 'trialing'].includes(existingSubscription.status)
        ) {
            // Verify the Stripe subscription is actually still alive
            // (guards against stale DB status from missed webhooks or expired periods)
            const stripeSubscription = await this.paymentService.retrieveSubscription(
                existingSubscription.stripeSubscriptionId
            );
            const stripeStatus = stripeSubscription?.status;
            const isStripeSubAlive = stripeStatus === 'active' || stripeStatus === 'trialing';

            // Also check if the local period has expired
            const now = new Date();
            const periodEnd = new Date(existingSubscription.currentPeriodEnd);
            const isPeriodExpired = now >= periodEnd;

            if (!isStripeSubAlive || isPeriodExpired) {
                // Stripe subscription is gone or expired — sync DB status and fall through
                // to new-subscription logic below
                console.log(
                    `Subscription ${existingSubscription.stripeSubscriptionId} is no longer valid ` +
                    `(stripeStatus=${stripeStatus}, periodExpired=${isPeriodExpired}). ` +
                    `Treating as new subscription.`
                );

                if (!isStripeSubAlive && existingSubscription.status !== 'canceled') {
                    existingSubscription.status = 'canceled';
                    existingSubscription.updatedAt = new Date();
                    await this.subscriptionRepository.update(existingSubscription);
                }
            } else {
                const currentPlan = existingSubscription.subscriptionPlan;
                const isTrialing = existingSubscription.status === 'trialing';
                const isSamePlan = currentPlan === planType;

                // Same plan + trialing (only possible for old subscriptions) → end trial and start billing
                if (isSamePlan && isTrialing) {
                    return await this.handlePayNow({ existingSubscription });
                }

                // Same plan + active → already subscribed
                if (isSamePlan) {
                    throw badRequest(`すでに${PLAN_LABELS[planType]}に登録しています。`, 409);
                }

                // Different plan → switch (monthly → yearly is an upgrade)
                const currentHierarchy = this.PLAN_HIERARCHY[currentPlan] || 0;
                const newHierarchy = this.PLAN_HIERARCHY[planType];

                return await this.handlePlanChange({
                    existingSubscription,
                    newPlanType: planType,
                    newPriceId: priceId,
                    successUrl,
                    cancelUrl,
                    metadata,
                    email,
                    userId,
                    isUpgrade: newHierarchy > currentHierarchy,
                });
            }
        }

        // ========== NEW SUBSCRIPTION LOGIC ==========
        // No trial: billing starts at checkout (lesson 1 of each course is the free sample).
        const session = await this.paymentService.createCheckoutSession({
            priceId,
            mode: 'subscription',
            successUrl,
            cancelUrl,
            metadata: {
                ...metadata,
                email,
                userId,
                planType,
            },
            customerId: existingSubscription?.stripeCustomerId || null,
        });

        return {
            sessionId: session.id,
            isUpgrade: false,
            isDowngrade: false,
        };
    }

    /**
     * End a (legacy) trial and activate billing immediately.
     */
    private async handlePayNow(params: { existingSubscription: any }): Promise<CreateCheckoutSessionResponse> {
        const { existingSubscription } = params;

        try {
            const updatedStripeSubscription = await this.paymentService.cancelTrialAndActivatePayment(
                existingSubscription.stripeSubscriptionId
            );

            if (!updatedStripeSubscription) {
                throw new Error('Failed to activate subscription');
            }

            // Sync DB now so the status check returns fresh data before the webhook arrives
            existingSubscription.status = 'active';
            existingSubscription.currentPeriodStart = new Date(
                updatedStripeSubscription.items.data[0].current_period_start * 1000
            );
            existingSubscription.currentPeriodEnd = new Date(
                updatedStripeSubscription.items.data[0].current_period_end * 1000
            );
            existingSubscription.updatedAt = new Date();
            await this.subscriptionRepository.update(existingSubscription);

            return {
                isUpgrade: false,
                isDowngrade: false,
                isPaidNow: true,
                upgraded: true,
                message: 'プランを開始しました。',
            };
        } catch (error: any) {
            throw new Error(`Failed to activate subscription: ${error.message}`);
        }
    }

    /**
     * Switch between monthly and yearly.
     */
    private async handlePlanChange(params: {
        existingSubscription: any;
        newPlanType: MembershipPlan;
        newPriceId: string;
        successUrl: string;
        cancelUrl: string;
        metadata?: any;
        email: string;
        userId: string;
        isUpgrade: boolean;
    }): Promise<CreateCheckoutSessionResponse> {
        const {
            existingSubscription, newPlanType, newPriceId, successUrl, cancelUrl, metadata, email, userId, isUpgrade,
        } = params;

        const hasPaymentMethod = await this.paymentService.hasValidPaymentMethod(
            existingSubscription.stripeCustomerId
        );

        // With a saved card (or on a legacy trial), change the price on the existing subscription
        if (hasPaymentMethod || existingSubscription.status === 'trialing') {
            try {
                const updatedStripeSubscription = await this.paymentService.upgradeSubscription({
                    subscriptionId: existingSubscription.stripeSubscriptionId,
                    newPriceId,
                    prorationBehavior: 'create_prorations',
                });

                // Sync DB now so the status check returns fresh data before the webhook arrives
                existingSubscription.subscriptionPlan = newPlanType;
                existingSubscription.status = updatedStripeSubscription.status === 'trialing' ? 'trialing' : 'active';
                existingSubscription.currentPeriodStart = new Date(
                    updatedStripeSubscription.items.data[0].current_period_start * 1000
                );
                existingSubscription.currentPeriodEnd = new Date(
                    updatedStripeSubscription.items.data[0].current_period_end * 1000
                );
                existingSubscription.updatedAt = new Date();
                await this.subscriptionRepository.update(existingSubscription);

                return {
                    isUpgrade,
                    isDowngrade: !isUpgrade,
                    upgraded: true,
                    message: `${PLAN_LABELS[newPlanType]}に切り替えました。使っていない期間の料金は日割りで差し引かれます。`,
                };
            } catch (error: any) {
                console.error('Direct plan change failed:', error.message);
                // Fall through to checkout session creation
            }
        }

        // No saved card or the direct change failed → checkout for the new plan;
        // the webhook cancels the previous subscription when it completes.
        const session = await this.paymentService.createUpgradeCheckoutSession({
            customerId: existingSubscription.stripeCustomerId,
            subscriptionId: existingSubscription.stripeSubscriptionId,
            newPriceId,
            successUrl,
            cancelUrl,
            metadata: {
                ...metadata,
                email,
                userId,
                planType: newPlanType,
                newPlanType,
                isUpgrade: isUpgrade ? 'true' : 'false',
                isDowngrade: !isUpgrade ? 'true' : 'false',
                previousPlan: existingSubscription.subscriptionPlan,
                previousSubscriptionId: existingSubscription.stripeSubscriptionId,
            },
        });

        return {
            sessionId: session.id,
            isUpgrade,
            isDowngrade: !isUpgrade,
            upgraded: false,
            message: 'お支払い方法の入力が必要です。',
        };
    }
}
