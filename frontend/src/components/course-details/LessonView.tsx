import React from "react";
import { Paper, Typography, CircularProgress } from "@mui/material";
import { MenuBook } from "@mui/icons-material";
import { CourseLessonHeader } from "./CourseLessonHeader";
import { LessonLockNotices } from "./LessonLockNotices";
import { LessonContentRenderer } from "./LessonContentRenderer";
import { Lesson, Course } from "../../types/course-details.types";
import { getCourseColors, getLessonIcon } from "../../utils/course-details";

interface LessonViewProps {
  selectedLesson: Lesson | null;
  selectedCourse: Course | null;
  onComplete: (score?: number) => void;
  /** false for guests: progress can't be saved */
  canComplete: boolean;
  isLoadingNextLesson?: boolean;
}

export const LessonView: React.FC<LessonViewProps> = ({
  selectedLesson,
  onComplete,
  canComplete,
  isLoadingNextLesson = false,
}) => {
  const selectedCourseColors = getCourseColors();

  // Loading state when completing lesson and fetching next
  if (isLoadingNextLesson) {
    return (
      <Paper
        variant="outlined"
        role="status"
        sx={{
          textAlign: "center",
          py: { xs: 6, md: 10 },
          px: 2,
          borderRadius: "14px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="h6" component="p">
          次のレッスンを準備しています
        </Typography>
        <Typography variant="body2" color="text.secondary">
          おつかれさまでした。少しお待ちください。
        </Typography>
      </Paper>
    );
  }

  if (!selectedLesson) {
    return (
      <Paper variant="outlined" sx={{ textAlign: "center", py: { xs: 6, md: 10 }, px: 2, borderRadius: "14px" }}>
        <MenuBook sx={{ fontSize: 40, color: "text.secondary", mb: 1.5 }} aria-hidden />
        <Typography variant="h6" component="p" gutterBottom>
          レッスンを選んでください
        </Typography>
        <Typography variant="body2" color="text.secondary">
          レッスン一覧から、見たいレッスンを選ぶと始まります。
        </Typography>
      </Paper>
    );
  }

  return (
    <div key={selectedLesson.id}>
      <CourseLessonHeader
        selectedLesson={selectedLesson}
        selectedCourseColors={selectedCourseColors}
        getLessonTypeIcon={getLessonIcon}
      />

      {selectedLesson.isLocked ? (
        <LessonLockNotices />
      ) : (
        <LessonContentRenderer
          selectedLesson={selectedLesson}
          onCompleteLesson={onComplete}
          selectedCourseColors={selectedCourseColors}
          canComplete={canComplete}
        />
      )}
    </div>
  );
};
