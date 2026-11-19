import React, { memo, useCallback, useRef } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Typography,
  TextField,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { InteractiveContent } from "../../../../types/interactive.types";

interface FeedbackSettingsProps {
  interactiveContent: InteractiveContent;
  onUpdateContent: (updates: Partial<InteractiveContent>) => void;
}

export const FeedbackSettings: React.FC<FeedbackSettingsProps> = memo(
  ({ interactiveContent, onUpdateContent }) => {
    const correctRef = useRef(interactiveContent.feedback?.correct || "");
    const incorrectRef = useRef(interactiveContent.feedback?.incorrect || "");

    const handleCorrectBlur = useCallback(() => {
      if (correctRef.current !== (interactiveContent.feedback?.correct || "")) {
        onUpdateContent({
          feedback: {
            ...interactiveContent.feedback,
            correct: correctRef.current,
          },
        });
      }
    }, [interactiveContent.feedback, onUpdateContent]);

    const handleIncorrectBlur = useCallback(() => {
      if (
        incorrectRef.current !== (interactiveContent.feedback?.incorrect || "")
      ) {
        onUpdateContent({
          feedback: {
            ...interactiveContent.feedback,
            incorrect: incorrectRef.current,
          },
        });
      }
    }, [interactiveContent.feedback, onUpdateContent]);

    return (
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="subtitle1" fontWeight={600}>
              正解・不正解のメッセージ
            </Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="正解のとき"
              defaultValue={interactiveContent.feedback?.correct || ""}
              onChange={(e) => {
                correctRef.current = e.target.value;
              }}
              onBlur={handleCorrectBlur}
              placeholder="正解です。"
            />
            <TextField
              fullWidth
              label="まちがえたとき"
              defaultValue={interactiveContent.feedback?.incorrect || ""}
              onChange={(e) => {
                incorrectRef.current = e.target.value;
              }}
              onBlur={handleIncorrectBlur}
              placeholder="ちがいます。もう一度考えてみましょう。"
            />
          </Stack>
        </AccordionDetails>
      </Accordion>
    );
  }
);

FeedbackSettings.displayName = "FeedbackSettings";
