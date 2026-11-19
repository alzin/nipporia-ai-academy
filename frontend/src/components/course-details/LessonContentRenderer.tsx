import React from "react";
import { Alert, Button, Stack, Typography } from "@mui/material";
import { CheckCircle, TaskAlt } from "@mui/icons-material";
import { Quiz } from "../classroom/Quiz";
import { InteractiveSlides } from "../classroom/InteractiveSlides";
import { SimplePDFViewer } from "../classroom/SimplePDFViewer";
import { Lesson } from "./types";
import { VideoPlayer } from "./VideoPlayer";

interface Props {
  selectedLesson: Lesson;
  onCompleteLesson: (quizScore?: number) => void;
  selectedCourseColors: { primary: string; secondary: string };
  /** false for guests: hides "mark complete" */
  canComplete?: boolean;
}

export const LessonContentRenderer: React.FC<Props> = ({
  selectedLesson,
  onCompleteLesson,
  canComplete = true,
}) => {
  if (selectedLesson.lessonType === "QUIZ") {
    return selectedLesson.contentData?.questions ? (
      <Quiz
        questions={selectedLesson.contentData.questions}
        passingScore={selectedLesson.passingScore || 70}
        timeLimit={selectedLesson.contentData.timeLimit}
        onComplete={(score, passed) => {
          if (passed) onCompleteLesson(score);
        }}
        isLessonCompleted={!!selectedLesson.isCompleted}
      />
    ) : (
      <Alert severity="warning" sx={{ mb: 4 }}>
        このレッスンのクイズを読み込めませんでした。時間をおいて、もう一度お試しください。
      </Alert>
    );
  }

  if (selectedLesson.lessonType === "SLIDES") {
    return selectedLesson.contentData?.slides ? (
      <InteractiveSlides
        slides={selectedLesson.contentData.slides}
        onComplete={() => onCompleteLesson()}
        isLessonCompleted={!!selectedLesson.isCompleted}
      />
    ) : (
      <Alert severity="warning" sx={{ mb: 4 }}>
        このレッスンのスライドを読み込めませんでした。時間をおいて、もう一度お試しください。
      </Alert>
    );
  }

  if (
    selectedLesson.lessonType === "VIDEO" ||
    selectedLesson.lessonType === "PDF"
  ) {
    return (
      <>
        {selectedLesson.contentUrl ? (
          selectedLesson.lessonType === "VIDEO" ? (
            <VideoPlayer url={selectedLesson.contentUrl} />
          ) : selectedLesson.contentUrl ? (
            <SimplePDFViewer
              url={selectedLesson.contentUrl}
              title={selectedLesson.title}
              allowDownload={true}
            />
          ) : (
            <Alert severity="warning" sx={{ mb: 4 }}>
              このレッスンの動画や資料が見つかりませんでした。時間をおいて、もう一度お試しください。
            </Alert>
          )
        ) : (
          <Alert severity="warning" sx={{ mb: 4 }}>
            このレッスンの動画や資料が見つかりませんでした。時間をおいて、もう一度お試しください。
          </Alert>
        )}

        {canComplete && (
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
            sx={{ mt: 3, pt: 3, borderTop: "1px solid", borderColor: "divider" }}
          >
            <Typography variant="body2" color="text.secondary">
              {selectedLesson.isCompleted
                ? "このレッスンは完了しています。"
                : "見終わったら、完了にして次へ進みましょう。"}
            </Typography>
            <Button
              variant={selectedLesson.isCompleted ? "outlined" : "contained"}
              size="large"
              disabled={selectedLesson.isCompleted}
              onClick={() => onCompleteLesson()}
              startIcon={selectedLesson.isCompleted ? <CheckCircle /> : <TaskAlt />}
              sx={{ flexShrink: 0 }}
            >
              {selectedLesson.isCompleted ? "完了" : "完了にする"}
            </Button>
          </Stack>
        )}

        {canComplete && selectedLesson.requiresReflection && !selectedLesson.isCompleted && (
          <Alert severity="info" sx={{ mt: 3 }}>
            このレッスンでは、完了にしたあとに感想を書いてもらいます。
          </Alert>
        )}
      </>
    );
  }

  return null;
};
