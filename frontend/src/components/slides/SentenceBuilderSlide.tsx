import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Paper,
  Alert,
  Chip,
  Fade,
  useTheme,
  useMediaQuery,
  LinearProgress,
} from "@mui/material";
import { Check } from "@mui/icons-material";
import { SlideComponentProps } from "../../types/slide.types";

interface EnhancedSentenceBuilderItem {
  words: string[];
  correctOrder: number[];
  translation?: string;
  distractors?: string[];
}

type ValidationLevel = 'success' | 'error' | 'warning';

interface ValidationResult {
  isValid: boolean;
  type: ValidationLevel;
  message: string;
}

// Each *instance* of a word (including duplicates) is a token
interface WordToken {
  id: string;          // unique instance id
  text: string;        // the visible word
  isCorrect: boolean;  // whether it belongs to the correct pool (not a distractor)
  kind: 'correct' | 'distractor';
  srcIndex: number;    // original index within its source array (for stable ids)
}

// Fisher-Yates shuffle
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const getValidWords = (words: string[] = []): string[] =>
  words.filter((w) => w && w.trim() !== "").map((w) => w.trim());

const buildCorrectSentence = (words: string[] = [], correctOrder: number[] = []): string[] => {
  const validWords = getValidWords(words);
  return (correctOrder || [])
    .map((idx) => validWords[idx])
    .filter((w) => w && w.trim() !== "");
};

interface SentenceState {
  selectedTokenIds: string[]; // order user selected
  isCompleted: boolean;
  shuffledTokens: WordToken[]; // all options, shuffled
  resetTrigger: number;
}

