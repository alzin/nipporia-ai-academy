import React, { memo } from "react";
import { TextField, Stack } from "@mui/material";
import { Slide, SlideContent } from "../../../types/slide.types";

interface TextSlideEditorProps {
  slide: Slide;
  index: number;
  onUpdate: (index: number, updates: Partial<Slide>) => void;
  onUpdateContent: (
    index: number,
    contentUpdates: Partial<SlideContent>
  ) => void;
}

export const TextSlideEditor: React.FC<TextSlideEditorProps> = memo(
  ({ slide, index, onUpdateContent }) => {
    const { content } = slide;

    return (
      <Stack spacing={3}>
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
          label="サブタイトル"
          defaultValue={content.subtitle || ""}
          onBlur={(e) => onUpdateContent(index, { subtitle: e.target.value })}
        />

        <TextField
          fullWidth
          multiline
          rows={6}
          label="本文"
          defaultValue={content.content || ""}
          onBlur={(e) => onUpdateContent(index, { content: e.target.value })}
        />
      </Stack>
    );
  }
);
