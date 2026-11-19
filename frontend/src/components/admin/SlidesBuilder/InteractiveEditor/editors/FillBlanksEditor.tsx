import React, { memo, useCallback, useRef } from "react";
import { Stack, TextField } from "@mui/material";
import { FillBlanksItem } from "../../../../../types/interactive-items.types";

interface FillBlanksEditorProps {
  item: FillBlanksItem;
  onUpdate: (updates: Partial<FillBlanksItem>) => void;
}

export const FillBlanksEditor: React.FC<FillBlanksEditorProps> = memo(
  ({ item, onUpdate }) => {
    const sentenceRef = useRef(item.sentence || "");
    const blanksRef = useRef(
      Array.isArray(item.blanks) ? item.blanks.join(", ") : ""
    );
    const translationRef = useRef(item.translation || "");

    const handleSentenceBlur = useCallback(() => {
      if (sentenceRef.current !== (item.sentence || "")) {
        onUpdate({ sentence: sentenceRef.current });
      }
    }, [item.sentence, onUpdate]);

    const handleBlanksBlur = useCallback(() => {
      const newBlanks = blanksRef.current
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const currentBlanks = Array.isArray(item.blanks)
        ? item.blanks.join(", ")
        : "";
      if (blanksRef.current !== currentBlanks) {
        onUpdate({ blanks: newBlanks });
      }
    }, [item.blanks, onUpdate]);

    const handleTranslationBlur = useCallback(() => {
      if (translationRef.current !== (item.translation || "")) {
        onUpdate({ translation: translationRef.current });
      }
    }, [item.translation, onUpdate]);

    return (
      <Stack spacing={2}>
        <TextField
          fullWidth
          label="空欄のある文"
          defaultValue={item.sentence || ""}
          onChange={(e) => {
            sentenceRef.current = e.target.value;
          }}
          onBlur={handleSentenceBlur}
          placeholder="空欄は ___ で書きます。例：___ でファイルを指定します"
          helperText="受講者が言葉を入れるところに ___（アンダースコア3つ）を書きます"
        />
        <TextField
          fullWidth
          label="正解（カンマ区切り）"
          defaultValue={
            Array.isArray(item.blanks) ? item.blanks.join(", ") : ""
          }
          onChange={(e) => {
            blanksRef.current = e.target.value;
          }}
          onBlur={handleBlanksBlur}
          placeholder="例：@, /btw"
          helperText="空欄が複数あるときは、カンマで区切って順に書きます"
        />
        <TextField
          fullWidth
          label="文の意味（任意）"
          defaultValue={item.translation || ""}
          onChange={(e) => {
            translationRef.current = e.target.value;
          }}
          onBlur={handleTranslationBlur}
          placeholder="例：入力欄に @ を打つと、ファイルを選べます"
        />
      </Stack>
    );
  }
);

FillBlanksEditor.displayName = "FillBlanksEditor";
