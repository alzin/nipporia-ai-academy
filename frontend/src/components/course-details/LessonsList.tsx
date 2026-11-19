import React from "react";
import { Box, List, ListItem, ListItemButton, Skeleton, Stack, Tooltip, Typography } from "@mui/material";
import { CheckCircle, LockOutlined } from "@mui/icons-material";
import { colors } from "../../theme/theme";

interface LessonsListProps {
  lessonLoading: boolean;
  lessons: any[];
  sidebarCollapsed: boolean;
  selectedCourse?: any;
  /** Kept for compatibility; colors come from the theme. */
  selectedCourseColors: { primary: string; secondary: string };
  selectedLesson?: any;
  setSelectedLesson: (lesson: any) => void;
  isMobile: boolean;
  setDrawerOpen?: (v: boolean) => void;
  getLessonTypeIcon: (lessonType: string, size: "small" | "medium") => React.ReactNode;
  navigate: (path: string) => void;
  activeItemRef: React.RefCallback<HTMLLIElement>;
}

const LESSON_TYPE_LABELS: Record<string, string> = {
  VIDEO: "動画",
  PDF: "PDF",
  QUIZ: "クイズ",
  SLIDES: "スライド",
};

export const lessonTypeLabel = (type?: string) => (type ? LESSON_TYPE_LABELS[type] || type : "");

const lessonNumber = (order: number) => `第${order}回`;

export const LessonsList: React.FC<LessonsListProps> = ({
  lessonLoading,
  lessons,
  sidebarCollapsed,
  selectedLesson,
  setSelectedLesson,
  isMobile,
  setDrawerOpen,
  activeItemRef,
}) => {
  if (lessonLoading) {
    return (
      <Stack spacing={1} aria-busy="true" aria-label="読み込み中…">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} variant="rectangular" height={sidebarCollapsed ? 44 : 64} sx={{ borderRadius: "10px" }} />
        ))}
      </Stack>
    );
  }

  if (lessons.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ p: sidebarCollapsed ? 0 : 1 }}>
        {sidebarCollapsed ? "" : "この講座にはまだレッスンがありません。"}
      </Typography>
    );
  }

  return (
    <List
      sx={{
        p: 0,
        border: `1px solid ${colors.line}`,
        borderRadius: sidebarCollapsed ? "10px" : "14px",
        bgcolor: colors.card,
        overflow: "hidden",
      }}
    >
      {lessons.map((lesson, index) => {
        // Locked lessons stay clickable: opening one shows the lock notice.
        const isSelected = selectedLesson?.id === lesson.id;
        const status = lesson.isCompleted ? "完了" : lesson.isLocked ? "メンバー限定" : lesson.isFree ? "無料" : "";
        const typeLabel = lessonTypeLabel(lesson.lessonType);
        const accessibleLabel = [lessonNumber(lesson.order), lesson.title, typeLabel, status].filter(Boolean).join("、");

        const statusIcon = lesson.isCompleted ? (
          <CheckCircle sx={{ fontSize: 20, color: "success.main" }} aria-hidden />
        ) : lesson.isLocked ? (
          <LockOutlined sx={{ fontSize: 20, color: "text.secondary" }} aria-hidden />
        ) : null;

        return (
          <ListItem
            key={lesson.id}
            disablePadding
            ref={isSelected ? activeItemRef : null}
            sx={{ borderTop: index === 0 ? 0 : `1px solid ${colors.line}` }}
          >
            <Tooltip title={sidebarCollapsed ? `${lessonNumber(lesson.order)} ${lesson.title}` : ""} placement="right" arrow>
              <ListItemButton
                selected={isSelected}
                aria-current={isSelected ? "true" : undefined}
                aria-label={sidebarCollapsed ? accessibleLabel : undefined}
                onClick={() => {
                  setSelectedLesson(lesson);
                  if (isMobile) setDrawerOpen?.(false);
                }}
                sx={{
                  minHeight: sidebarCollapsed ? 44 : 64,
                  px: sidebarCollapsed ? 0.5 : 2,
                  py: sidebarCollapsed ? 0.75 : 1.25,
                  gap: sidebarCollapsed ? 0 : 1.5,
                  justifyContent: sidebarCollapsed ? "center" : "flex-start",
                  alignItems: "center",
                  borderLeft: "3px solid transparent",
                  "&.Mui-selected": {
                    bgcolor: colors.accentSoft,
                    borderLeftColor: colors.accent,
                  },
                  "&.Mui-selected:hover": { bgcolor: colors.accentSoft },
                }}
              >
                {sidebarCollapsed ? (
                  <Stack alignItems="center" spacing={0.25}>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      sx={{ color: colors.accentHover, fontVariantNumeric: "tabular-nums", lineHeight: 1.2 }}
                    >
                      {lesson.order}
                    </Typography>
                    {statusIcon && <Box sx={{ display: "flex", "& svg": { fontSize: 14 } }}>{statusIcon}</Box>}
                  </Stack>
                ) : (
                  <>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      sx={{
                        minWidth: "3.6em",
                        flexShrink: 0,
                        color: colors.accentHover,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {lessonNumber(lesson.order)}
                    </Typography>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        fontWeight={isSelected ? 700 : 500}
                        sx={{ lineHeight: 1.6, overflowWrap: "anywhere" }}
                      >
                        {lesson.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" component="p">
                        {[typeLabel, status].filter(Boolean).join("・")}
                      </Typography>
                    </Box>
                    {statusIcon && <Box sx={{ display: "flex", flexShrink: 0 }}>{statusIcon}</Box>}
                  </>
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        );
      })}
    </List>
  );
};

export default LessonsList;