export const SentenceBuilderSlide: React.FC<SlideComponentProps> = ({
  slide,
  showFeedback,
  validationResults,
  checkAnswer,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const content = slide.content.content;
  const slideId = `sentence-builder-${slide.id}`;

  const currentItem: EnhancedSentenceBuilderItem =
    (content.items?.[0] as EnhancedSentenceBuilderItem) || {
      words: [],
      correctOrder: [],
      translation: "",
      distractors: [],
    };

  // Memoized normalized data
  const validWords = useMemo(
    () => getValidWords(currentItem?.words),
    [currentItem?.words]
  );

  const validDistractors = useMemo(
    () => getValidWords(currentItem?.distractors),
    [currentItem?.distractors]
  );

  const correctSentence = useMemo(
    () => buildCorrectSentence(currentItem?.words, currentItem?.correctOrder || []),
    [currentItem?.words, currentItem?.correctOrder]
  );

  // Build tokens for *each instance* so duplicates are independent
  const allTokens = useMemo<WordToken[]>(() => {
    const correctTokens: WordToken[] = validWords.map((text, i) => ({
      id: `c-${i}`, // stable per instance
      text,
      isCorrect: true,
      kind: 'correct',
      srcIndex: i,
    }));
    const distractorTokens: WordToken[] = validDistractors.map((text, i) => ({
      id: `d-${i}`,
      text,
      isCorrect: false,
      kind: 'distractor',
      srcIndex: i,
    }));
    return [...correctTokens, ...distractorTokens];
  }, [validWords, validDistractors]);

  // For quick lookup
  const tokenById = useMemo(() => {
    const map = new Map<string, WordToken>();
    allTokens.forEach(t => map.set(t.id, t));
    return map;
  }, [allTokens]);

  const totalCorrectWords = correctSentence.length; // exact number required
  const totalAvailableWords = allTokens.length;

  const [sentenceState, setSentenceState] = useState<SentenceState>({
    selectedTokenIds: [],
    isCompleted: false,
    shuffledTokens: shuffleArray(allTokens),
    resetTrigger: 0,
  });

  // Recreate/shuffle when tokens change
  useEffect(() => {
    if (allTokens.length > 0) {
      setSentenceState({
        selectedTokenIds: [],
        isCompleted: false,
        shuffledTokens: shuffleArray(allTokens),
        resetTrigger: 0,
      });
    } else {
      setSentenceState({
        selectedTokenIds: [],
        isCompleted: false,
        shuffledTokens: [],
        resetTrigger: 0,
      });
    }
  }, [allTokens]);

  const progressCount = sentenceState.selectedTokenIds.length;
  const isComplete = progressCount === totalCorrectWords && totalCorrectWords > 0;

  // Compute validation (compare by *text sequence*, so any duplicate instance is fine)
  const displayValidation: ValidationResult | null = useMemo(() => {
    if (!currentItem || totalCorrectWords === 0) return null;

    const userCount = sentenceState.selectedTokenIds.length;

    if (userCount < totalCorrectWords) {
      return {
        isValid: false,
        type: 'warning',
        message: `${totalCorrectWords}語を選んで文を作ってください（${userCount}/${totalCorrectWords}）`,
      };
    }
    if (userCount > totalCorrectWords) {
      return {
        isValid: false,
        type: 'error',
        message: `選んだ語が${userCount - totalCorrectWords}個多いです。${totalCorrectWords}語にしてください。`,
      };
    }

    const selectedTexts = sentenceState.selectedTokenIds.map((id) => tokenById.get(id)?.text ?? "");
    const isCorrectSentence = JSON.stringify(selectedTexts) === JSON.stringify(correctSentence);

    if (isCorrectSentence) {
      return {
        isValid: true,
        type: 'success',
        message: '正解です。選んだ語も順番も合っています。',
      };
    }
    return {
      isValid: false,
      type: 'error',
      message: '不正解です。もう一度やってみましょう。',
    };
  }, [currentItem, sentenceState.selectedTokenIds, totalCorrectWords, correctSentence, tokenById]);

  const showSlideFeeback = showFeedback[slideId];

  // Auto-reset wrong answers; mark success
  useEffect(() => {
    if (displayValidation?.type === "error" && showSlideFeeback) {
      const resetTimer = setTimeout(() => {
        handleReset();
      }, 1500);
      return () => clearTimeout(resetTimer);
    } else if (displayValidation?.type === "success" && showSlideFeeback) {
      setSentenceState((prev) => ({ ...prev, isCompleted: true }));
    }
  }, [displayValidation?.type, showSlideFeeback]); // eslint-disable-line react-hooks/exhaustive-deps

  // Click a token (by id). Each instance is independent.
  const handleWordClick = useCallback((tokenId: string) => {
    setSentenceState((prev) => {
      const isSelected = prev.selectedTokenIds.includes(tokenId);

      if (isSelected) {
        // remove just this instance
        return {
          ...prev,
          selectedTokenIds: prev.selectedTokenIds.filter((id) => id !== tokenId),
        };
      }

      // add if capacity
      if (prev.selectedTokenIds.length < totalCorrectWords) {
        return {
          ...prev,
          selectedTokenIds: [...prev.selectedTokenIds, tokenId],
        };
      }

      return prev;
    });
  }, [totalCorrectWords]);

  const handleRemoveWordFromSentence = useCallback((index: number) => {
    setSentenceState((prev) => ({
      ...prev,
      selectedTokenIds: prev.selectedTokenIds.filter((_, i) => i !== index),
    }));
  }, []);

  const handleCheckAnswer = useCallback(() => {
    if (!currentItem || !isComplete) return;

    const selectedTexts = sentenceState.selectedTokenIds.map((id) => tokenById.get(id)?.text ?? "");
    checkAnswer(slideId, selectedTexts, correctSentence, "sentence-builder");
  }, [currentItem, isComplete, correctSentence, slideId, checkAnswer, sentenceState.selectedTokenIds, tokenById]);

  const handleReset = useCallback(() => {
    setSentenceState((prev) => ({
      selectedTokenIds: [],
      shuffledTokens: shuffleArray(allTokens),
      resetTrigger: prev.resetTrigger + 1,
      isCompleted: false,
    }));
  }, [allTokens]);

  // Word status for button rendering (instance-aware)
  const getWordStatus = useCallback((tokenId: string) => {
    const isSelected = sentenceState.selectedTokenIds.includes(tokenId);
    const token = tokenById.get(tokenId);
    const canSelect = !isSelected && sentenceState.selectedTokenIds.length < totalCorrectWords;

    return {
      isSelected,
      isCorrectWord: !!token?.isCorrect,
      isDistractor: token?.kind === 'distractor',
      canSelect,
      canInteract: isSelected || canSelect,
      text: token?.text ?? "",
    };
  }, [sentenceState.selectedTokenIds, totalCorrectWords, tokenById]);

  // Early empty state
  if (totalCorrectWords === 0) {
    return (
      <Box sx={{ textAlign: "center", p: 4 }}>
        <Typography variant="h6" color="text.secondary">
          この問題には、まだ語が登録されていません。
        </Typography>
      </Box>
    );
  }

  const selectedTexts = sentenceState.selectedTokenIds.map((id) => tokenById.get(id)?.text ?? "");

  return (
    <Box
      sx={{
        padding: { xs: 2, sm: 3, md: 4 },
        maxWidth: "900px",
        margin: "0 auto",
        minHeight: { xs: "auto", md: "100vh" },
      }}
    >
      {/* Title */}
      <Typography
        variant={isMobile ? "h5" : "h4"}
        gutterBottom
        fontWeight={600}
        textAlign="center"
        sx={{ mb: { xs: 2, md: 3 } }}
      >
        {slide.content.title}
      </Typography>

      {/* Instructions */}
      <Typography
        variant="h3"
        sx={{
          textAlign: "center",
          mb: { xs: 3, md: 4 },
          px: { xs: 1, md: 0 },
        }}
      >
        {content.instruction}
      </Typography>

      {/* Feedback */}
      {showSlideFeeback && displayValidation && (
        <Fade in>
          <Alert
            severity={displayValidation.type}
            sx={{
              mb: 3,
              borderRadius: 2,
              fontSize: { xs: "1rem", md: "1.1rem" },
              fontWeight: 500,
            }}
          >
            {displayValidation.message}
            {displayValidation.type === "error" && (
              <Typography
                variant="body2"
                sx={{
                  mt: 1,
                  opacity: 0.8,
                  fontSize: { xs: "0.85rem", md: "0.9rem" },
                }}
              >
                まもなく最初からやり直しになります。
              </Typography>
            )}
          </Alert>
        </Fade>
      )}

      {/* Translation */}
      {currentItem.translation && (
        <Paper
          sx={{
            p: { xs: 2, md: 3 },
            mb: { xs: 3, md: 4 },
            bgcolor: "background.default",
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "none",
            borderRadius: 3,
            textAlign: "center",
          }}
        >
          <Typography
            variant={isMobile ? "subtitle1" : "h6"}
            sx={{ mb: 1, fontWeight: 600, color: "text.secondary" }}
          >
            ヒント
          </Typography>
          <Typography variant="body1" sx={{ fontSize: { xs: "1rem", md: "1.1rem" } }}>
            {currentItem.translation}
          </Typography>
        </Paper>
      )}

      {/* Sentence Building Area */}
      <Paper
        sx={{
          minHeight: { xs: "120px", md: "140px" },
          p: { xs: 2, md: 3 },
          pb: { xs: "60px" },
          mb: { xs: 3, md: 4 },
          backgroundColor: "background.default",
          border: "2px dashed",
          borderColor: selectedTexts.length > 0 ? "primary.main" : "divider",
          boxShadow: "none",
          borderRadius: 3,
          display: "flex",
          flexWrap: "wrap",
          gap: { xs: 1, md: 2 },
          alignItems: "center",
          justifyContent: selectedTexts.length > 0 ? "flex-start" : "center",
          transition: "all 0.3s ease",
          position: "relative",
        }}
      >
        {selectedTexts.length === 0 ? (
          <Typography
            variant={isMobile ? "body1" : "h6"}
            color="text.secondary"
            sx={{ fontStyle: "italic", textAlign: "center" }}
          >
            下から{totalCorrectWords}語を選んで、文を作ってください
          </Typography>
        ) : (
          <>
            {selectedTexts.map((text, index) => (
              <Chip
                key={`selected-${sentenceState.resetTrigger}-${index}`}
                label={`${index + 1}. ${text}`}
                onClick={() => handleRemoveWordFromSentence(index)}
                sx={{
                  fontSize: { xs: "0.9rem", md: "1.2rem" },
                  fontWeight: 600,
                  p: { xs: 1, md: 2 },
                  height: "auto",
                  backgroundColor: "primary.main",
                  color: "primary.contrastText",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: "primary.dark",
                    transform: "scale(1.05)",
                  },
                }}
                clickable
              />
            ))}
            {/* Current sentence preview */}
            <Box
              sx={{
                position: "absolute",
                bottom: 8,
                left: { xs: 8, md: 16 },
                right: { xs: 8, md: 16 },
                textAlign: "center",
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontStyle: "italic",
                  fontSize: { xs: "0.75rem", md: "0.875rem" },
                }}
              >
                いまの文：「{selectedTexts.join(" ")}」
              </Typography>
            </Box>
          </>
        )}
      </Paper>

      {/* Available Words */}
      <Paper
        sx={{
          p: { xs: 2, md: 3 },
          mb: { xs: 3, md: 4 },
          borderRadius: 3,
          bgcolor: "background.paper",
        }}
      >
        <Typography
          variant={isMobile ? "subtitle1" : "h6"}
          gutterBottom
          textAlign="center"
          fontWeight={600}
          sx={{ mb: { xs: 2, md: 3 } }}
        >
          選べる語
          {validDistractors.length > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              使わない語もまじっています。よく見て選んでください。
            </Typography>
          )}
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: { xs: 1, md: 2 },
            justifyContent: "center",
          }}
        >
          {sentenceState.shuffledTokens.map((token) => {
            const status = getWordStatus(token.id);
            return (
              <Button
                key={`${sentenceState.resetTrigger}-${token.id}`}
                variant={status.isSelected ? "outlined" : "contained"}
                onClick={() => handleWordClick(token.id)}
                disabled={!status.canInteract}
                sx={{
                  fontSize: { xs: "0.9rem", md: "1.1rem" },
                  fontWeight: 600,
                  p: { xs: 1, md: 2 },
                  minWidth: { xs: "70px", md: "90px" },
                  position: "relative",
                  backgroundColor: status.isSelected
                    ? "transparent"
                    : status.canSelect
                    ? "secondary.main"
                    : "grey.300",
                  color: status.isSelected
                    ? "secondary.main"
                    : status.canSelect
                    ? "secondary.contrastText"
                    : "text.disabled",
                  borderColor: status.isSelected ? "secondary.main" : "transparent",
                  "&:hover": {
                    backgroundColor: status.canInteract
                      ? status.isSelected
                        ? "secondary.light"
                        : "secondary.dark"
                      : "grey.300",
                    transform: status.canInteract ? "scale(1.05)" : "none",
                  },
                  "&:disabled": {
                    backgroundColor: "grey.300",
                    color: "text.disabled",
                  },
                }}
              >
                {status.text}
                {status.isSelected && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: { xs: -6, md: -8 },
                      right: { xs: -6, md: -8 },
                      backgroundColor: "secondary.main",
                      color: "secondary.contrastText",
                      borderRadius: "50%",
                      width: { xs: 18, md: 22 },
                      height: { xs: 18, md: 22 },
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: { xs: "0.7rem", md: "0.8rem" },
                      fontWeight: "bold",
                    }}
                  >
                    <Check sx={{ fontSize: "inherit" }} />
                  </Box>
                )}
              </Button>
            );
          })}
        </Box>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 2,
            textAlign: "center",
            fontSize: { xs: "0.75rem", md: "0.875rem" },
          }}
        >
          {totalCorrectWords}語を選んでください
          {validDistractors.length > 0 && "（使わない語もあります）"}
        </Typography>
      </Paper>

      {/* Progress */}
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Typography
          variant={isMobile ? "subtitle1" : "h6"}
          color="secondary.main"
          fontWeight={600}
          sx={{ mb: 1 }}
        >
          選んだ語：{progressCount}/{totalCorrectWords}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          全部で{totalAvailableWords}語
          {validDistractors.length > 0 && `（うち${validDistractors.length}語は使いません）`}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={totalCorrectWords > 0 ? (progressCount / totalCorrectWords) * 100 : 0}
          color="secondary"
          sx={{
            height: { xs: 8, md: 10 },
            borderRadius: 5,
            maxWidth: { xs: 280, md: 400 },
            mx: "auto",
          }}
        />
      </Box>

      {/* Actions */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        justifyContent="center"
        sx={{ mb: 3 }}
      >
        <Button
          variant="outlined"
          size="large"
          onClick={handleReset}
          sx={{
            px: { xs: 3, md: 4 },
            py: { xs: 1.5, md: 2 },
            fontSize: { xs: "1rem", md: "1.1rem" },
            borderRadius: 3,
            minWidth: { xs: "100%", sm: "auto" },
          }}
        >
          シャッフルしてやり直す
        </Button>
        <Button
          variant="contained"
          size="large"
          onClick={handleCheckAnswer}
          disabled={!isComplete}
          sx={{
            px: { xs: 4, md: 6 },
            py: { xs: 1.5, md: 2 },
            fontSize: { xs: "1.1rem", md: "1.2rem" },
            borderRadius: 3,
            minWidth: { xs: "100%", sm: "auto" },
          }}
        >
          答え合わせ（{progressCount}/{totalCorrectWords}）
        </Button>
      </Stack>
    </Box>
  );
};
