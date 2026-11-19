import { UserRepository } from "../../../../infrastructure/database/repositories/UserRepository";
import { ProfileRepository } from "../../../../infrastructure/database/repositories/ProfileRepository";
import { SubscriptionRepository } from "../../../../infrastructure/database/repositories/SubscriptionRepository";

interface GetUsersOptions {
    page?: number;
    limit?: number;
    search?: string;
    roles?: string[];
    statuses?: string[];
    subscriptions?: string[];
    dateFrom?: string;
    dateTo?: string;
    sortField?: "joined" | "name";
    sortOrder?: "asc" | "desc";
}

export class GetUsersUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly profileRepository: ProfileRepository,
        private readonly subscriptionRepository: SubscriptionRepository,
    ) { }

    async execute(options: GetUsersOptions = {}) {
        const page = Number(options.page) > 0 ? Number(options.page) : 1;
        const limit = Number(options.limit) > 0 ? Number(options.limit) : 20;
        const search = (options.search || "").trim().toLowerCase();
        const roles = options.roles || [];
        const statuses = options.statuses || [];
        const subscriptionsFilter = options.subscriptions || [];
        const sortField = options.sortField || "joined";
        const sortOrder = options.sortOrder === "asc" ? "asc" : "desc";

        const users = await this.userRepository.findAll();
        const profiles = await this.profileRepository.findAll();
        const subscriptions = await this.subscriptionRepository.findAll();

        const usersWithProfiles = users.map(user => {
            const profile = profiles.find(p => p.userId === user.id);
            const subscription = subscriptions.find(s => s.userId === user.id);
            const isTrial = user.trialEndDate && new Date(user.trialEndDate) > new Date();
            // Never expose password hashes or verification codes
            const { password: _password, verificationCode: _code, ...safeUser } = user;
            return {
                ...safeUser,
                profile,
                subscriptionStatus: user.role === "ADMIN" ? "active" : subscription ? subscription.status : isTrial ? "trialing" : "No Subscription"
            };
        });

        const filteredUsers = usersWithProfiles
            .filter((user) => {
                const matchesSearch =
                    !search ||
                    user.email.toLowerCase().includes(search) ||
                    (user.profile?.name || "").toLowerCase().includes(search);

                const matchesRole = roles.length === 0 || roles.includes(user.role);

                const matchesStatus =
                    statuses.length === 0 ||
                    (statuses.includes("Active") && user.isActive) ||
                    (statuses.includes("Inactive") && !user.isActive);

                const matchesSubscription =
                    subscriptionsFilter.length === 0 ||
                    subscriptionsFilter.includes(user.subscriptionStatus);

                const joinedAt = new Date(user.createdAt).getTime();
                const matchesDateFrom =
                    !options.dateFrom ||
                    joinedAt >= new Date(options.dateFrom).getTime();
                const matchesDateTo =
                    !options.dateTo ||
                    joinedAt <= new Date(`${options.dateTo}T23:59:59`).getTime();

                return (
                    matchesSearch &&
                    matchesRole &&
                    matchesStatus &&
                    matchesSubscription &&
                    matchesDateFrom &&
                    matchesDateTo
                );
            })
            .sort((a, b) => {
                if (sortField === "name") {
                    const nameA = (a.profile?.name || a.email).toLowerCase();
                    const nameB = (b.profile?.name || b.email).toLowerCase();
                    return sortOrder === "asc"
                        ? nameA.localeCompare(nameB)
                        : nameB.localeCompare(nameA);
                }

                const valueA = new Date(a.createdAt).getTime();
                const valueB = new Date(b.createdAt).getTime();
                return sortOrder === "asc" ? valueA - valueB : valueB - valueA;
            });

        const startIndex = (page - 1) * limit;
        const paginatedUsers = filteredUsers.slice(startIndex, startIndex + limit);

        return {
            users: paginatedUsers,
            total: filteredUsers.length,
            page: page,
            totalPages: Math.ceil(filteredUsers.length / limit)
        };
    }
}
