import React, { useCallback, useState } from "react";
import {
  Delete,
  DragIndicator,
  Edit,
  PictureAsPdf,
  Slideshow,
  VideoLibrary,
  Quiz as QuizIcon,
} from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Skeleton,
  Stack,
  Typography,
  Grid,
} from "@mui/material";

import api from "../../services/api";
import { Course } from "../../services/courseService";
import { LessonFormState, LessonType } from "../../types/lsesson-form.types";

export type StoredLesson = LessonFormState & {
  id: string;
  courseId: string;
};

interface LessonDetailsResponse {
  contentData?: unknown;
  passingScore?: number;
}

interface LessonsListProps {
  lessons: StoredLesson[];
  isLoading: boolean;
  selectedCourse: Course | null;
  fetchLessons: (courseId: string) => void;
  setLessons: React.Dispatch<React.SetStateAction<StoredLesson[]>>;
  setEditingLesson: React.Dispatch<
    React.SetStateAction<LessonFormState | null>
  >;
  setLessonDialog: React.Dispatch<React.SetStateAction<boolean>>;
  setLessonForm: React.Dispatch<React.SetStateAction<LessonFormState>>;
}

const typeMeta: Record<
  LessonType,
  { label: string; icon: React.ReactElement }
> = {
  VIDEO: { label: "動画", icon: <VideoLibrary fontSize="small" /> },
  PDF: { label: "PDF", icon: <PictureAsPdf fontSize="small" /> },
  QUIZ: { label: "クイズ", icon: <QuizIcon fontSize="small" /> },
  SLIDES: { label: "スライド", icon: <Slideshow fontSize="small" /> },
};

const reorder = (
  arr: StoredLesson[],
  from: number,
  to: number,
): StoredLesson[] => {
  const next = arr.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next.map((l, i) => ({ ...l, order: i + 1 }));
};

