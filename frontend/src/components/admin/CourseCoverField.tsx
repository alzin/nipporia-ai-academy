import React, { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { DeleteOutline, ImageOutlined } from "@mui/icons-material";
import { colors } from "../../theme/theme";

export const COVER_ACCEPT = ["image/jpeg", "image/png", "image/webp"];
export const COVER_MAX_BYTES = 5 * 1024 * 1024;

/** Returns an error message for a file the server would refuse, or null. */
export function coverFileError(file: File): string | null {
  if (!COVER_ACCEPT.includes(file.type)) return "JPG・PNG・WebP の画像を選んでください。";
  if (file.size > COVER_MAX_BYTES) return "画像は5MBまでにしてください。";
  return null;
}

interface Props {
  /** The cover saved on the server (null when there is none). */
  currentUrl?: string | null;
  /** A file picked but not uploaded yet. */
  file: File | null;
  /** True when the admin chose to remove the saved cover. */
  removed: boolean;
  onFileChange: (file: File | null) => void;
  onRemove: () => void;
  disabled?: boolean;
}

/** 16:9 cover picker with a preview. The upload itself happens when the course is saved. */
export const CourseCoverField: React.FC<Props> = ({ currentUrl, file, removed, onFileChange, onRemove, disabled }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setFilePreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setFilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const preview = filePreview || (!removed ? currentUrl || null : null);

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again
    if (!picked) return;
    const problem = coverFileError(picked);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    onFileChange(picked);
  };

  return (
    <Box>
      <Typography variant="subtitle2" component="p" sx={{ mb: 1 }}>
        表紙の画像
      </Typography>

      <Box
        sx={{
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 9",
          borderRadius: 1,
          overflow: "hidden",
          border: "1px dashed",
          borderColor: preview ? "transparent" : colors.lineStrong,
          bgcolor: colors.accentSoft,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {preview ? (
          <Box
            component="img"
            src={preview}
            alt="表紙のプレビュー"
            sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <Stack alignItems="center" spacing={0.5} sx={{ color: "text.secondary", px: 2, textAlign: "center" }}>
            <ImageOutlined aria-hidden />
            <Typography variant="body2">画像がなければ、今までの見た目のままです</Typography>
          </Stack>
        )}
      </Box>

      <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
        <Button
          variant="outlined"
          size="small"
          startIcon={<ImageOutlined />}
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          {preview ? "画像を変える" : "画像を選ぶ"}
        </Button>
        {preview && (
          <Button
            size="small"
            color="error"
            startIcon={<DeleteOutline />}
            onClick={() => {
              setError(null);
              onFileChange(null);
              onRemove();
            }}
            disabled={disabled}
          >
            画像を外す
          </Button>
        )}
      </Stack>
      <input
        ref={inputRef}
        type="file"
        accept={COVER_ACCEPT.join(",")}
        hidden
        onChange={handlePick}
        aria-label="表紙の画像を選ぶ"
      />

      <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1 }}>
        JPG・PNG・WebP で5MBまで。横長の16:9（1600×900くらい）がおすすめです。
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default CourseCoverField;
