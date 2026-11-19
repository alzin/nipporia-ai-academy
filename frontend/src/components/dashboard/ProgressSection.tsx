import React from "react";
import { Card, CardContent, Typography, LinearProgress, Stack, Box, Skeleton, Divider } from "@mui/material";
import { ActivityFeed } from "../activity/ActivityFeed";
import { RecentActivity, CourseProgress } from "../../services/dashboardService";

interface ProgressSectionProps {
  courseProgress: CourseProgress[];
  recentActivity: RecentActivity[];
  loading: boolean;
}

export const ProgressSection: React.FC<ProgressSectionProps> = ({ courseProgress, recentActivity, loading }) => {
  return (
    <Stack spacing={3} sx={{ mb: 4 }}>
      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
            学習の進み具合
          </Typography>

          {loading ? (
            <>
              <Skeleton variant="rectangular" height={40} sx={{ mb: 2, borderRadius: 1 }} />
              <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1 }} />
            </>
          ) : courseProgress && courseProgress.length > 0 ? (
            <Stack divider={<Divider flexItem />} spacing={2}>
              {courseProgress.map((course) => (
                <Box key={course.courseId}>
                  <Typography variant="body1" fontWeight={500} sx={{ mb: 1, overflowWrap: "anywhere" }}>
                    {course.courseTitle}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <LinearProgress
                      variant="determinate"
                      value={course.progressPercentage}
                      aria-label={`${course.courseTitle}の進み具合`}
                      sx={{ flexGrow: 1, height: 8 }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ fontVariantNumeric: "tabular-nums", minWidth: "3em", textAlign: "right" }}
                    >
                      {course.progressPercentage}%
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    全{course.totalLessons}本のうち{course.completedLessons}本が完了
                  </Typography>
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              まだ完了したレッスンはありません。最初のレッスンから始めてみましょう。
            </Typography>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
            最近の活動
          </Typography>
          <ActivityFeed activities={recentActivity || []} loading={loading} compact maxItems={5} />
        </CardContent>
      </Card>
    </Stack>
  );
};
