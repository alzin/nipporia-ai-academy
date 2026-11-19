import React from "react";
import { Grid, Alert, Skeleton, Card, CardContent, Box, Typography } from "@mui/material";
import { Course, CourseProgress } from "../../types/course.types";
import { CourseCard } from "./CourseCard";

interface CourseGridProps {
  courses: Course[];
  loading: boolean;
  error: string | null;
  enrollments: string[];
  progressData: CourseProgress[];
  onCourseClick: (course: Course) => void;
  isMobile: boolean;
}

export const CourseGrid = ({
  courses,
  loading,
  error,
  enrollments,
  progressData,
  onCourseClick,
  isMobile,
}: CourseGridProps) => {
  if (loading) {
    const skeletonCount = isMobile ? 1 : 3;

    return (
      <Grid container spacing={{ xs: 2, sm: 3 }} aria-busy="true" aria-label="読み込み中…">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index} sx={{ display: "flex" }}>
            <Card sx={{ width: "100%", minHeight: 280, display: "flex", flexDirection: "column" }}>
              <CardContent sx={{ p: { xs: 2.5, sm: 3 }, flex: 1 }}>
                <Skeleton variant="text" width="75%" height={36} />
                <Skeleton variant="text" width="40%" height={20} />
                <Skeleton variant="text" width="100%" height={20} sx={{ mt: 1 }} />
                <Skeleton variant="text" width="85%" height={20} />
                <Box sx={{ mt: 4 }}>
                  <Skeleton variant="rectangular" height={44} sx={{ borderRadius: 999 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 4 }}>
        {error}
      </Alert>
    );
  }

  if (courses.length === 0) {
    return (
      <Typography variant="body1" color="text.secondary">
        公開中の講座はまだありません。
      </Typography>
    );
  }

  return (
    <Grid container spacing={{ xs: 2, sm: 3 }}>
      {courses.map((course) => {
        const progress = progressData.find((p) => p.courseId === course.id) || {
          completedLessons: 0,
          totalLessons: 0,
          completionPercentage: 0,
        };

        return (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={course.id} sx={{ display: "flex" }}>
            <CourseCard
              course={course}
              isEnrolled={enrollments.includes(course.id)}
              progress={progress.completionPercentage}
              lessonCount={progress.totalLessons || course.lessonCount || 0}
              completedCount={progress.completedLessons}
              onClick={() => onCourseClick(course)}
            />
          </Grid>
        );
      })}
    </Grid>
  );
};
