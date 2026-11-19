// frontend/src/components/admin/QuizBuilder.tsx
import React, { useState, useCallback, memo } from "react";
import {
  Box,
  TextField,
  Button,
  Stack,
  Typography,
  Paper,
  IconButton,
  Radio,
  Checkbox,
  Chip,
  Alert,
} from "@mui/material";
import {
  Add,
  Delete,
  DragIndicator,
  ContentCopy,
  RadioButtonChecked,
  CheckBox,
} from "@mui/icons-material";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number | number[];
  type: "single" | "multiple";
  explanation?: string;
  points?: number;
}

interface QuizBuilderProps {
  initialQuestions?: QuizQuestion[];
  passingScore?: number;
  timeLimit?: number;
  onChange: (
    questions: QuizQuestion[],
    settings: { passingScore: number; timeLimit?: number }
  ) => void;
}

export const QuizBuilder: React.FC<QuizBuilderProps> = memo(
  ({ initialQuestions = [], passingScore = 70, timeLimit, onChange }) => {
    const [questions, setQuestions] = useState<QuizQuestion[]>(
      initialQuestions.length > 0
        ? initialQuestions
        : [
            {
              id: Date.now().toString(),
              question: "",
              options: ["", "", "", ""],
              correctAnswer: 0,
              type: "single",
              points: 1,
            },
          ]
    );
    const [settings, setSettings] = useState({
      passingScore,
      timeLimit: timeLimit || undefined,
    });

    const updateQuestion = useCallback(
      (index: number, field: keyof QuizQuestion, value: any) => {
        setQuestions((prev) => {
          const newQuestions = [...prev];
          newQuestions[index] = { ...newQuestions[index], [field]: value };
          // Defer onChange to avoid sync update issues
          setTimeout(() => onChange(newQuestions, settings), 0);
          return newQuestions;
        });
      },
      [onChange, settings]
    );

    const updateOption = useCallback(
      (questionIndex: number, optionIndex: number, value: string) => {
        setQuestions((prev) => {
          const newQuestions = [...prev];
          newQuestions[questionIndex].options[optionIndex] = value;
          setTimeout(() => onChange(newQuestions, settings), 0);
          return newQuestions;
        });
      },
      [onChange, settings]
    );

    const addOption = useCallback(
      (questionIndex: number) => {
        setQuestions((prev) => {
          const newQuestions = [...prev];
          newQuestions[questionIndex].options.push("");
          setTimeout(() => onChange(newQuestions, settings), 0);
          return newQuestions;
        });
      },
      [onChange, settings]
    );

    const removeOption = useCallback(
      (questionIndex: number, optionIndex: number) => {
        setQuestions((prev) => {
          const newQuestions = [...prev];
          newQuestions[questionIndex].options.splice(optionIndex, 1);

          // Adjust correct answer if needed
          const correctAnswer = newQuestions[questionIndex].correctAnswer;
          if (newQuestions[questionIndex].type === "single") {
            if (correctAnswer === optionIndex) {
              newQuestions[questionIndex].correctAnswer = 0;
            } else if (
              typeof correctAnswer === "number" &&
              correctAnswer > optionIndex
            ) {
              newQuestions[questionIndex].correctAnswer = correctAnswer - 1;
            }
          } else {
            // Multiple choice
            const correctAnswers = correctAnswer as number[];
            newQuestions[questionIndex].correctAnswer = correctAnswers
              .filter((ans) => ans !== optionIndex)
              .map((ans) => (ans > optionIndex ? ans - 1 : ans));
          }

          setTimeout(() => onChange(newQuestions, settings), 0);
          return newQuestions;
        });
      },
      [onChange, settings]
    );

    const addQuestion = useCallback(() => {
      setQuestions((prev) => {
        const newQuestion: QuizQuestion = {
          id: Date.now().toString(),
          question: "",
          options: ["", "", "", ""],
          correctAnswer: 0,
          type: "single",
          points: 1,
        };
        const newQuestions = [...prev, newQuestion];
        setTimeout(() => onChange(newQuestions, settings), 0);
        return newQuestions;
      });
    }, [onChange, settings]);

    const duplicateQuestion = useCallback(
      (index: number) => {
        setQuestions((prev) => {
          const questionToDuplicate = prev[index];
          const newQuestion: QuizQuestion = {
            ...questionToDuplicate,
            id: Date.now().toString(),
            question: questionToDuplicate.question + "（コピー）",
          };
          const newQuestions = [...prev];
          newQuestions.splice(index + 1, 0, newQuestion);
          setTimeout(() => onChange(newQuestions, settings), 0);
          return newQuestions;
        });
      },
      [onChange, settings]
    );

    const removeQuestion = useCallback(
      (index: number) => {
        setQuestions((prev) => {
          const newQuestions = prev.filter((_, i) => i !== index);
          setTimeout(() => onChange(newQuestions, settings), 0);
          return newQuestions;
        });
      },
      [onChange, settings]
    );

    const updateSettings = useCallback(
      (field: keyof typeof settings, value: any) => {
        setSettings((prev) => {
          const newSettings = { ...prev, [field]: value };
          setQuestions((q) => {
            setTimeout(() => onChange(q, newSettings), 0);
            return q;
          });
          return newSettings;
        });
      },
      [onChange]
    );

    const toggleQuestionType = useCallback(
      (index: number) => {
        setQuestions((prev) => {
          const newQuestions = [...prev];
          const question = newQuestions[index];

          if (question.type === "single") {
            question.type = "multiple";
            question.correctAnswer = [question.correctAnswer as number];
          } else {
            question.type = "single";
            question.correctAnswer =
              (question.correctAnswer as number[])[0] || 0;
          }

          setTimeout(() => onChange(newQuestions, settings), 0);
          return newQuestions;
        });
      },
      [onChange, settings]
    );

    const toggleCorrectAnswer = useCallback(
      (questionIndex: number, optionIndex: number) => {
        setQuestions((prev) => {
          const newQuestions = [...prev];
          const question = newQuestions[questionIndex];

          if (question.type === "single") {
            question.correctAnswer = optionIndex;
          } else {
            const currentAnswers = question.correctAnswer as number[];
            if (currentAnswers.includes(optionIndex)) {
              question.correctAnswer = currentAnswers.filter(
                (i) => i !== optionIndex
              );
            } else {
              question.correctAnswer = [...currentAnswers, optionIndex];
            }
          }

          setTimeout(() => onChange(newQuestions, settings), 0);
          return newQuestions;
        });
      },
      [onChange, settings]
    );

    return (
      <Box>
        <Stack spacing={3}>
          {/* Settings */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              クイズの設定
            </Typography>
            <Stack direction="row" spacing={3}>
              <TextField
                type="number"
                label="合格点（%）"
                value={settings.passingScore}
                onWheel={(e) => e.currentTarget.blur()}
                onChange={(e) =>
                  updateSettings("passingScore", parseInt(e.target.value))
                }
                inputProps={{ min: 0, max: 100 }}
                sx={{ width: 150 }}
              />
              <TextField
                type="number"
                onWheel={(e) => e.currentTarget.blur()}
                label="制限時間（分）"
                value={settings.timeLimit || ""}
                onChange={(e) =>
                  updateSettings(
                    "timeLimit",
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                placeholder="制限なし"
                inputProps={{ min: 1 }}
                sx={{ width: 150 }}
              />
            </Stack>
          </Paper>

          {/* Questions */}
          {questions.map((question, qIndex) => (
            <Paper key={question.id} sx={{ p: 3 }}>
              <Stack spacing={3}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Stack
                    direction="row"
                    flexWrap={"wrap"}
                    alignItems="center"
                    spacing={2}
                  >
                    <IconButton size="small" sx={{ cursor: "grab" }}>
                      <DragIndicator />
                    </IconButton>
                    <Typography variant="subtitle1" fontWeight={600}>
                      問題 {qIndex + 1}
                    </Typography>
                    <Chip
                      label={
                        question.type === "single"
                          ? "1つ選ぶ"
                          : "複数選ぶ"
                      }
                      size="small"
                      icon={
                        question.type === "single" ? (
                          <RadioButtonChecked />
                        ) : (
                          <CheckBox />
                        )
                      }
                      onClick={() => toggleQuestionType(qIndex)}
                      sx={{ cursor: "pointer" }}
                    />
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      onClick={() => duplicateQuestion(qIndex)}
                      size="small"
                      aria-label="問題を複製"
                    >
                      <ContentCopy />
                    </IconButton>
                    <IconButton
                      onClick={() => removeQuestion(qIndex)}
                      size="small"
                      color="error"
                      disabled={questions.length === 1}
                      aria-label="問題を削除"
                    >
                      <Delete />
                    </IconButton>
                  </Stack>
                </Stack>

                <TextField
                  fullWidth
                  label="問題文"
                  defaultValue={question.question}
                  onBlur={(e) =>
                    updateQuestion(qIndex, "question", e.target.value)
                  }
                  multiline
                  rows={2}
                />

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    選択肢
                    {question.type === "multiple" &&
                      "（正解をすべて選んでください）"}
                  </Typography>
                  <Stack spacing={2}>
                    {question.options.map((option, oIndex) => (
                      <Stack
                        key={oIndex}
                        direction="row"
                        spacing={2}
                        alignItems="center"
                      >
                        {question.type === "single" ? (
                          <Radio
                            checked={question.correctAnswer === oIndex}
                            onChange={() => toggleCorrectAnswer(qIndex, oIndex)}
                          />
                        ) : (
                          <Checkbox
                            checked={(
                              question.correctAnswer as number[]
                            ).includes(oIndex)}
                            onChange={() => toggleCorrectAnswer(qIndex, oIndex)}
                          />
                        )}
                        <TextField
                          fullWidth
                          label={`選択肢 ${oIndex + 1}`}
                          defaultValue={option}
                          onBlur={(e) =>
                            updateOption(qIndex, oIndex, e.target.value)
                          }
                          size="small"
                        />
                        <IconButton
                          onClick={() => removeOption(qIndex, oIndex)}
                          size="small"
                          disabled={question.options.length <= 2}
                          aria-label="選択肢を削除"
                        >
                          <Delete />
                        </IconButton>
                      </Stack>
                    ))}
                  </Stack>
                  <Button
                    startIcon={<Add />}
                    onClick={() => addOption(qIndex)}
                    size="small"
                    sx={{ mt: 1 }}
                  >
                    選択肢を追加
                  </Button>
                </Box>

                <Stack direction="row" spacing={2}>
                  <TextField
                    fullWidth
                    label="解説（答えたあとに表示）"
                    defaultValue={question.explanation || ""}
                    onBlur={(e) =>
                      updateQuestion(qIndex, "explanation", e.target.value)
                    }
                    multiline
                    rows={2}
                  />
                  <TextField
                    type="number"
                    label="配点"
                    value={question.points || 1}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    onChange={(e) =>
                      updateQuestion(qIndex, "points", parseInt(e.target.value))
                    }
                    inputProps={{ min: 1 }}
                    sx={{ width: 100 }}
                  />
                </Stack>
              </Stack>
            </Paper>
          ))}

          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={addQuestion}
            fullWidth
          >
            問題を追加
          </Button>

          {/* Summary */}
          <Alert severity="info">
            <Typography variant="subtitle2">
              問題 {questions.length} 問・配点の合計{" "}
              {questions.reduce((sum, q) => sum + (q.points || 1), 0)} 点・合格点{" "}
              {settings.passingScore}%
              {settings.timeLimit &&
                `・制限時間 ${settings.timeLimit} 分`}
            </Typography>
          </Alert>
        </Stack>
      </Box>
    );
  }
);

QuizBuilder.displayName = "QuizBuilder";
