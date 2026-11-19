// backend/src/infrastructure/services/emailTemplates.ts
// Shared email copy for ResendEmailService and EmailService (nodemailer).
import { ENV_CONFIG } from '../config/env.config';

export const BRAND_NAME = 'Nipporia AI Academy';

export interface EmailContent {
  subject: string;
  html: string;
}

const COLORS = {
  ink: '#23211D',
  muted: '#5F5B54',
  line: '#E3DDD2',
  card: '#FFFDF9',
  accent: '#AE4A24',
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const button = (href: string, label: string): string =>
  `<a href="${href}" style="display:inline-block;background-color:${COLORS.accent};color:#ffffff;padding:10px 20px;text-decoration:none;border-radius:8px;margin-top:16px;">${label}</a>`;

const layout = (body: string): string => `
  <div style="font-family:'Hiragino Sans','Yu Gothic',Meiryo,Arial,sans-serif;max-width:560px;margin:0 auto;color:${COLORS.ink};">
    <div style="background-color:${COLORS.card};border:1px solid ${COLORS.line};border-radius:12px;padding:32px;">
      <p style="margin:0 0 24px;font-weight:bold;">${BRAND_NAME}</p>
      ${body}
    </div>
    <p style="color:${COLORS.muted};font-size:12px;text-align:center;margin-top:16px;">${BRAND_NAME}</p>
  </div>
`;

export const fromAddress = (address: string | undefined): string => `"${BRAND_NAME}" <${address ?? ''}>`;

export const welcomeEmail = (name: string): EmailContent => ({
  subject: `${BRAND_NAME}へようこそ`,
  html: layout(`
    <p>${escapeHtml(name)} さん、ご登録ありがとうございます。</p>
    <p>登録したメールアドレスとパスワードでログインできます。</p>
    ${button(`${ENV_CONFIG.FRONTEND_URL}/login`, 'ログインする')}
  `),
});

export const welcomeEmailWithPassword = (email: string, temporaryPassword: string): EmailContent => ({
  subject: `${BRAND_NAME}のアカウント情報`,
  html: layout(`
    <p>アカウントを作成しました。ログイン情報は次のとおりです。</p>
    <p>メールアドレス：${escapeHtml(email)}<br>仮パスワード：<code>${escapeHtml(temporaryPassword)}</code></p>
    <p>ログインしたら、パスワードを変更してください。</p>
    ${button(`${ENV_CONFIG.FRONTEND_URL}/login`, 'ログインする')}
  `),
});

export const passwordResetEmail = (resetToken: string): EmailContent => ({
  subject: `パスワードの再設定（${BRAND_NAME}）`,
  html: layout(`
    <p>パスワード再設定のリクエストを受け付けました。</p>
    <p>下のボタンから新しいパスワードを設定してください。リンクの有効期限は1時間です。</p>
    ${button(`${ENV_CONFIG.FRONTEND_URL}/reset-password?token=${encodeURIComponent(resetToken)}`, 'パスワードを再設定する')}
    <p style="color:${COLORS.muted};font-size:13px;margin-top:24px;">心当たりがない場合は、このメールを無視してください。</p>
  `),
});

export const verificationCodeEmail = (code: string): EmailContent => ({
  subject: `確認コードのお知らせ（${BRAND_NAME}）`,
  html: layout(`
    <p>ご登録ありがとうございます。次の確認コードを入力して、登録を完了してください。</p>
    <p style="font-size:32px;letter-spacing:8px;font-weight:bold;color:${COLORS.accent};text-align:center;margin:24px 0;">${escapeHtml(code)}</p>
    <p style="color:${COLORS.muted};font-size:13px;">コードの有効期限は10分です。心当たりがない場合は、このメールを無視してください。</p>
  `),
});