export const LessonsList: React.FC<LessonsListProps> = ({
  lessons,
  isLoading,
  fetchLessons,
  selectedCourse,
  setLessons,
  setEditingLesson,
  setLessonDialog,
  setLessonForm,
}) => {
  const [draggedLesson, setDraggedLesson] = useState<StoredLesson | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const hasCourse = Boolean(selectedCourse?.id);
  const showSkeleton = isLoading && lessons.length === 0;

  const fetchLessonDetails = useCallback(async (lessonId: string) => {
    try {
      const { data } = await api.get<LessonDetailsResponse>(
        `/admin/lessons/${lessonId}`,
      );
      return data ?? null;
    } catch (error) {
      console.error("Failed to fetch lesson details:", error);
      return null;
    }
  }, []);

  const handleDeleteLesson = useCallback(
    async (lessonId: string) => {
      if (!hasCourse) return;
      if (!window.confirm("このレッスンを削除しますか？この操作は元に戻せません。"))
        return;
      try {
        await api.delete(`/admin/lessons/${lessonId}`);
        fetchLessons(selectedCourse!.id);
      } catch (error) {
        console.error("Failed to delete lesson:", error);
      }
    },
    [fetchLessons, hasCourse, selectedCourse],
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, lesson: StoredLesson) => {
      setDraggedLesson(lesson);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", lesson.id);
      if (e.currentTarget) e.currentTarget.style.opacity = "0.5";
    },
    [],
  );

  const handleDragEnd = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    setDraggedLesson(null);
    setDragOverIndex(null);
    if (e.currentTarget) e.currentTarget.style.opacity = "1";
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragOverIndex(index);
    },
    [],
  );

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const { clientX: x, clientY: y } = e;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverIndex(null);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
      e.preventDefault();
      if (!draggedLesson) return;

      const dragIndex = lessons.findIndex((l) => l.id === draggedLesson.id);
      if (dragIndex === -1 || dragIndex === dropIndex) {
        setDraggedLesson(null);
        setDragOverIndex(null);
        return;
      }

      const prev = lessons;
      const next = reorder(lessons, dragIndex, dropIndex);
      setLessons(next);
      setDraggedLesson(null);
      setDragOverIndex(null);

      try {
        await Promise.all(
          next.map((lesson) =>
            api.put(`/admin/lessons/${lesson.id}`, {
              ...lesson,
              order: lesson.order,
            }),
          ),
        );
      } catch (error) {
        console.error("Failed to reorder lessons:", error);
        setLessons(prev);
        if (hasCourse) fetchLessons(selectedCourse!.id);
        alert("並び順を保存できませんでした。もう一度お試しください。");
      }
    },
    [
      draggedLesson,
      fetchLessons,
      hasCourse,
      lessons,
      selectedCourse,
      setLessons,
    ],
  );

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              レッスン一覧
            </Typography>
            <List>
              {showSkeleton
                ? Array.from({ length: 4 }).map((_, index) => (
                    <Paper key={`lesson-skeleton-${index}`} sx={{ mb: 2, p: 2 }}>
                      <Stack spacing={1.5}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Skeleton variant="rounded" width={90} height={24} />
                          <Skeleton variant="text" width="55%" height={28} />
                        </Stack>
                        <Stack direction="row" spacing={1.5}>
                          <Skeleton variant="rounded" width={140} height={26} />
                          <Skeleton variant="rounded" width={110} height={26} />
                          <Skeleton variant="rounded" width={150} height={26} />
                        </Stack>
                      </Stack>
                    </Paper>
                  ))
                : lessons.length > 0 ?lessons.map((lesson, index) => {
                const meta = typeMeta[lesson.lessonType];
                const hasContent =
                  lesson.lessonType === "QUIZ" ||
                  lesson.lessonType === "SLIDES" ||
                  Boolean(lesson.contentUrl);

                const statusLabel =
                  lesson.lessonType === "QUIZ"
                      ? meta.label
                      : lesson.lessonType === "SLIDES"
                        ? meta.label
                        : lesson.lessonType === "VIDEO"
                          ? hasContent
                            ? "動画あり"
                            : "動画なし"
                          : hasContent
                            ? "PDFあり"
                            : "PDFなし";

                return (
                  <Paper
                    key={lesson.id}
                    draggable
                    aria-grabbed={draggedLesson?.id === lesson.id}
                    onDragStart={(e) => handleDragStart(e, lesson)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    sx={{
                      mb: 2,
                      cursor: "grab",
                      transition: "all 0.2s ease",
                      transform:
                        dragOverIndex === index &&
                        draggedLesson?.id !== lesson.id
                          ? "translateY(-2px)"
                          : "none",
                      boxShadow:
                        dragOverIndex === index &&
                        draggedLesson?.id !== lesson.id
                          ? 3
                          : 1,
                      borderLeft:
                        dragOverIndex === index &&
                        draggedLesson?.id !== lesson.id
                          ? "4px solid"
                          : "none",
                      borderLeftColor: "primary.main",
                      bgcolor:
                        draggedLesson?.id === lesson.id
                          ? "action.hover"
                          : "background.paper",
                      "&:hover": { boxShadow: 2 },
                      "&:active": { cursor: "grabbing" },
                    }}
                  >
                    <ListItem
                      secondaryAction={
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            aria-label="レッスンを編集"
                            onClick={async (e) => {
                              e.stopPropagation();
                              setEditingLesson(lesson);
                              const details = await fetchLessonDetails(
                                lesson.id,
                              );
                              setLessonForm({
                                title: lesson.title,
                                description: lesson.description,
                                order: lesson.order,
                                lessonType: lesson.lessonType ?? "VIDEO",
                                contentUrl: lesson.contentUrl ?? "",
                                contentData: details?.contentData ?? null,
                                requiresReflection: lesson.requiresReflection,
                                passingScore: details?.passingScore ?? 70,
                                isFree: !!lesson.isFree,
                              });
                              setLessonDialog(true);
                            }}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            aria-label="レッスンを削除"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteLesson(lesson.id);
                            }}
                          >
                            <Delete />
                          </IconButton>
                        </Stack>
                      }
                    >
                      <Stack direction="row" spacing={1} sx={{ mr: 1 }}>
                        <DragIndicator
                          sx={{
                            color: "action.active",
                            alignSelf: "center",
                            ml: 0.5,
                          }}
                        />
                      </Stack>

                      <ListItemText
                        // Render as divs: the primary/secondary slots contain Stacks and Chips (divs), which can't sit inside <p>.
                        slotProps={{ primary: { component: 'div' }, secondary: { component: 'div' } }}
                        primary={
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={2}
                          >
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ flexShrink: 0 }}
                            >
                              レッスン {lesson.order}
                            </Typography>
                            <Typography variant="subtitle1" fontWeight={500}>
                              {lesson.title}
                            </Typography>
                          </Stack>
                        }
                        secondary={
                          <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                            <Chip
                              icon={meta.icon}
                              label={statusLabel}
                              size="small"
                              color={hasContent ? "success" : "default"}
                            />
                            {lesson.isFree && (
                              <Chip label="無料公開" size="small" color="primary" />
                            )}
                            {lesson.requiresReflection && (
                              <Chip
                                label="ふりかえりあり"
                                size="small"
                                color="secondary"
                              />
                            )}
                          </Stack>
                        }
                      />
                    </ListItem>
                  </Paper>
                );
              }) : (
                <Typography variant="body2" color="text.secondary">
                  まだレッスンがありません。「レッスンを追加」から最初のレッスンを作りましょう。
                </Typography>
              )}
            </List>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              講座の情報
            </Typography>
            <Stack spacing={2}>
              {showSkeleton ? (
                <>
                  <Box>
                    <Skeleton variant="text" width={40} height={18} />
                    <Skeleton variant="text" width={160} height={28} />
                  </Box>
                  <Box>
                    <Skeleton variant="text" width={50} height={18} />
                    <Skeleton variant="rounded" width={90} height={24} />
                  </Box>
                  <Box>
                    <Skeleton variant="text" width={90} height={18} />
                    <Skeleton variant="text" width={30} height={28} />
                  </Box>
                </>
              ) : (
                <>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      公開の状態
                    </Typography>
                    <Box>
                      <Chip
                        label={selectedCourse?.isActive ? "公開中" : "非公開"}
                        color={selectedCourse?.isActive ? "success" : "default"}
                        size="small"
                      />
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      レッスン数
                    </Typography>
                    <Typography variant="body1">{lessons.length}</Typography>
                  </Box>
                </>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default LessonsList;
