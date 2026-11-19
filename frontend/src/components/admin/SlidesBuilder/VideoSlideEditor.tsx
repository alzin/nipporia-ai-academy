import React, { useState, memo, useCallback, useMemo } from "react";
import {
  TextField,
  Stack,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Grid,
  FormControlLabel,
  Switch,
  Alert,
} from "@mui/material";
import {
  CloudUpload,
  VideoLibrary,
  PlayArrow,
  Stop,
  VolumeUp,
  VolumeOff,
  Fullscreen,
  Settings,
} from "@mui/icons-material";
import { Slide, SlideContent } from "../../../types/slide.types";

interface VideoSlideEditorProps {
  slide: Slide;
  index: number;
  onUpdate: (index: number, updates: Partial<Slide>) => void;
  onUpdateContent: (
    index: number,
    contentUpdates: Partial<SlideContent>
  ) => void;
}

export const VideoSlideEditor: React.FC<VideoSlideEditorProps> = memo(
  ({ slide, index, onUpdateContent }) => {
    const { content } = slide;
    const [isPlaying, setIsPlaying] = useState(false);

    // Get video settings or set defaults - memoized to avoid recreating on every render
    const videoSettings = useMemo(
      () => content.content?.settings || {},
      [content.content?.settings]
    );

    const updateVideoSettings = useCallback(
      (newSettings: any) => {
        onUpdateContent(index, {
          content: {
            ...content.content,
            settings: { ...videoSettings, ...newSettings },
          },
        });
      },
      [index, content.content, videoSettings, onUpdateContent]
    );

    const getVideoType = (url: string) => {
      if (!url) return "unknown";
      if (url.includes("youtube.com") || url.includes("youtu.be"))
        return "youtube";
      if (url.includes("vimeo.com")) return "vimeo";
      if (url.includes(".mp4") || url.includes(".webm") || url.includes(".ogg"))
        return "direct";
      if (url.includes("s3.") || url.includes("amazonaws.com")) return "s3";
      return "unknown";
    };

    const videoType = getVideoType(content.content?.url || "");

    return (
      <Stack spacing={3}>
        {/* Basic Video Info */}
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
          placeholder="任意"
        />

        {/* Video URL Input */}
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            fullWidth
            label="動画の URL"
            defaultValue={content.content?.url || ""}
            onBlur={(e) =>
              onUpdateContent(index, {
                content: { ...content.content, url: e.target.value },
              })
            }
            error={!content.content?.url?.trim()}
            helperText={
              !content.content?.url?.trim()
                ? "動画の URL を入力してください"
                : `判定：${
                    videoType === "youtube"
                      ? "YouTube"
                      : videoType === "vimeo"
                      ? "Vimeo"
                      : videoType === "direct"
                      ? "動画ファイル"
                      : videoType === "s3"
                      ? "S3"
                      : "不明な形式"
                  }`
            }
            placeholder="https://youtube.com/watch?v=... または動画ファイルの URL"
          />
          <Tooltip title="動画ファイルをアップロード">
            <IconButton color="primary" size="large">
              <CloudUpload />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* Video Type Info */}
        {content.content?.url && (
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              {videoType === "unknown" && (
                <Alert severity="warning" sx={{ flex: 1 }}>
                  動画の形式がわかりません。URL を確かめてください。
                </Alert>
              )}
            </Stack>
          </Box>
        )}

        {/* Video Settings */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              動画の設定
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={videoSettings.autoplay || false}
                      onChange={(e) =>
                        updateVideoSettings({ autoplay: e.target.checked })
                      }
                    />
                  }
                  label="自動で再生"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={videoSettings.controls !== false}
                      onChange={(e) =>
                        updateVideoSettings({ controls: e.target.checked })
                      }
                    />
                  }
                  label="操作ボタンを表示"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={videoSettings.muted || false}
                      onChange={(e) =>
                        updateVideoSettings({ muted: e.target.checked })
                      }
                    />
                  }
                  label="音を消して始める"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={videoSettings.loop || false}
                      onChange={(e) =>
                        updateVideoSettings({ loop: e.target.checked })
                      }
                    />
                  }
                  label="くり返し再生"
                />
              </Grid>
            </Grid>

            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="開始位置（秒）"
                type="number"
                value={videoSettings.startTime || ""}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                onChange={(e) =>
                  updateVideoSettings({
                    startTime: parseInt(e.target.value) || 0,
                  })
                }
                inputProps={{ min: 0 }}
                helperText="この位置から再生します"
              />

              <TextField
                fullWidth
                label="終了位置（秒）"
                type="number"
                value={videoSettings.endTime || ""}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                onChange={(e) =>
                  updateVideoSettings({
                    endTime: parseInt(e.target.value) || 0,
                  })
                }
                inputProps={{ min: 0 }}
                helperText="この位置で止まります。空欄なら最後まで再生します"
              />
            </Stack>
          </CardContent>
        </Card>

        {/* Video Description/Transcript */}
        <TextField
          fullWidth
          multiline
          rows={3}
          label="動画の説明・書き起こし"
          value={content.content?.description || ""}
          onChange={(e) =>
            onUpdateContent(index, {
              content: { ...content.content, description: e.target.value },
            })
          }
          placeholder="任意"
          helperText="検索エンジンと、音声を聞けない人のために使います"
        />

        {/* Video Preview */}
        {content.content?.url && (
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="subtitle2">動画のプレビュー</Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    startIcon={isPlaying ? <Stop /> : <PlayArrow />}
                    size="small"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? "停止" : "再生"}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Settings />}
                    size="small"
                  >
                    設定を試す
                  </Button>
                </Stack>
              </Stack>

              <Box
                sx={{
                  width: "100%",
                  height: 300,
                  bgcolor: "grey.100",
                  borderRadius: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid",
                  borderColor: "divider",
                  position: "relative",
                  cursor: "pointer",
                }}
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {videoType === "youtube" || videoType === "vimeo" ? (
                  // For YouTube/Vimeo, show embedded preview
                  <Stack alignItems="center" spacing={2}>
                    <VideoLibrary
                      sx={{ fontSize: 48, color: "primary.main" }}
                    />
                    <Typography
                      variant="body1"
                      color="primary.main"
                      fontWeight={600}
                    >
                      {videoType === "youtube"
                        ? "YouTube の動画"
                        : "Vimeo の動画"}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      textAlign="center"
                    >
                      クリックして再生を試せます
                    </Typography>
                  </Stack>
                ) : (
                  // For direct videos, show video player simulation
                  <Stack alignItems="center" spacing={2}>
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: "50%",
                        bgcolor: isPlaying ? "error.main" : "primary.main",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.3s ease",
                      }}
                    >
                      {isPlaying ? (
                        <Stop sx={{ color: "white", fontSize: 32 }} />
                      ) : (
                        <PlayArrow sx={{ color: "white", fontSize: 32 }} />
                      )}
                    </Box>
                    <Typography
                      variant="body1"
                      color="text.primary"
                      fontWeight={600}
                    >
                      プレーヤーのプレビュー
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {isPlaying
                        ? "再生中…"
                        : "クリックしてプレビュー"}
                    </Typography>
                  </Stack>
                )}

                {/* Video Controls Overlay */}
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 8,
                    left: 8,
                    right: 8,
                    bgcolor: "rgba(0,0,0,0.7)",
                    borderRadius: 1,
                    p: 1,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    opacity: videoSettings.controls !== false ? 1 : 0.3,
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <IconButton size="small" sx={{ color: "white" }}>
                      {isPlaying ? <Stop /> : <PlayArrow />}
                    </IconButton>
                    <Typography variant="caption" sx={{ color: "white" }}>
                      0:00 / 0:00
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1}>
                    <IconButton size="small" sx={{ color: "white" }}>
                      {videoSettings.muted ? <VolumeOff /> : <VolumeUp />}
                    </IconButton>
                    <IconButton size="small" sx={{ color: "white" }}>
                      <Fullscreen />
                    </IconButton>
                  </Stack>
                </Box>
              </Box>

              {/* Video Settings Summary */}
              <Box sx={{ mt: 2, p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  設定：
                  {videoSettings.autoplay ? "自動で再生" : "手動で再生"}・
                  {videoSettings.controls !== false
                    ? "操作ボタンあり"
                    : "操作ボタンなし"}・
                  {videoSettings.muted ? "音なし" : "音あり"}・
                  {videoSettings.loop ? "くり返し" : "1回だけ"}
                  {videoSettings.startTime &&
                    `・${videoSettings.startTime}秒から`}
                  {videoSettings.endTime &&
                    `・${videoSettings.endTime}秒まで`}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}
      </Stack>
    );
  }
);
