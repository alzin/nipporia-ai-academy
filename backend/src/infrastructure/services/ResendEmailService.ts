import { IEmailService } from '../../domain/services/IEmailService';
import { ENV_CONFIG } from '../config/env.config';
import { Resend } from 'resend';
import {
  EmailContent,
  fromAddress,
  passwordResetEmail,
  verificationCodeEmail,
  welcomeEmail,
  welcomeEmailWithPassword,
} from './emailTemplates';

export class ResendEmailService implements IEmailService {
  // Null when RESEND_API_KEY is not set: emails are logged instead of sent (local development).
  private resend: Resend | null;

  constructor() {
    this.resend = ENV_CONFIG.RESEND_API_KEY ? new Resend(ENV_CONFIG.RESEND_API_KEY) : null;
    if (!this.resend) {
      console.warn('RESEND_API_KEY is not set: emails will be logged to the console, not sent.');
    }
  }

  private async send(to: string, content: EmailContent): Promise<void> {
    if (!this.resend) {
      const text = content.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      console.log(`[email not sent] to=${to} subject="${content.subject}" text="${text.slice(0, 300)}"`);
      return;
    }
    await this.resend.emails.send({
      from: fromAddress(ENV_CONFIG.EMAIL_FROM),
      to,
      subject: content.subject,
      html: content.html,
    });
  }

  async sendWelcomeEmailWithoutPassword(email: string, name: string): Promise<void> {
    await this.send(email, welcomeEmail(name));
  }

  async sendWelcomeEmail(email: string, temporaryPassword: string): Promise<void> {
    await this.send(email, welcomeEmailWithPassword(email, temporaryPassword));
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    await this.send(email, passwordResetEmail(resetToken));
  }

  async sendVerificationCode(email: string, code: string): Promise<void> {
    await this.send(email, verificationCodeEmail(code));
  }
}
