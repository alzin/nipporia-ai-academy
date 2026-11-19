import React, { memo } from "react";
import {
  TextField,
  Stack,
  Grid,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Typography,
  Box,
} from "@mui/material";
import { CloudUpload } from "@mui/icons-material";
import { Slide, SlideContent } from "../../../types/slide.types";

interface ImageSlideEditorProps {
  slide: Slide;
  index: number;
  onUpdate: (index: number, updates: Partial<Slide>) => void;
  onUpdateContent: (
    index: number,
    contentUpdates: Partial<SlideContent>
  ) => void;
}

export const ImageSlideEditor: React.FC<ImageSlideEditorProps> = memo(
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

        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            fullWidth
            label="画像の URL"
            defaultValue={content.content?.url || ""}
            onBlur={(e) =>
              onUpdateContent(index, {
                content: { ...content.content, url: e.target.value },
              })
            }
            error={!content.content?.url?.trim()}
            helperText={
              !content.content?.url?.trim() ? "画像の URL を入力してください" : ""
            }
            placeholder="https://example.com/image.jpg または S3 の URL"
          />
          <Tooltip title="画像をアップロード">
            <IconButton color="primary" size="large">
              <CloudUpload />
            </IconButton>
          </Tooltip>
        </Stack>

        <Grid container spacing={2}>
          <Grid size={{ xs: 6 }}>
            <TextField
              fullWidth
              label="代替テキスト"
              defaultValue={content.content?.alt || ""}
              onBlur={(e) =>
                onUpdateContent(index, {
                  content: { ...content.content, alt: e.target.value },
                })
              }
              placeholder="画像の内容を短く説明します"
              helperText="スクリーンリーダーと検索エンジンが読みます"
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField
              fullWidth
              label="キャプション"
              defaultValue={content.content?.caption || ""}
              onBlur={(e) =>
                onUpdateContent(index, {
                  content: { ...content.content, caption: e.target.value },
                })
              }
              placeholder="任意"
            />
          </Grid>
        </Grid>

        {/* 画像のプレビュー */}
        {content.content?.url && (
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                画像のプレビュー
              </Typography>
              <Box
                component="img"
                src={content.content.url}
                alt={content.content.alt || "プレビュー"}
                sx={{
                  width: "100%",
                  maxHeight: 300,
                  objectFit: "contain",
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              {content.content.caption && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: "block" }}
                >
                  {content.content.caption}
                </Typography>
              )}
            </CardContent>
          </Card>
        )}
      </Stack>
    );
  }
);

ImageSlideEditor.displayName = "ImageSlideEditor";
