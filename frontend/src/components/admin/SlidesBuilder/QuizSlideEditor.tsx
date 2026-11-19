import React, { memo, useCallback } from "react";
import {
  TextField,
  Stack,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Tooltip,
  FormControlLabel,
  Radio,
  RadioGroup,
  Alert,
  Divider,
  Box,
  Switch,
} from "@mui/material";
import {
  Add,
  Delete,
  RadioButtonChecked,
  CheckBox,
  DragIndicator,
  Timer,
  Psychology,
} from "@mui/icons-material";
import { Slide, SlideContent } from "../../../types/slide.types";

interface QuizSlideEditorProps {
  slide: Slide;
  index: number;
  onUpdate: (index: number, updates: Partial<Slide>) => void;
  onUpdateContent: (
    index: number,
    contentUpdates: Partial<SlideContent>
  ) => void;
}

export const QuizSlideEditor: React.FC<QuizSlideEditorProps> = memo(
  ({ slide, index, onUpdateContent }) => {
    const { content } = slide;
    const quizContent = content.content || {};

    const updateQuizContent = useCallback(
      (updates: any) => {
        onUpdateContent(index, {
          content: { ...quizContent, ...updates },
        });
      },
      [index, quizContent, onUpdateContent]
    );

    const addOption = () => {
      const newOptions = [
        ...(quizContent.options || []),
        `選択肢${(quizContent.options?.length || 0) + 1}`,
      ];
      updateQuizContent({ options: newOptions });
    };

    const updateOption = (optionIndex: number, value: string) => {
      const newOptions = [...(quizContent.options || [])];
      newOptions[optionIndex] = value;
      updateQuizContent({ options: newOptions });
    };

    const removeOption = (optionIndex: number) => {
      if ((quizContent.options?.length || 0) <= 2) return; // Keep minimum 2 options

      const newOptions =
        quizContent.options?.filter((_: any, i: number) => i !== optionIndex) ||
        [];
      let updates: any = { options: newOptions };

      // Handle single choice - adjust correctAnswer if needed
      if (quizContent.type === "single-choice") {
        if (
          quizContent.correctAnswer >= optionIndex &&
          quizContent.correctAnswer > 0
        ) {
          updates.correctAnswer = quizContent.correctAnswer - 1;
        } else if (quizContent.correctAnswer === optionIndex) {
          updates.correctAnswer = 0; // Reset to first option if deleted option was selected
        }
      }

      // Handle multiple choice - remove from correctAnswers array and adjust indices
      if (quizContent.type === "multiple-choice") {
        const currentCorrect = quizContent.correctAnswers || [];
        const newCorrect = currentCorrect
          .filter((i: number) => i !== optionIndex) // Remove the deleted option
          .map((i: number) => (i > optionIndex ? i - 1 : i)); // Adjust indices
        updates.correctAnswers = newCorrect;
      }

      updateQuizContent(updates);
    };

    const toggleMultipleChoiceAnswer = (optionIndex: number) => {
      const currentCorrect = quizContent.correctAnswers || [];
      const newCorrect = currentCorrect.includes(optionIndex)
        ? currentCorrect.filter((i: number) => i !== optionIndex)
        : [...currentCorrect, optionIndex];

      updateQuizContent({ correctAnswers: newCorrect });
    };

    // Initialize with default values if needed
    React.useEffect(() => {
      if (!quizContent.type) {
        updateQuizContent({
          type: "single-choice",
          options: ["選択肢1", "選択肢2"],
          correctAnswer: 0,
        });
      }
    }, []);

    return (
      <Stack spacing={3}>
        {/* Basic Quiz Info */}
        <TextField
          fullWidth
          label="タイトル"
          defaultValue={content.title || ""}
          onBlur={(e) => onUpdateContent(index, { title: e.target.value })}
          error={!content.title?.trim()}
          helperText={!content.title?.trim() ? "タイトルを入力してください" : ""}
        />

        <TextField
          fullWidth
          multiline
          rows={3}
          label="問題文"
          defaultValue={quizContent.question || ""}
          onBlur={(e) => updateQuizContent({ question: e.target.value })}
          error={!quizContent.question?.trim()}
          helperText={
            !quizContent.question?.trim() ? "問題文を入力してください" : ""
          }
          placeholder="問題文を入力します"
        />

        {/* Quiz Type Selection - Only Single and Multiple Choice */}
        <FormControl fullWidth>
          <InputLabel>形式</InputLabel>
          <Select
            value={quizContent.type || "single-choice"}
            label="形式"
            onChange={(e) => {
              const newType = e.target.value;
              let updates: any = { type: newType };

              // Convert between types
              if (
                newType === "single-choice" &&
                quizContent.type === "multiple-choice"
              ) {
                // Convert multiple choice to single choice - use first correct answer
                const firstCorrect = quizContent.correctAnswers?.[0] || 0;
                updates.correctAnswer = firstCorrect;
                updates.correctAnswers = undefined;
              } else if (
                newType === "multiple-choice" &&
                quizContent.type === "single-choice"
              ) {
                // Convert single choice to multiple choice - use current correct answer
                const currentCorrect = quizContent.correctAnswer || 0;
                updates.correctAnswers = [currentCorrect];
                updates.correctAnswer = undefined;
              }

              updateQuizContent(updates);
            }}
          >
            <MenuItem value="single-choice">
              <Stack direction="row" alignItems="center" spacing={1}>
                <RadioButtonChecked color="primary" />
                <Box>
                  <Typography>1つ選ぶ</Typography>
                  <Typography variant="caption" color="text.secondary">
                    正解を1つ選びます
                  </Typography>
                </Box>
              </Stack>
            </MenuItem>
            <MenuItem value="multiple-choice">
              <Stack direction="row" alignItems="center" spacing={1}>
                <CheckBox color="primary" />
                <Box>
                  <Typography>複数選ぶ</Typography>
                  <Typography variant="caption" color="text.secondary">
                    正解をいくつでも選べます
                  </Typography>
                </Box>
              </Stack>
            </MenuItem>
          </Select>
        </FormControl>

        {/* Quiz Options */}
        <Card variant="outlined" sx={{ p: 3 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Typography variant="h6" fontWeight={600}>
              選択肢
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={addOption}
              size="small"
              sx={{ borderRadius: 2 }}
              disabled={(quizContent.options?.length || 0) >= 8}
            >
              選択肢を追加
            </Button>
          </Stack>

          <Stack spacing={2}>
            {(quizContent.options || []).map(
              (option: string, optionIndex: number) => (
                <Stack
                  key={optionIndex}
                  direction="row"
                  spacing={2}
                  alignItems="center"
                >
                  <Box
                    sx={{ display: "flex", alignItems: "center", minWidth: 40 }}
                  >
                    {quizContent.type === "single-choice" ? (
                      <FormControlLabel
                        control={
                          <Radio
                            checked={quizContent.correctAnswer === optionIndex}
                            onChange={() =>
                              updateQuizContent({ correctAnswer: optionIndex })
                            }
                            color="success"
                          />
                        }
                        label=""
                        sx={{ mr: 0 }}
                      />
                    ) : (
                      <FormControlLabel
                        control={
                          <input
                            type="checkbox"
                            checked={
                              quizContent.correctAnswers?.includes(
                                optionIndex
                              ) || false
                            }
                            onChange={() =>
                              toggleMultipleChoiceAnswer(optionIndex)
                            }
                            style={{
                              width: 20,
                              height: 20,
                              accentColor: "#AE4A24",
                              cursor: "pointer",
                            }}
                          />
                        }
                        label=""
                        sx={{ mr: 0 }}
                      />
                    )}
                  </Box>

                  <TextField
                    fullWidth
                    label={`選択肢 ${String.fromCharCode(65 + optionIndex)}`}
                    defaultValue={option}
                    onBlur={(e) => updateOption(optionIndex, e.target.value)}
                    error={!option.trim()}
                    helperText={
                      quizContent.type === "single-choice"
                        ? quizContent.correctAnswer === optionIndex
                          ? "正解"
                          : ""
                        : quizContent.correctAnswers?.includes(optionIndex)
                        ? "正解"
                        : ""
                    }
                    placeholder={`選択肢 ${String.fromCharCode(
                      65 + optionIndex
                    )} を入力`}
                  />

                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Tooltip title="ドラッグで並べ替え">
                      <IconButton size="small" color="default">
                        <DragIndicator />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="選択肢を削除">
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => removeOption(optionIndex)}
                        disabled={(quizContent.options?.length || 0) <= 2}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Stack>
              )
            )}
          </Stack>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              {quizContent.type === "single-choice"
                ? "正解の選択肢の横にある丸を選んでください。受講者には選択肢がランダムな順で表示されます。"
                : "正解の選択肢にすべてチェックを入れてください。受講者は複数選べます。"}
            </Typography>
          </Alert>
        </Card>

        {/* Quiz Settings */}
        <Card variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            クイズの設定
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="制限時間（秒）"
                value={quizContent.timeLimit || ""}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                onChange={(e) =>
                  updateQuizContent({
                    timeLimit: parseInt(e.target.value) || 0,
                  })
                }
                inputProps={{ min: 0 }}
                helperText="0 なら制限なし"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="配点"
                value={quizContent.points || 1}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                onChange={(e) =>
                  updateQuizContent({ points: parseInt(e.target.value) || 1 })
                }
                inputProps={{ min: 1 }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={quizContent.randomizeOptions || false}
                    onChange={(e) =>
                      updateQuizContent({ randomizeOptions: e.target.checked })
                    }
                  />
                }
                label="選択肢の順をランダムにする"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={quizContent.allowRetry || true}
                    onChange={(e) =>
                      updateQuizContent({ allowRetry: e.target.checked })
                    }
                  />
                }
                label="やり直しを許可"
              />
            </Grid>
          </Grid>
        </Card>

        {/* Explanation */}
        <TextField
          fullWidth
          multiline
          rows={3}
          label="解説（任意）"
          defaultValue={quizContent.explanation || ""}
          onBlur={(e) => updateQuizContent({ explanation: e.target.value })}
          placeholder="なぜその答えが正解なのかを書きます"
          helperText="受講者が答えたあとに表示されます"
        />

        {/* Quiz Preview */}
        <Card variant="outlined" sx={{ bgcolor: "background.default" }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
              クイズのプレビュー
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                flexWrap="wrap"
              >
                <Typography variant="body2" color="text.secondary">
                  {quizContent.type === "single-choice" ? "1つ選ぶ" : "複数選ぶ"}
                </Typography>
                {quizContent.timeLimit > 0 && (
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Timer fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {quizContent.timeLimit}秒
                    </Typography>
                  </Stack>
                )}
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Psychology fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {quizContent.points || 1}点
                  </Typography>
                </Stack>
              </Stack>
            </Box>

            <Typography variant="h6" gutterBottom>
              {quizContent.question || "ここに問題文が表示されます"}
            </Typography>

            {/* Preview Options */}
            {quizContent.type === "single-choice" && (
              <RadioGroup>
                {(quizContent.options || []).map(
                  (option: string, optionIndex: number) => (
                    <FormControlLabel
                      key={optionIndex}
                      value={optionIndex}
                      control={<Radio disabled />}
                      label={option || `選択肢${optionIndex + 1}`}
                      sx={{
                        bgcolor:
                          quizContent.correctAnswer === optionIndex
                            ? "success.light"
                            : "transparent",
                        borderRadius: 1,
                        px: 1,
                        border:
                          quizContent.correctAnswer === optionIndex
                            ? "2px solid"
                            : "none",
                        borderColor: "success.main",
                      }}
                    />
                  )
                )}
              </RadioGroup>
            )}

            {quizContent.type === "multiple-choice" && (
              <Stack spacing={1}>
                {(quizContent.options || []).map(
                  (option: string, optionIndex: number) => (
                    <FormControlLabel
                      key={optionIndex}
                      control={
                        <input
                          type="checkbox"
                          disabled
                          checked={
                            quizContent.correctAnswers?.includes(optionIndex) ||
                            false
                          }
                          style={{
                            width: 16,
                            height: 16,
                            accentColor: "#AE4A24",
                          }}
                        />
                      }
                      label={option || `選択肢${optionIndex + 1}`}
                      sx={{
                        bgcolor: quizContent.correctAnswers?.includes(
                          optionIndex
                        )
                          ? "success.light"
                          : "transparent",
                        borderRadius: 1,
                        px: 1,
                        border: quizContent.correctAnswers?.includes(
                          optionIndex
                        )
                          ? "2px solid"
                          : "none",
                        borderColor: "success.main",
                      }}
                    />
                  )
                )}
              </Stack>
            )}

            {quizContent.explanation && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>解説：</strong>{quizContent.explanation}
                </Typography>
              </Alert>
            )}
          </CardContent>
        </Card>
      </Stack>
    );
  }
);

QuizSlideEditor.displayName = "QuizSlideEditor";
