// frontend/src/components/admin/SlidesBuilder/InteractiveEditor/editors/SimpleEditors.tsx
import React, { memo, useCallback, useRef } from "react";
import {
  Stack,
  TextField,
  Grid,
  Paper,
  Typography,
  Chip,
} from "@mui/material";
import { SyncAlt } from "@mui/icons-material";
import {
  MatchingItem,
  SortingItem,
  TimelineItem,
} from "../../../../../types/interactive-items.types";

// Matching Editor
interface MatchingEditorProps {
  item: MatchingItem;
  onUpdate: (updates: Partial<MatchingItem>) => void;
}

export const MatchingEditor: React.FC<MatchingEditorProps> = memo(
  ({ item, onUpdate }) => {
    const leftRef = useRef(item.left || "");
    const rightRef = useRef(item.right || "");

    const handleLeftBlur = useCallback(() => {
      if (leftRef.current !== (item.left || "")) {
        onUpdate({ left: leftRef.current });
      }
    }, [item.left, onUpdate]);

    const handleRightBlur = useCallback(() => {
      if (rightRef.current !== (item.right || "")) {
        onUpdate({ right: rightRef.current });
      }
    }, [item.right, onUpdate]);

    return (
      <Stack spacing={2}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="左側"
              defaultValue={item.left || ""}
              onChange={(e) => {
                leftRef.current = e.target.value;
              }}
              onBlur={handleLeftBlur}
              placeholder="例：Plan"
              helperText="受講者が見て、対になる項目を探します"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="右側（対になる項目）"
              defaultValue={item.right || ""}
              onChange={(e) => {
                rightRef.current = e.target.value;
              }}
              onBlur={handleRightBlur}
              placeholder="例：作る前に計画を立てる"
              helperText="左側と対になる言葉や説明"
            />
          </Grid>
        </Grid>

        {/* Preview of the matching pair */}
        <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            プレビュー
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Chip
              label={item.left || "左側"}
              color="primary"
              variant="outlined"
              sx={{ minWidth: 100 }}
            />
            <SyncAlt fontSize="small" color="action" />
            <Chip
              label={item.right || "右側"}
              variant="outlined"
              sx={{ minWidth: 100 }}
            />
          </Stack>
        </Paper>
      </Stack>
    );
  }
);

MatchingEditor.displayName = "MatchingEditor";

// ... rest of the editors remain the same
// Sorting Editor
interface SortingEditorProps {
  item: SortingItem;
  onUpdate: (updates: Partial<SortingItem>) => void;
}

export const SortingEditor: React.FC<SortingEditorProps> = memo(
  ({ item, onUpdate }) => {
    const textRef = useRef(item.text || "");

    const handleTextBlur = useCallback(() => {
      if (textRef.current !== (item.text || "")) {
        onUpdate({ text: textRef.current });
      }
    }, [item.text, onUpdate]);

    const handleOrderChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdate({ correctOrder: parseInt(e.target.value) });
      },
      [onUpdate]
    );

    return (
      <Grid container spacing={2}>
        <Grid size={{ xs: 8 }}>
          <TextField
            fullWidth
            label="並べる項目"
            defaultValue={item.text || ""}
            onChange={(e) => {
              textRef.current = e.target.value;
            }}
            onBlur={handleTextBlur}
            placeholder="例：フォルダを選ぶ"
          />
        </Grid>
        <Grid size={{ xs: 4 }}>
          <TextField
            fullWidth
            type="number"
            label="正しい順番"
            value={item.correctOrder || 0}
            onWheel={(e) => (e.target as HTMLInputElement).blur()}
            onChange={handleOrderChange}
            inputProps={{ min: 1 }}
            helperText="1から始まる番号"
          />
        </Grid>
      </Grid>
    );
  }
);

SortingEditor.displayName = "SortingEditor";

// Timeline Editor
interface TimelineEditorProps {
  item: TimelineItem;
  onUpdate: (updates: Partial<TimelineItem>) => void;
}

export const TimelineEditor: React.FC<TimelineEditorProps> = memo(
  ({ item, onUpdate }) => {
    const eventRef = useRef(item.event || "");
    const dateRef = useRef(item.date || "");
    const descriptionRef = useRef(item.description || "");

    const handleEventBlur = useCallback(() => {
      if (eventRef.current !== (item.event || "")) {
        onUpdate({ event: eventRef.current });
      }
    }, [item.event, onUpdate]);

    const handleDateBlur = useCallback(() => {
      if (dateRef.current !== (item.date || "")) {
        onUpdate({ date: dateRef.current });
      }
    }, [item.date, onUpdate]);

    const handleDescriptionBlur = useCallback(() => {
      if (descriptionRef.current !== (item.description || "")) {
        onUpdate({ description: descriptionRef.current });
      }
    }, [item.description, onUpdate]);

    return (
      <Stack spacing={2}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 8 }}>
            <TextField
              fullWidth
              label="出来事"
              defaultValue={item.event || ""}
              onChange={(e) => {
                eventRef.current = e.target.value;
              }}
              onBlur={handleEventBlur}
              placeholder="例：Claude Code の一般公開"
            />
          </Grid>
          <Grid size={{ xs: 4 }}>
            <TextField
              fullWidth
              label="年・日付"
              defaultValue={item.date || ""}
              onChange={(e) => {
                dateRef.current = e.target.value;
              }}
              onBlur={handleDateBlur}
              placeholder="例：2025"
            />
          </Grid>
        </Grid>
        <TextField
          fullWidth
          multiline
          rows={2}
          label="説明"
          defaultValue={item.description || ""}
          onChange={(e) => {
            descriptionRef.current = e.target.value;
          }}
          onBlur={handleDescriptionBlur}
          placeholder="出来事を短く説明します"
        />
      </Stack>
    );
  }
);

TimelineEditor.displayName = "TimelineEditor";
