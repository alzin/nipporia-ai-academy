import React, { memo, useCallback, useRef } from "react";
import { Stack, TextField, Grid } from "@mui/material";
import { DragDropItem } from "../../../../../types/interactive-items.types";

interface DragDropEditorProps {
  item: DragDropItem;
  onUpdate: (updates: Partial<DragDropItem>) => void;
}

export const DragDropEditor: React.FC<DragDropEditorProps> = memo(
  ({ item, onUpdate }) => {
    // Use refs to track current values for onBlur handlers
    const textRef = useRef(item.text || "");
    const targetRef = useRef(item.target || "");
    const categoryRef = useRef(item.category || "");

    const handleTextBlur = useCallback(() => {
      if (textRef.current !== (item.text || "")) {
        onUpdate({ text: textRef.current });
      }
    }, [item.text, onUpdate]);

    const handleTargetBlur = useCallback(() => {
      if (targetRef.current !== (item.target || "")) {
        onUpdate({ target: targetRef.current });
      }
    }, [item.target, onUpdate]);

    const handleCategoryBlur = useCallback(() => {
      if (categoryRef.current !== (item.category || "")) {
        onUpdate({ category: categoryRef.current });
      }
    }, [item.category, onUpdate]);

    return (
      <Stack spacing={2}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6 }}>
            <TextField
              fullWidth
              label="動かす項目"
              defaultValue={item.text || ""}
              onChange={(e) => {
                textRef.current = e.target.value;
              }}
              onBlur={handleTextBlur}
              placeholder="例：/init"
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField
              fullWidth
              label="置き場所（正解）"
              defaultValue={item.target || ""}
              onChange={(e) => {
                targetRef.current = e.target.value;
              }}
              onBlur={handleTargetBlur}
              placeholder="例：CLAUDE.md を作る"
            />
          </Grid>
        </Grid>
        <TextField
          fullWidth
          label="グループ（任意）"
          defaultValue={item.category || ""}
          onChange={(e) => {
            categoryRef.current = e.target.value;
          }}
          onBlur={handleCategoryBlur}
          placeholder="例：コマンド"
          helperText="関係のある項目をまとめます"
        />
      </Stack>
    );
  }
);

DragDropEditor.displayName = "DragDropEditor";
