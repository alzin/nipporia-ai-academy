import React from 'react';
import { Stack, Typography, Avatar, Box, Skeleton, Divider } from '@mui/material';
import { School, Forum, CheckCircle, PersonAdd, Edit, EmojiEvents } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { RecentActivity } from '../../services/dashboardService';
import { colors } from '../../theme/theme';

const activityIcons: Record<string, React.ReactElement> = {
    USER_REGISTERED: <PersonAdd fontSize="small" />,
    LESSON_COMPLETED: <School fontSize="small" />,
    POST_CREATED: <Forum fontSize="small" />,
    COURSE_COMPLETED: <EmojiEvents fontSize="small" />,
    PROFILE_UPDATED: <Edit fontSize="small" />,
};

interface ActivityFeedProps {
    activities: RecentActivity[];
    loading?: boolean;
    showUser?: boolean;
    compact?: boolean;
    maxItems?: number;
}

const relativeTime = (value: string): string => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return formatDistanceToNow(date, { addSuffix: true, locale: ja });
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
    activities,
    loading = false,
    showUser = false,
    compact = false,
    maxItems,
}) => {
    const displayActivities = maxItems ? activities?.slice(0, maxItems) : activities;

    if (loading) {
        return (
            <Stack spacing={2}>
                {[1, 2, 3].map((index) => (
                    <Stack key={index} direction="row" spacing={2} alignItems="center">
                        <Skeleton variant="circular" width={36} height={36} />
                        <Box flex={1}>
                            <Skeleton variant="text" width="60%" />
                            <Skeleton variant="text" width="30%" />
                        </Box>
                    </Stack>
                ))}
            </Stack>
        );
    }

    if (!displayActivities || displayActivities.length === 0) {
        return (
            <Typography variant="body2" color="text.secondary">
                まだ活動の記録はありません。
            </Typography>
        );
    }

    return (
        <Stack component="ul" divider={<Divider component="li" aria-hidden />} sx={{ listStyle: 'none', m: 0, p: 0 }}>
            {displayActivities.map((activity) => (
                <Stack
                    component="li"
                    key={activity.id}
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    sx={{ py: compact ? 1.25 : 1.75 }}
                >
                    <Avatar
                        aria-hidden
                        sx={{
                            bgcolor: colors.accentSoft,
                            color: colors.accentHover,
                            width: compact ? 32 : 36,
                            height: compact ? 32 : 36,
                        }}
                    >
                        {activityIcons[activity.activityType] || <CheckCircle fontSize="small" />}
                    </Avatar>

                    <Box flex={1} minWidth={0}>
                        <Typography
                            variant={compact ? 'body2' : 'body1'}
                            fontWeight={500}
                            sx={{ overflowWrap: 'anywhere' }}
                        >
                            {showUser && activity.user?.name ? `${activity.user.name}さん：` : ''}
                            {activity.title}
                        </Typography>

                        {activity.description && !compact && (
                            <Typography variant="body2" color="text.secondary">
                                {activity.description}
                            </Typography>
                        )}

                        <Typography variant="caption" color="text.secondary">
                            {relativeTime(activity.createdAt)}
                        </Typography>
                    </Box>
                </Stack>
            ))}
        </Stack>
    );
};
