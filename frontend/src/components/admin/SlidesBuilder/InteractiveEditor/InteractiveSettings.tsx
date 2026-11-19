import React, { memo, useCallback, useRef } from "react";
import {
  Stack,
  Typography,
  FormControlLabel,
  Switch,
  TextField,
  Box,
  Slider,
  IconButton,
  Tooltip,
  Alert,
} from "@mui/material";
import { PhotoLibrary } from "@mui/icons-material";

interface InteractiveSettingsProps {
  type: string;
  settings: any;
  onUpdate: (newSettings: any) => void;
}

export const InteractiveSettings: React.FC<InteractiveSettingsProps> = memo(
  ({ type, settings, onUpdate }) => {
    const imageUrlRef = useRef(settings.imageUrl || "");

    const handleImageUrlBlur = useCallback(() => {
      if (imageUrlRef.current !== (settings.imageUrl || "")) {
        onUpdate({ imageUrl: imageUrlRef.current });
      }
    }, [settings.imageUrl, onUpdate]);
    switch (type) {
      case "drag-drop":
        return (
          <Stack spacing={3}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              ドラッグ＆ドロップの設定
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.showHints || false}
                  onChange={(e) => onUpdate({ showHints: e.target.checked })}
                />
              }
              label="置き場所のヒントを表示"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.snapToTarget !== false}
                  onChange={(e) => onUpdate({ snapToTarget: e.target.checked })}
                />
              }
              label="近くに置いたら置き場所に吸い付ける"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.allowMultipleAttempts !== false}
                  onChange={(e) =>
                    onUpdate({ allowMultipleAttempts: e.target.checked })
                  }
                />
              }
              label="何度でも挑戦できる"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.shuffleItems || false}
                  onChange={(e) => onUpdate({ shuffleItems: e.target.checked })}
                />
              }
              label="項目の順をシャッフル"
            />
          </Stack>
        );

      case "hotspot":
        return (
          <Stack spacing={3}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              ホットスポットの設定
            </Typography>
            <TextField
              fullWidth
              label="背景画像の URL"
              defaultValue={settings.imageUrl || ""}
              onChange={(e) => {
                imageUrlRef.current = e.target.value;
              }}
              onBlur={handleImageUrlBlur}
              placeholder="背景画像の S3 の URL"
              InputProps={{
                endAdornment: (
                  <Tooltip title="画像をアップロード">
                    <IconButton>
                      <PhotoLibrary />
                    </IconButton>
                  </Tooltip>
                ),
              }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.showAllHotspots || false}
                  onChange={(e) =>
                    onUpdate({ showAllHotspots: e.target.checked })
                  }
                />
              }
              label="最初からすべての印を表示"
            />
            <Box>
              <Typography gutterBottom>印の大きさ</Typography>
              <Slider
                value={settings.hotspotSize || 40}
                onChange={(e, value) => onUpdate({ hotspotSize: value })}
                min={20}
                max={80}
                valueLabelDisplay="auto"
                marks={[
                  { value: 20, label: "小" },
                  { value: 40, label: "中" },
                  { value: 80, label: "大" },
                ]}
              />
            </Box>
          </Stack>
        );

      case "flashcard":
        return (
          <Stack spacing={3}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              フラッシュカードの設定
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.shuffleCards || false}
                  onChange={(e) => onUpdate({ shuffleCards: e.target.checked })}
                />
              }
              label="毎回カードの順をシャッフル"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.autoAdvance || false}
                  onChange={(e) => onUpdate({ autoAdvance: e.target.checked })}
                />
              }
              label="3秒たったら次のカードへ進む"
            />
            <Box>
              <Typography gutterBottom>1回に出すカードの枚数</Typography>
              <Slider
                value={settings.cardsPerSession || 10}
                onChange={(e, value) => onUpdate({ cardsPerSession: value })}
                min={5}
                max={50}
                valueLabelDisplay="auto"
                marks={[
                  { value: 5, label: "5" },
                  { value: 10, label: "10" },
                  { value: 25, label: "25" },
                  { value: 50, label: "50" },
                ]}
              />
            </Box>
          </Stack>
        );

      case "matching":
        return (
          <Stack spacing={3}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              組み合わせの設定
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.shuffleItems !== false}
                  onChange={(e) => onUpdate({ shuffleItems: e.target.checked })}
                />
              }
              label="項目の順をシャッフル"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.showLines || false}
                  onChange={(e) => onUpdate({ showLines: e.target.checked })}
                />
              }
              label="つないだ線を表示"
            />
          </Stack>
        );

      case "sorting":
        return (
          <Stack spacing={3}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              並べ替えの設定
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.shuffleItems !== false}
                  onChange={(e) => onUpdate({ shuffleItems: e.target.checked })}
                />
              }
              label="最初に項目をシャッフル"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.showNumbers || false}
                  onChange={(e) => onUpdate({ showNumbers: e.target.checked })}
                />
              }
              label="順番の数字を表示"
            />
          </Stack>
        );

      default:
        return (
          <Alert severity="info">
            この種類には設定がありません。
          </Alert>
        );
    }
  }
);

InteractiveSettings.displayName = "InteractiveSettings";
