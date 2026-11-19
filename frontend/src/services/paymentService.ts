// frontend/src/services/paymentService.ts
import api from './api';
import { MembershipPlanId } from '../utils/plans';

export interface CheckoutSessionResponse {
    sessionId?: string;
    isUpgrade?: boolean;
    isDowngrade?: boolean;
    upgraded?: boolean;
    isPaidNow?: boolean;
    message?: string;
}

export const paymentService = {
    async createCheckoutSession(data: {
        planType: MembershipPlanId;
        successUrl: string;
        cancelUrl: string;
        metadata?: any;
    }): Promise<CheckoutSessionResponse> {
        const response = await api.post('/payment/create-checkout-session', {
            ...data,
            mode: 'subscription',
        });
        return response.data;
    },
};
