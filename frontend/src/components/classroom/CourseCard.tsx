import React, { memo } from "react";
import { Box, Card, CardContent, Typography, LinearProgress, Stack, Button } from "@mui/material";
import { CheckCircle, PlayCircleOutline } from "@mui/icons-material";
import { CourseCardProps } from "../../types/course.types";
import { colors } from "../../theme/theme";

export const CourseCard = memo(
  ({ course, onClick, isEnrolled, progress = 0, lessonCount = 0, completedCount = 0 }: CourseCardProps) => {
    const isCompleted = progress === 100;
    const freeCount = course.freeLessonCount || 0;

    const meta = [
      lessonCount > 0 ? `全${lessonCount}本のレッスン` : null,
      freeCount > 0 ? `最初の${freeCount}本は無料` : null,
    ].filter(Boolean);

    return (
      <Card
        sx={{
          cursor: "pointer",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          borderTop: `4px solid ${colors.accent}`,
          transition: "border-color .15s ease",
          "&:hover": { borderColor: colors.lineStrong, borderTopColor: colors.accentHover },
        }}
        onClick={onClick}
      >
        <CardContent
          sx={{
            p: { xs: 2.5, sm: 3 },
            flex: 1,
            display: "flex",
            flexDirection: "column",
            "&:last-child": { pb: { xs: 2.5, sm: 3 } },
          }}
        >
          <Typography variant="h5" component="h2" sx={{ mb: 1, overflowWrap: "anywhere" }}>
            {course.title}
          </Typography>

          {meta.length > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {meta.join("・")}
            </Typography>
          )}

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 3,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {course.description}
          </Typography>

          {isEnrolled && (
            <Box sx={{ mb: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="baseline" mb={1}>
                <Typography variant="body2" color="text.secondary">
                  {isCompleted ? (
                    <Stack component="span" direction="row" alignItems="center" spacing={0.5}>
                      <CheckCircle sx={{ fontSize: 18, color: "success.main" }} aria-hidden />
                      <span>すべて完了しました</span>
                    </Stack>
                  ) : (
                    `${lessonCount}本中 ${completedCount}本完了`
                  )}
                </Typography>
                <Typography variant="body2" fontWeight={700} sx={{ fontVariantNumeric: "tabular-nums" }}>
                  {progress}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={progress}
                aria-label={`${course.title}の進み具合`}
                sx={{ height: 8 }}
              />
            </Box>
          )}

          <Box sx={{ mt: "auto" }}>
            <Button
              fullWidth
              variant={isEnrolled && isCompleted ? "outlined" : "contained"}
              color="primary"
              startIcon={<PlayCircleOutline />}
            >
              {isEnrolled ? (isCompleted ? "もう一度見る" : "続きから見る") : "講座を見る"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }
);
