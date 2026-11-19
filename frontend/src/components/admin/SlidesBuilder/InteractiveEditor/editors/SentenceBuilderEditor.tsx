// Enhanced SentenceBuilderEditor component
import React, { useState, useEffect, memo, useCallback, useRef } from "react";
import {
  Stack,
  TextField,
  Box,
  Typography,
  Chip,
  Paper,
  IconButton,
  Divider,
  Alert,
} from "@mui/material";
import {
  DragIndicator,
  Add as AddIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { SentenceBuilderItem } from "../../../../../types/interactive-items.types";

interface SentenceBuilderEditorProps {
  item: SentenceBuilderItem;
  onUpdate: (updates: Partial<SentenceBuilderItem>) => void;
}

export const SentenceBuilderEditor: React.FC<SentenceBuilderEditorProps> = memo(
  ({ item, onUpdate }) => {
    const [newWord, setNewWord] = useState("");
    const [newDistractor, setNewDistractor] = useState("");
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const translationRef = useRef(item.translation || "");

    const words = Array.isArray(item.words) ? item.words : [];
    const correctOrder = Array.isArray(item.correctOrder)
      ? item.correctOrder
      : [];
    const distractors = Array.isArray(item.distractors) ? item.distractors : [];

    // Clean up any existing empty words on component mount (index-safe for duplicates)
    useEffect(() => {
      // Build a map from old index -> new index, skipping empties by position
      const indexMap: Record<number, number> = {};
      const cleanWords: string[] = [];
      words.forEach((w, i) => {
        if (w && w.trim() !== "") {
          indexMap[i] = cleanWords.length;
          cleanWords.push(w.trim());
        }
      });

      // If nothing changed, bail
      if (cleanWords.length === words.length) return;

      // Remap correctOrder using the indexMap (drop entries pointing to removed empties)
      const cleanOrder = correctOrder
        .map((oldIdx) =>
          Object.prototype.hasOwnProperty.call(indexMap, oldIdx)
            ? indexMap[oldIdx]
            : -1
        )
        .filter((idx) => idx >= 0);

      onUpdate({
        words: cleanWords,
        correctOrder: cleanOrder,
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle adding words to the correct sentence (duplicates allowed)
    const handleAddWord = useCallback(() => {
      const trimmedWord = newWord.trim();
      if (!trimmedWord) return;

      const updatedWords = [...words, trimmedWord];
      const newIndex = words.length;
      const updatedOrder = [...correctOrder, newIndex];

      onUpdate({
        words: updatedWords,
        correctOrder: updatedOrder,
      });
      setNewWord("");
    }, [newWord, words, correctOrder, onUpdate]);

    // Handle adding distractor words (duplicates allowed)
    const handleAddDistractor = useCallback(() => {
      const trimmed = newDistractor.trim();
      if (!trimmed) return;

      const updatedDistractors = [...distractors, trimmed];
      onUpdate({ distractors: updatedDistractors });
      setNewDistractor("");
    }, [newDistractor, distractors, onUpdate]);

    // Handle removing distractor words
    const handleRemoveDistractor = useCallback(
      (indexToRemove: number) => {
        const updatedDistractors = distractors.filter(
          (_, i) => i !== indexToRemove
        );
        onUpdate({ distractors: updatedDistractors });
      },
      [distractors, onUpdate]
    );

    // Remove a word (by index) from words and reindex correctOrder
    const handleRemoveWord = useCallback(
      (indexToRemove: number) => {
        if (words.length <= 0) return;

        const updatedWords = words.filter((_, i) => i !== indexToRemove);
        const updatedOrder = correctOrder
          .filter((orderIndex) => orderIndex !== indexToRemove)
          .map((orderIndex) =>
            orderIndex > indexToRemove ? orderIndex - 1 : orderIndex
          );

        onUpdate({
          words: updatedWords,
          correctOrder: updatedOrder,
        });
      },
      [words, correctOrder, onUpdate]
    );

    // Drag and drop handlers
    const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
      setDraggedIndex(index);
      e.dataTransfer.effectAllowed = "move";
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    }, []);

    const handleDrop = useCallback(
      (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === targetIndex) return;

        const newOrder = [...correctOrder];
        const draggedItem = newOrder[draggedIndex];
        newOrder.splice(draggedIndex, 1);
        newOrder.splice(targetIndex, 0, draggedItem);

        onUpdate({ correctOrder: newOrder });
        setDraggedIndex(null);
      },
      [draggedIndex, correctOrder, onUpdate]
    );

    const getOrderedWords = useCallback(() => {
      return correctOrder.map((wordIndex) => words[wordIndex]).filter(Boolean);
    }, [correctOrder, words]);

    const handleTranslationBlur = useCallback(() => {
      if (translationRef.current !== (item.translation || "")) {
        onUpdate({ translation: translationRef.current });
      }
    }, [item.translation, onUpdate]);

    const canDeleteWord = words.length > 0;
    const totalWords = words.length + distractors.length;

    return (
      <Stack spacing={3}>
        {/* Header Info */}
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            受講者は正しい言葉を選び、正しい順に並べます。まぎらわしい言葉を加えると、少しむずかしくなります。
          </Typography>
        </Alert>

        {/* Add Correct Words Section */}
        <Box>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ fontWeight: 600 }}
          >
            正しい言葉（{words.length}）
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            正しい文に使う言葉です。
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              fullWidth
              size="small"
              label="正しい言葉を追加"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddWord()}
              placeholder="例：@ファイル名"
              sx={{ maxWidth: 300 }}
            />
            <IconButton
              onClick={handleAddWord}
              disabled={!newWord.trim()}
              color="primary"
              aria-label="正しい言葉を追加"
            >
              <AddIcon />
            </IconButton>
          </Stack>
        </Box>

        <Divider />

        {/* Correct Sentence Order */}
        <Box>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ fontWeight: 600 }}
          >
            正しい順番
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            ドラッグして、言葉を正しい順に並べます。
          </Typography>

          {correctOrder.length > 0 ? (
            <Stack spacing={1}>
              {correctOrder.map((wordIndex, orderIndex) => (
                <Paper
                  key={`${wordIndex}-${orderIndex}`}
                  elevation={1}
                  draggable
                  onDragStart={(e) => handleDragStart(e, orderIndex)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, orderIndex)}
                  sx={{
                    p: 1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    cursor: "grab",
                    minHeight: 48,
                    backgroundColor: "background.paper",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    "&:hover": {
                      borderColor: "primary.main",
                    },
                    "&:active": {
                      cursor: "grabbing",
                    },
                  }}
                >
                  <DragIndicator sx={{ color: "text.secondary", fontSize: 20 }} />
                  <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
                    {orderIndex + 1}. {words[wordIndex] || `言葉 ${wordIndex}`}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveWord(wordIndex)}
                    disabled={!canDeleteWord}
                    aria-label="削除"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Paper>
              ))}
            </Stack>
          ) : (
            <Paper
              sx={{
                p: 3,
                textAlign: "center",
                backgroundColor: "background.default",
                border: "2px dashed",
                borderColor: "divider",
                borderRadius: 2,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                上の欄から正しい言葉を追加してください
              </Typography>
            </Paper>
          )}
        </Box>

        <Divider />

        {/* Add Distractor Words Section */}
        <Box>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ fontWeight: 600 }}
          >
            まぎらわしい言葉（{distractors.length}）
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            選択肢には出ますが、正しい文には使わない言葉です。
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              label="まぎらわしい言葉を追加"
              value={newDistractor}
              onChange={(e) => setNewDistractor(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddDistractor()}
              placeholder="例：#ファイル名"
              sx={{ maxWidth: 300 }}
            />
            <IconButton
              onClick={handleAddDistractor}
              disabled={!newDistractor.trim()} // allow duplicates; only block empty
              color="primary"
              aria-label="まぎらわしい言葉を追加"
            >
              <AddIcon />
            </IconButton>
          </Stack>

          {/* Display Distractor Words */}
          {distractors.length > 0 ? (
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                p: 2,
                backgroundColor: "background.default",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
              }}
            >
              {distractors.map((word, index) => (
                <Chip
                  key={`distractor-${index}`}
                  label={word}
                  onDelete={() => handleRemoveDistractor(index)}
                  variant="outlined"
                  sx={{ fontWeight: 500 }}
                />
              ))}
            </Box>
          ) : (
            <Paper
              sx={{
                p: 3,
                textAlign: "center",
                backgroundColor: "background.default",
                border: "2px dashed",
                borderColor: "divider",
                borderRadius: 2,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                まぎらわしい言葉を加えると、問題が少しむずかしくなります
              </Typography>
            </Paper>
          )}
        </Box>

        <Divider />

        {/* Translation Section */}
        <Box>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ fontWeight: 600, color: "text.primary" }}
          >
            文の意味
          </Typography>
          <TextField
            fullWidth
            size="small"
            label="文の意味"
            defaultValue={item.translation || ""}
            onChange={(e) => {
              translationRef.current = e.target.value;
            }}
            onBlur={handleTranslationBlur}
            placeholder="例：ファイルを指定して、説明を頼む"
            helperText="受講者へのヒントとして表示されます"
          />
        </Box>

        {/* Enhanced Preview Section */}
        {(getOrderedWords().length > 0 || distractors.length > 0) && (
          <>
            <Divider />
            <Box>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ fontWeight: 600, color: "text.primary" }}
              >
                受講者の画面
              </Typography>

              {/* Correct Sentence */}
              {getOrderedWords().length > 0 && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    mb: 2,
                    backgroundColor: "background.default",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    正解（受講者には見えません）
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={1}
                    flexWrap="wrap"
                    sx={{ mb: 2 }}
                  >
                    {getOrderedWords().map((word, i) => (
                      <Chip
                        key={i}
                        label={`${i + 1}. ${word}`}
                        color="primary"
                        variant="outlined"
                        sx={{ fontWeight: 600, fontSize: "0.875rem" }}
                      />
                    ))}
                  </Stack>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                      textAlign: "center",
                      p: 1,
                      bgcolor: "background.paper",
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    「{getOrderedWords().join(" ")}」
                  </Typography>
                  {item.translation && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        borderTop: "1px solid",
                        borderColor: "divider",
                        pt: 1,
                        mt: 1,
                        textAlign: "center",
                      }}
                    >
                      意味：{item.translation}
                    </Typography>
                  )}
                </Paper>
              )}

              {/* All Available Words (shuffled simulation) */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  backgroundColor: "background.default",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  sx={{ fontWeight: 600 }}
                >
                  受講者に表示される言葉（順はばらばら）
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {[...getOrderedWords(), ...distractors]
                    .sort(() => Math.random() - 0.5) // Simple shuffle for preview
                    .map((word, i) => {
                      const isCorrect = getOrderedWords().includes(word);
                      return (
                        <Chip
                          key={i}
                          label={word}
                          color={isCorrect ? "primary" : "default"}
                          variant={isCorrect ? "filled" : "outlined"}
                          sx={{
                            fontWeight: 500,
                            fontSize: "0.875rem",
                          }}
                        />
                      );
                    })}
                </Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: "block" }}
                >
                  塗りつぶしの言葉が正解、枠だけの言葉がまぎらわしい言葉です
                </Typography>
              </Paper>
            </Box>
          </>
        )}

        {/* Enhanced Statistics */}
        <Paper
          sx={{
            p: 2,
            bgcolor: "background.default",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography
            variant="subtitle2"
            gutterBottom
            sx={{ fontWeight: 600 }}
          >
            問題の概要
          </Typography>
          <Stack direction="row" spacing={3} flexWrap="wrap">
            <Typography variant="body2" color="text.secondary">
              正しい言葉：{words.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              まぎらわしい言葉：{distractors.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              選択肢の合計：{totalWords}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              難易度：
              {distractors.length === 0
                ? "やさしい（並べるだけ）"
                : distractors.length < words.length
                ? "ふつう"
                : distractors.length >= words.length
                ? "むずかしい"
                : "カスタム"}
            </Typography>
          </Stack>
        </Paper>

        {/* Validation Warnings */}
        {words.length < 2 && (
          <Alert severity="warning">
            <Typography variant="body2">
              正しい言葉を2つ以上追加してください。
            </Typography>
          </Alert>
        )}

        {words.length > 0 && !item.translation && (
          <Alert severity="info">
            <Typography variant="body2">
              文の意味を入力しておくと、受講者が答えを考えやすくなります。
            </Typography>
          </Alert>
        )}

        {distractors.length === 0 && words.length > 0 && (
          <Alert severity="info">
            <Typography variant="body2">
              まぎらわしい言葉を加えると、並べるだけでなく、言葉を選ぶ問題になります。
            </Typography>
          </Alert>
        )}
      </Stack>
    );
  }
);

SentenceBuilderEditor.displayName = "SentenceBuilderEditor";
