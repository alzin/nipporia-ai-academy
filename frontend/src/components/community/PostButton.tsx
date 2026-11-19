import { Button, Stack, Typography, CircularProgress } from "@mui/material";
import { Send } from "@mui/icons-material";
import { SelectedMedia } from "./MediaUpload";

interface IPostButtonProps {
  newPost: string;
  selectedMedia: SelectedMedia[];
  isSubmitting: boolean;
  uploadProgress: number;
  tabValue: number;
  hasContent: boolean;
  onShowSnackbar: (
    message: string,
    severity: "success" | "error" | "info" | "warning"
  ) => void;
  onCreatePost: () => void;
}

export const PostButton = ({
  newPost,
  selectedMedia,
  isSubmitting,
  uploadProgress,
  tabValue,
  hasContent,
  onCreatePost,
}: IPostButtonProps) => {
  const statusText =
    uploadProgress < 25
      ? "準備中…"
      : uploadProgress < 75
      ? "アップロード中…"
      : uploadProgress < 95
      ? tabValue === 2
        ? "送信中…"
        : "投稿中…"
      : "もうすぐ終わります…";

  const postButtonText = tabValue === 2 ? "送信する" : "投稿する";

  return (
    <Button
      variant="contained"
      disabled={!hasContent || isSubmitting}
      onClick={onCreatePost}
      startIcon={isSubmitting ? undefined : <Send />}
      aria-label={
        selectedMedia.length > 0
          ? `${postButtonText}（ファイル${selectedMedia.length}件）`
          : undefined
      }
      sx={{ minWidth: 120 }}
    >
      {isSubmitting ? (
        <Stack direction="row" spacing={1} alignItems="center">
          <CircularProgress size={20} color="inherit" />
          <Typography variant="caption" color="inherit">
            {statusText}
          </Typography>
        </Stack>
      ) : (
        postButtonText
      )}
    </Button>
  );
};
