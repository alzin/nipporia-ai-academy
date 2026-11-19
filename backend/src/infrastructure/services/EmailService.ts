// SMTP (nodemailer) sender. Used when EMAIL_HOST is set (see dependencies/index.ts).
import nodemailer from 'nodemailer';
import { IEmailService } from '../../domain/services/IEmailService';
import { ENV_CONFIG } from '../config/env.config';
import {
  EmailContent,
  fromAddress,
  passwordResetEmail,
  verificationCodeEmail,
  welcomeEmail,
  welcomeEmailWithPassword,
} from './emailTemplates';

export class EmailService implements IEmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: ENV_CONFIG.EMAIL_HOST,
      port: ENV_CONFIG.EMAIL_PORT,
      // 465 = TLS from the start (GoDaddy smtpout.secureserver.net); 587 = STARTTLS.
      secure: ENV_CONFIG.EMAIL_PORT === 465,
      auth: {
        user: ENV_CONFIG.EMAIL_USER,
        pass: ENV_CONFIG.EMAIL_PASS,
      },
    });
  }

  private async send(to: string, content: EmailContent): Promise<void> {
    await this.transporter.sendMail({
      from: fromAddress(ENV_CONFIG.EMAIL_USER),
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
