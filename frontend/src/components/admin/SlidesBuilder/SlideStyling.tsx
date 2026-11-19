import React, { memo } from "react";
import {
  Stack,
  Grid,
  TextField,
  IconButton,
  Tooltip,
  Paper,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  Select,
  MenuItem,
  Box,
} from "@mui/material";
import { ColorLens, Wallpaper, CloudUpload } from "@mui/icons-material";
import { Slide, SlideContent } from "../../../types/slide.types";

export interface SlideStylingProps {
  slide: Slide;
  index: number;
  onUpdate: (index: number, updates: Partial<Slide>) => void;
  onUpdateContent: (
    index: number,
    contentUpdates: Partial<SlideContent>
  ) => void;
}

export const SlideStyling: React.FC<SlideStylingProps> = memo(
  ({ slide, index, onUpdate, onUpdateContent }) => {
    return (
      <Stack spacing={3}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="背景色"
              defaultValue={slide.backgroundColor || ""}
              onBlur={(e) =>
                onUpdate(index, { backgroundColor: e.target.value })
              }
              placeholder="#ffffff"
              InputProps={{
                startAdornment: (
                  <IconButton size="small">
                    <ColorLens
                      sx={{ color: slide.backgroundColor || "action.active" }}
                    />
                  </IconButton>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="背景画像の URL"
              defaultValue={slide.backgroundImage || ""}
              onBlur={(e) =>
                onUpdate(index, { backgroundImage: e.target.value })
              }
              InputProps={{
                startAdornment: (
                  <Wallpaper sx={{ mr: 1, color: "action.active" }} />
                ),
                endAdornment: (
                  <Tooltip title="背景画像をアップロード">
                    <IconButton size="small">
                      <CloudUpload />
                    </IconButton>
                  </Tooltip>
                ),
              }}
            />
          </Grid>
        </Grid>

        {/* 背景のプレビュー */}
        {(slide.backgroundColor || slide.backgroundImage) && (
          <Paper
            sx={{
              height: 120,
              bgcolor: slide.backgroundColor || "background.paper",
              backgroundImage: slide.backgroundImage
                ? `url(${slide.backgroundImage})`
                : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px dashed",
              borderColor: "divider",
            }}
          >
            <Typography
              variant="body2"
              sx={{
                bgcolor: "rgba(255,255,255,0.8)",
                p: 1,
                borderRadius: 1,
                color: "text.primary",
              }}
            >
              背景のプレビュー
            </Typography>
          </Paper>
        )}

        {/* Layout Options */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            文字の配置
          </Typography>
          <RadioGroup
            row
            value={slide.content.alignment || "center"}
            onChange={(e) =>
              onUpdateContent(index, {
                alignment: e.target.value as "left" | "center" | "right",
              })
            }
          >
            <FormControlLabel value="left" control={<Radio />} label="左" />
            <FormControlLabel
              value="center"
              control={<Radio />}
              label="中央"
            />
            <FormControlLabel value="right" control={<Radio />} label="右" />
          </RadioGroup>
        </Box>

        {/* Animation Options */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            切り替え効果
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={slide.transition || "slide"}
              onChange={(e) => onUpdate(index, { transition: e.target.value })}
            >
              <MenuItem value="slide">スライド</MenuItem>
              <MenuItem value="fade">フェード</MenuItem>
              <MenuItem value="zoom">ズーム</MenuItem>
              <MenuItem value="flip">フリップ</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Stack>
    );
  }
);

SlideStyling.displayName = "SlideStyling";
