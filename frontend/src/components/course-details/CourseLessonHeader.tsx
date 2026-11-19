import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { CheckCircle, LockOutlined } from "@mui/icons-material";
import { Lesson } from "./types";
import { lessonTypeLabel } from "./LessonsList";
import { colors } from "../../theme/theme";

interface Props {
  selectedLesson: Lesson;
  /** Kept for compatibility; colors come from the theme. */
  selectedCourseColors: { primary: string; secondary: string };
  getLessonTypeIcon: (lessonType: string, size?: "small" | "medium") => React.ReactElement;
}

export const CourseLessonHeader: React.FC<Props> = ({ selectedLesson, getLessonTypeIcon }) => {
  const access = selectedLesson.isLocked ? "メンバー限定" : selectedLesson.isFree ? "無料公開" : "";

  return (
    <Box component="header" sx={{ mb: { xs: 2.5, md: 3 } }}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        flexWrap="wrap"
        useFlexGap
        sx={{ mb: 1, color: "text.secondary" }}
      >
        <Typography variant="body2" fontWeight={700} sx={{ color: colors.accentHover }}>
          第{selectedLesson.order}回
        </Typography>
        <Box component="span" aria-hidden sx={{ display: "inline-flex", "& svg": { fontSize: 18 } }}>
          {getLessonTypeIcon(selectedLesson.lessonType, "small")}
        </Box>
        <Typography variant="body2">{lessonTypeLabel(selectedLesson.lessonType)}</Typography>
        {access && (
          <Stack direction="row" alignItems="center" spacing={0.5}>
            {selectedLesson.isLocked && <LockOutlined sx={{ fontSize: 16 }} aria-hidden />}
            <Typography variant="body2">{access}</Typography>
          </Stack>
        )}
        {selectedLesson.isCompleted && (
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: "success.main" }}>
            <CheckCircle sx={{ fontSize: 18 }} aria-hidden />
            <Typography variant="body2" fontWeight={700}>
              完了
            </Typography>
          </Stack>
        )}
      </Stack>

      <Typography variant="h4" component="h1" sx={{ overflowWrap: "anywhere" }}>
        {selectedLesson.title}
      </Typography>

      {selectedLesson.description && (
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1.5, maxWidth: "40em", whiteSpace: "pre-line" }}>
          {selectedLesson.description}
        </Typography>
      )}
    </Box>
  );
};
