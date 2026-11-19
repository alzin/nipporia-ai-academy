// backend/src/application/use-cases/payment/HandleSubscriptionWebhookUseCase.ts
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { ISubscriptionRepository } from '../../../domain/repositories/ISubscriptionRepository';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '../../../domain/entities/Subscription';
import { PaymentService } from '../../../infrastructure/services/PaymentService';
import Stripe from 'stripe';
import { ENV_CONFIG } from '../../../infrastructure/config/env.config';

export interface HandleSubscriptionWebhookDTO {
    event: Stripe.Event;
}

export class HandleSubscriptionWebhookUseCase {
    constructor(
        private subscriptionRepository: ISubscriptionRepository,
        private userRepository: IUserRepository,
        private paymentService: PaymentService
    ) { }

    async execute(dto: HandleSubscriptionWebhookDTO): Promise<void> {
        const { event } = dto;

        switch (event.type) {
            case 'checkout.session.completed':
                await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
                break;

            case 'customer.subscription.created':
                await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
                break;

            case 'customer.subscription.updated':
                await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
                break;

            case 'customer.subscription.deleted':
                await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
                break;

            case 'invoice.payment_succeeded':
                await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
                break;

            case 'invoice.payment_failed':
                await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
                break;

            case 'customer.subscription.trial_will_end':
                await this.handleTrialWillEnd(event.data.object as Stripe.Subscription);
                break;

            default:
                console.log(`Unhandled subscription event type: ${event.type}`);
        }
    }

    private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
        const userId = session.metadata?.userId;
        const email = session.customer_email || session.metadata?.email;
        const isUpgrade = session.metadata?.isUpgrade === 'true';
        const previousSubscriptionId = session.metadata?.previousSubscriptionId;
        const planType = session.metadata?.planType || 'unknown';

        if (!userId || !email) {
            console.error('❌ Missing userId or email in session metadata');
            return;
        }

        // Verify user exists
        const user = await this.userRepository.findById(userId);
        if (!user) {
            console.error('❌ User not found:', userId);
            return;
        }

        // Check if this is a trial-to-paid conversion
        // User was in free trial if they have trialStartDate and trialEndDate set
        const wasInFreeTrial = user.trialStartDate !== null && user.trialEndDate !== null;

        if (wasInFreeTrial && !user.trialConvertedToPaid) {
            // Mark trial as converted (this ensures analytics fires only once)
            user.trialConvertedToPaid = true;
            user.updatedAt = new Date();
            await this.userRepository.update(user);
            console.log(`📊 Trial converted to paid for user ${userId}, plan: ${planType}`);
            // The frontend will fire the trial_converted_to_paid event
            // based on the trialConvertedToPaid flag returned by VerifyCheckoutSession
        }

        // Handle upgrade scenario - cancel old subscription
        if (isUpgrade && previousSubscriptionId) {
            console.log(`📍 Processing upgrade: canceling previous subscription ${previousSubscriptionId}`);
            try {
                await this.paymentService.cancelSubscriptionImmediately(previousSubscriptionId);
                console.log(`✅ Successfully canceled previous subscription`);
            } catch (error: any) {
                console.error(`⚠️ Failed to cancel previous subscription: ${error.message}`);
                // Continue anyway - the new subscription is more important
            }
        }

