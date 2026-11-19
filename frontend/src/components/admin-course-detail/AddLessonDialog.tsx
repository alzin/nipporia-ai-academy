import React, { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Stack,
} from "@mui/material";
import { LessonFormState } from "../../types/lsesson-form.types";
import api from "../../services/api";
import { BasicInfoForm } from "./BasicInfoForm";
import { LessonTypeSelector } from "./LessonTypeSelector";
import { ContentForm } from "./ContentForm";

interface IAddLessonDialogProps {
  lessonForm: LessonFormState;
  isMobile: boolean;
  setLessonForm: React.Dispatch<React.SetStateAction<LessonFormState>>;
  editingLesson?: LessonFormState | null;
  selectedCourse: { id: string; title: string } | null;
  lessons: LessonFormState[];
  lessonDialog: boolean;
  setLessonDialog: React.Dispatch<React.SetStateAction<boolean>>;
  fetchLessons: (courseId: string) => void;
  fetchCourses: () => void;
  resetLessonForm: () => void;
}

export const AddLessonDialog: React.FC<IAddLessonDialogProps> = ({
  lessonForm,
  setLessonForm,
  isMobile,
  editingLesson,
  selectedCourse,
  fetchCourses,
  fetchLessons,
  lessonDialog,
  lessons,
  resetLessonForm,
  setLessonDialog,
}) => {
  const methods = useForm<LessonFormState>({
    defaultValues: lessonForm,
  });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
    setError,
    clearErrors,
  } = methods;

  const lessonType = watch("lessonType");

  /**
   * IMPORTANT: We intentionally DO NOT push RHF values back into parent on every change.
   * The previous two-way sync caused recursive updates and "Maximum update depth exceeded".
   * Parent -> Form sync happens when the dialog opens.
   */

  // Reset form with normalized defaults when dialog opens
  useEffect(() => {
    if (lessonDialog) {
      const normalized: LessonFormState = {
        ...lessonForm,
        contentData:
          lessonForm.lessonType === "QUIZ"
            ? lessonForm.contentData ?? { questions: [] }
            : lessonForm.lessonType === "SLIDES"
            ? lessonForm.contentData ?? { slides: [] }
            : null,
        isFree: !!lessonForm.isFree,
      };
      reset(normalized, { keepErrors: false, keepDirty: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonDialog]);

  const validateForm = (data: LessonFormState): boolean => {
    clearErrors();
    let isValid = true;

    if (!data.title?.trim()) {
      setError("title", { message: "レッスン名を入力してください" });
      isValid = false;
    }

    if (!data.description?.trim()) {
      setError("description", { message: "説明を入力してください" });
      isValid = false;
    }

    if (data.lessonType === "QUIZ") {
      const questions = (data.contentData as any)?.questions ?? [];
      if (!Array.isArray(questions) || questions.length === 0) {
        setError("contentData", {
          message: "問題を1つ以上追加してください",
        });
        isValid = false;
      }
    } else if (data.lessonType === "SLIDES") {
      const slides = (data.contentData as any)?.slides ?? [];
      if (!Array.isArray(slides) || slides.length === 0) {
        setError("contentData", { message: "スライドを1枚以上追加してください" });
        isValid = false;
      }
    } else {
      // Logic for VIDEO and PDF URL validation
      const url = data.contentUrl?.trim() || "";
      
      if (!url) {
        setError("contentUrl", {
          message: `${
            data.lessonType === "VIDEO" ? "動画" : "PDF"
          }のURLを入力してください`,
        });
        isValid = false;
      } else {
        const lowerUrl = url.toLowerCase();
        
        // Strict Validation Check
        if (data.lessonType === "VIDEO") {
          // Checks for .mp4, .webm, .ogg, .mov, .m4v and allows query params (e.g. ?signature=...)
          const isVideo = /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(lowerUrl);
          if (!isVideo) {
            setError("contentUrl", {
              message: "URLの形式が違います。.mp4、.webm、.ogg、.mov のいずれかで終わるURLを入力してください",
            });
            isValid = false;
          }
        } else if (data.lessonType === "PDF") {
          // Checks for .pdf extension and allows query params
          const isPdf = /\.pdf(\?.*)?$/i.test(lowerUrl);
          if (!isPdf) {
            setError("contentUrl", {
              message: "URLの形式が違います。.pdf で終わるURLを入力してください",
            });
            isValid = false;
          }
        }
      }
    }

    return isValid;
  };

  const onSubmit = async (data: LessonFormState) => {
    if (!validateForm(data)) return;

    const lessonData: any = {
      ...data,
      isFree: !!data.isFree,
      contentData:
        data.lessonType === "QUIZ"
          ? data.contentData ?? { questions: [] }
          : data.lessonType === "SLIDES"
          ? data.contentData ?? { slides: [] }
          : undefined,
      passingScore:
        data.lessonType === "QUIZ" ? data.passingScore ?? 70 : undefined,
    };

    try {
      if (editingLesson) {
        await api.put(`/admin/lessons/${editingLesson.id}`, lessonData);
      } else {
        await api.post(
          `/admin/courses/${selectedCourse!.id}/lessons`,
          lessonData
        );
      }

      // Optionally push final submitted values to parent once (non-reactive)
      setLessonForm((prev) => ({ ...prev, ...data }));

      handleCloseDialog();
      if (selectedCourse) fetchLessons(selectedCourse.id);
      fetchCourses();
    } catch (error) {
      console.error("Failed to save lesson:", error);
      setError("root" as any, {
        message: "レッスンを保存できませんでした。もう一度お試しください。",
      });
    }
  };

  const handleCloseDialog = () => {
    setLessonDialog(false);
    resetLessonForm();
    reset();
    clearErrors();
  };

  return (
    <Dialog
      open={lessonDialog}
      onClose={handleCloseDialog}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        {editingLesson ? "レッスンを編集" : "レッスンを追加"}
      </DialogTitle>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Stack spacing={3} sx={{ pt: 2 }}>
              <BasicInfoForm
                control={control}
                errors={errors}
                lessons={lessons}
                isEditing={!!editingLesson}
              />
              <LessonTypeSelector control={control} />
              <ContentForm
                control={control}
                errors={errors}
                lessonType={lessonType}
                editingLesson={editingLesson}
                setValue={setValue}
                isMobile={isMobile}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>キャンセル</Button>
            <Button type="submit" variant="contained">
              保存
            </Button>
          </DialogActions>
        </form>
      </FormProvider>
    </Dialog>
  );
};