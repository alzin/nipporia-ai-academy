export enum ActivityType {
    USER_REGISTERED = 'USER_REGISTERED',
    LESSON_COMPLETED = 'LESSON_COMPLETED',
    POST_CREATED = 'POST_CREATED',
    COURSE_COMPLETED = 'COURSE_COMPLETED',
    ACHIEVEMENT_EARNED = 'ACHIEVEMENT_EARNED',
    PROFILE_UPDATED = 'PROFILE_UPDATED'
}

export interface IRecentActivity {
    id: string;
    userId: string;
    activityType: ActivityType;
    title: string;
    description?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
}

export class RecentActivity implements IRecentActivity {
    constructor(
        public id: string,
        public userId: string,
        public activityType: ActivityType,
        public title: string,
        public description: string | undefined,
        public metadata: Record<string, any> | undefined,
        public createdAt: Date
    ) { }
}