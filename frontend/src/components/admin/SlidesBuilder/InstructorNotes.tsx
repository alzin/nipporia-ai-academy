import { memo } from "react";
import {
  Box,
  FormControl,
  Grid,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Slide } from "../../../types/slide.types";

interface InstructorNotesProps {
  slide: Slide;
  index: number;
  onUpdate: (index: number, updates: Partial<Slide>) => void;
}

export const InstructorNotes: React.FC<InstructorNotesProps> = memo(
  ({ slide, index, onUpdate }) => {
    return (
      <Stack spacing={3}>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="講師メモ"
          defaultValue={slide.notes || ""}
          onBlur={(e) => onUpdate(index, { notes: e.target.value })}
          helperText="講師だけに表示されます"
          placeholder="話すときのポイントや時間配分など"
        />

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              type="number"
              label="目安の時間（分）"
              defaultValue={slide.duration || ""}
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
              onBlur={(e) =>
                onUpdate(index, { duration: parseInt(e.target.value) || 0 })
              }
              inputProps={{ min: 0, max: 60 }}
              helperText="このスライドにかける時間"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size="small">
              <Typography variant="subtitle2" gutterBottom>
                難易度
              </Typography>
              <Select
                value={slide.difficulty || "medium"}
                onChange={(e) =>
                  onUpdate(index, { difficulty: e.target.value })
                }
              >
                <MenuItem value="easy">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        bgcolor: "success.main",
                      }}
                    />
                    <Typography>やさしい</Typography>
                  </Stack>
                </MenuItem>
                <MenuItem value="medium">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        bgcolor: "warning.main",
                      }}
                    />
                    <Typography>ふつう</Typography>
                  </Stack>
                </MenuItem>
                <MenuItem value="hard">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        bgcolor: "error.main",
                      }}
                    />
                    <Typography>むずかしい</Typography>
                  </Stack>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Learning Objectives */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            学習のねらい
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="このスライドで受講者が身につけること"
            defaultValue={slide.learningObjectives || ""}
            onBlur={(e) =>
              onUpdate(index, { learningObjectives: e.target.value })
            }
          />
        </Box>

        {/* Tags */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            タグ（カンマ区切り）
          </Typography>
          <TextField
            fullWidth
            placeholder="例：Claude Code, 入門, 権限モード"
            defaultValue={slide.tags || ""}
            onBlur={(e) => onUpdate(index, { tags: e.target.value })}
            helperText="スライドの整理や検索に使います"
          />
        </Box>
      </Stack>
    );
  }
);

InstructorNotes.displayName = "InstructorNotes";
