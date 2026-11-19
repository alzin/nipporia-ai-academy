import dotenv from 'dotenv';
dotenv.config();

export const ENV_CONFIG = {
    // Server Configuration
    PORT: parseInt(process.env.PORT!) || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    API_URL: process.env.API_URL,
    FRONTEND_URL: process.env.FRONTEND_URL,

    // Database Configuration
    DATABASE_URL: process.env.DATABASE_URL,

    // JWT Configuration
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || '1d',
    REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',

    // Stripe Configuration
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    // Two plans only: 月額プラン ¥4,980 and 年額プラン ¥49,800 (tax included)
    STRIPE_MONTHLY_PRICE_ID: process.env.STRIPE_MONTHLY_PRICE_ID,
    STRIPE_YEARLY_PRICE_ID: process.env.STRIPE_YEARLY_PRICE_ID,
    // Customer portal configuration (bpc_...). Empty = the account's default portal settings.
    STRIPE_PORTAL_CONFIGURATION_ID: process.env.STRIPE_PORTAL_CONFIGURATION_ID,
    // Stripe Tax. Prices are tax-inclusive, so this stays off unless Stripe Tax is set up.
    STRIPE_AUTOMATIC_TAX: process.env.STRIPE_AUTOMATIC_TAX === 'true',

    // Email Configuration
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_PORT: parseInt(process.env.EMAIL_PORT!) || 587,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,

    // AWS Configuration
    AWS_REGION: process.env.AWS_REGION || 'ap-northeast-1',
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME,

    BREVO_API_KEY: process.env.BREVO_API_KEY,
    BREVO_TRANSACTIONAL_LIST_ID: parseInt(process.env.BREVO_TRANSACTIONAL_LIST_ID || '2'),
    BREVO_MARKETING_LIST_ID: parseInt(process.env.BREVO_MARKETING_LIST_ID || '3'),

    // No-card free trial after email verification. 0 (default) = no trial.
    FREE_TRIAL_DAYS: Math.max(0, parseInt(process.env.FREE_TRIAL_DAYS || '0', 10) || 0),
};