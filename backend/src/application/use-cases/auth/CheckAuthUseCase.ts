import { TokenService } from "../../../infrastructure/services/TokenService";
import { IProfileRepository } from "../../../domain/repositories/IProfileRepository";

export class CheckAuthUseCase {
    constructor(
        private tokenService: TokenService,
        private profileRepository: IProfileRepository
    ) { }

    async execute(params: {
        accessToken?: string;
        refreshToken?: string;
    }) {
        const { accessToken, refreshToken } = params;

        if (!refreshToken) {
            return { authenticated: false, status: 403 };
        }

        if (!accessToken) {
            return { authenticated: false, status: 401 };
        }

        const payload = this.tokenService.verifyAccessToken(accessToken);

        if (!payload) {
            return { authenticated: false, status: 401 };
        }

        const profile = await this.profileRepository.findByUserId(payload.userId);

        return {
            authenticated: true,
            user: {
                id: payload.userId,
                email: payload.email,
                role: payload.role,
                name: profile?.name ?? null
            },
            status: 200
        };
    }
}