        // The subscription itself is saved by customer.subscription.created/updated
    }

    private async handleSubscriptionCreated(stripeSubscription: Stripe.Subscription): Promise<void> {

        const email = await this.getEmailFromCustomer(stripeSubscription.customer as string);
        if (!email) {
            console.error('❌ Missing email in subscription metadata');
            return;
        }

        const user = await this.userRepository.findByEmail(email);
        const userId = user?.id;

        if (!userId) {
            console.error('❌ Missing userId in subscription metadata');
            return;
        }

        // Check if user already has a subscription (one-to-one relationship)
        const existingSubscription = await this.subscriptionRepository.findByUserId(userId);

        // Get plan details
        const plan = this.extractPlanFromSubscription(stripeSubscription);
        const status = this.mapStripeStatusToSubscriptionStatus(stripeSubscription.status);

        if (existingSubscription) {
            // Update existing subscription

            // Update subscription details
            existingSubscription.email = email;
            existingSubscription.stripeCustomerId = stripeSubscription.customer as string;
            existingSubscription.stripeSubscriptionId = stripeSubscription.id;
            existingSubscription.subscriptionPlan = plan;
            existingSubscription.status = status;
            existingSubscription.currentPeriodStart = new Date(stripeSubscription.items.data[0].current_period_start * 1000);
            existingSubscription.currentPeriodEnd = new Date(stripeSubscription.items.data[0].current_period_end * 1000);
            existingSubscription.updatedAt = new Date();

            await this.subscriptionRepository.update(existingSubscription);
        } else {
            // Create new subscription
            const subscription = new Subscription(
                this.generateSubscriptionId(),
                userId,
                email,
                stripeSubscription.customer as string,
                stripeSubscription.id,
                undefined, // Payment intent will be linked in invoice.payment_succeeded
                plan,
                status,
                new Date(stripeSubscription.items.data[0].current_period_start * 1000),
                new Date(stripeSubscription.items.data[0].current_period_end * 1000),
                new Date(),
                new Date()
            );

            await this.subscriptionRepository.create(subscription);
        }
    }

    private async getEmailFromCustomer(customerId: string): Promise<string | null> {
        try {
            const customer = await this.paymentService.retrieveCustomer(customerId);
            return customer?.email || null;
        } catch (error) {
            console.error('Error retrieving customer:', error);
            return null;
        }
    }

    private async handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription): Promise<void> {

        const subscription = await this.subscriptionRepository.findByStripeSubscriptionId(stripeSubscription.id);
        if (!subscription) {
            console.error('❌ Subscription not found:', stripeSubscription.id);
            // Try to create it if it doesn't exist
            await this.handleSubscriptionCreated(stripeSubscription);
            return;
        }

        // Get the new plan
        const newPlan = this.extractPlanFromSubscription(stripeSubscription);
        const newStatus = this.mapStripeStatusToSubscriptionStatus(stripeSubscription.status);

        // Log if this is a plan change (upgrade/downgrade)
        if (newPlan !== subscription.subscriptionPlan) {
            console.log(
                `📍 Plan change detected: ${subscription.subscriptionPlan} → ${newPlan}`
            );
        }

        // Log if trial ended
        if (subscription.status === 'trialing' && newStatus === 'active') {
            console.log(`📍 Trial ended, subscription is now active`);
        }

        // Update subscription details
        subscription.status = newStatus;
        subscription.subscriptionPlan = newPlan;
        subscription.currentPeriodStart = new Date(
            stripeSubscription.items.data[0].current_period_start * 1000
        );
        subscription.currentPeriodEnd = new Date(
            stripeSubscription.items.data[0].current_period_end * 1000
        );
        subscription.updatedAt = new Date();

        await this.subscriptionRepository.update(subscription);
        console.log(`✅ Subscription updated in database`);
    }

    private async handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription): Promise<void> {

        const subscription = await this.subscriptionRepository.findByStripeSubscriptionId(stripeSubscription.id);
        if (!subscription) {
            console.error('❌ Subscription not found:', stripeSubscription.id);
            return;
        }

        subscription.status = 'canceled';
        subscription.updatedAt = new Date();

        await this.subscriptionRepository.update(subscription);
    }

    private async handleInvoicePaymentSucceeded(invoice: any): Promise<void> {

        if (!invoice.subscription) {
            console.log('Invoice is not for a subscription, skipping...');
            return;
        }

        const subscription = await this.subscriptionRepository.findByStripeSubscriptionId(invoice.subscription as string);
        if (!subscription) {
            console.error('❌ Subscription not found for invoice:', invoice.subscription);
            return;
        }

        // Update payment intent if this is the first payment
        if (!subscription.stripePaymentIntentId && invoice.payment_intent) {
            subscription.stripePaymentIntentId = invoice.payment_intent as string;
            subscription.updatedAt = new Date();
            await this.subscriptionRepository.update(subscription);
        }

        // Log successful payment
    }

    private async handleInvoicePaymentFailed(invoice: any): Promise<void> {

        if (!invoice.subscription) {
            return;
        }

        const subscription = await this.subscriptionRepository.findByStripeSubscriptionId(invoice.subscription as string);
        if (!subscription) {
            console.error('❌ Subscription not found for invoice:', invoice.subscription);
            return;
        }

        // Update subscription status
        subscription.status = 'past_due';
        subscription.updatedAt = new Date();
        await this.subscriptionRepository.update(subscription);


        // TODO: Send email notification to user about payment failure
    }

    private async handleTrialWillEnd(stripeSubscription: Stripe.Subscription): Promise<void> {

        const subscription = await this.subscriptionRepository.findByStripeSubscriptionId(stripeSubscription.id);
        if (!subscription) {
            console.error('❌ Subscription not found:', stripeSubscription.id);
            return;
        }

        // TODO: Send email notification to user about trial ending
    }

    private extractPlanFromSubscription(stripeSubscription: Stripe.Subscription): SubscriptionPlan {
        const priceId = stripeSubscription.items.data[0]?.price.id;
        const interval = stripeSubscription.items.data[0]?.price.recurring?.interval;

        // Only two plans: monthly and yearly
        if (priceId && priceId === ENV_CONFIG.STRIPE_MONTHLY_PRICE_ID) {
            return 'monthly';
        }
        if (priceId && priceId === ENV_CONFIG.STRIPE_YEARLY_PRICE_ID) {
            return 'yearly';
        }

        // Fallback to interval-based detection
        if (interval === 'month') {
            return 'monthly';
        } else if (interval === 'year') {
            return 'yearly';
        }

        // Default to monthly if unable to determine
        console.warn(`Unable to determine plan for price ID: ${priceId}`);
        return 'monthly';
    }

    private mapStripeStatusToSubscriptionStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
        const statusMap: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
            'active': 'active',
            'canceled': 'canceled',
            'incomplete': 'unpaid',
            'incomplete_expired': 'canceled',
            'past_due': 'past_due',
            'trialing': 'trialing',
            'unpaid': 'unpaid',
            'paused': 'canceled', // Map paused to canceled since we don't have a paused status
        };

        return statusMap[stripeStatus] || 'canceled';
    }

    private generateSubscriptionId(): string {
        return `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
}