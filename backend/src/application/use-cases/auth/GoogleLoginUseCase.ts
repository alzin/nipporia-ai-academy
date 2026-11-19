// backend/src/application/use-cases/auth/GoogleLoginUseCase.ts
// Sign in or register with a Google account (Google Identity Services ID token).
// Google has already verified the email address, so no verification code is sent.
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IProfileRepository } from '../../../domain/repositories/IProfileRepository';
import { IPasswordService } from '../../../domain/services/IPasswordService';
import { ITokenService } from '../../../domain/services/ITokenService';
import { IBrevoService } from '../../../domain/services/IBrevoService';
import { AuthenticationError } from '../../../domain/errors/AuthenticationError';
import { User, UserRole } from '../../../domain/entities/User';
import { Profile } from '../../../domain/entities/Profile';
import { LoginResponse } from './LoginUseCase';

export interface GoogleLoginDTO {
  credential: string;
}

export class GoogleLoginUseCase {
  private client: OAuth2Client;

  constructor(
    private readonly clientId: string | undefined,
    private userRepository: IUserRepository,
    private profileRepository: IProfileRepository,
    private passwordService: IPasswordService,
    private tokenService: ITokenService,
    private brevoService: IBrevoService
  ) {
    this.client = new OAuth2Client();
  }

  get enabled(): boolean {
    return !!this.clientId;
  }

  async execute(dto: GoogleLoginDTO): Promise<{
    response: LoginResponse;
    tokens: { accessToken: string; refreshToken: string };
    isNewUser: boolean;
  }> {
    if (!this.clientId) {
      throw new AuthenticationError('Google sign-in is not configured', 400);
    }

    let payload;
    try {
      const ticket = await this.client.verifyIdToken({ idToken: dto.credential, audience: this.clientId });
      payload = ticket.getPayload();
    } catch {
      throw new AuthenticationError('Invalid Google credential', 401);
    }
    if (!payload?.email || !payload.email_verified) {
      throw new AuthenticationError('Google account email is not verified', 401);
    }

    const email = payload.email.trim().toLowerCase();
    const name = (payload.name || email.split('@')[0]).trim();
    let isNewUser = false;

    let user = await this.userRepository.findByEmail(email);
    if (user) {
      if (!user.isActive) {
        throw new AuthenticationError('Account is inactive', 400);
      }
      if (!user.isverify) {
        // Signed up with email but never entered the code: Google proves the address.
        user.isverify = true;
        user.verificationCode = null;
        user.exprirat = null;
        user.updatedAt = new Date();
        user = await this.userRepository.update(user);
      }
    } else {
      isNewUser = true;
      // No usable password: the account can add one later through "forgot password".
      const unusablePassword = await this.passwordService.hash(crypto.randomBytes(32).toString('hex'));
      const created = new User(
        `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
        email,
        unusablePassword,
        UserRole.STUDENT,
        true,
        true, // isverify: verified by Google
        null,
        null,
        false,
        false, // marketingEmails: off unless the user opts in later
        null,
        null,
        false,
        false,
        new Date(),
        new Date()
      );
      user = await this.userRepository.create(created);
      await this.profileRepository.create(
        new Profile(
          `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
          user.id,
          name,
          '',
          new Date(),
          new Date()
        )
      );
      await this.brevoService.syncContactToLists(email, name, false).catch(() => undefined);
    }

    const tokens = this.tokenService.generateTokenPair({ userId: user.id, email: user.email, role: user.role });
    const csrfToken = this.tokenService.generateCSRFToken();
    const profile = await this.profileRepository.findByUserId(user.id);

    return {
      response: {
        user: { id: user.id, email: user.email, role: user.role, name: profile?.name ?? name },
        csrfToken,
      },
      tokens,
      isNewUser,
    };
  }
}
