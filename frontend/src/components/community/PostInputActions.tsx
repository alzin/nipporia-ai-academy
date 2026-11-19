import React from "react";
import { Badge, IconButton, Stack, Tooltip } from "@mui/material";
import { PhotoCamera, Close } from "@mui/icons-material";
import { PostButton } from "./PostButton";
import { SelectedMedia } from "./MediaUpload";

interface PostInputActionsProps {
  selectedMedia: SelectedMedia[];
  setMediaExpanded: (v: boolean) => void;
  mediaExpanded: boolean;
  isSubmitting: boolean;
  hasContent: boolean;
  handleClearPost: () => void;
  uploadProgress: number;
  tabValue: number;
  newPost: string;
  onCreatePost: () => Promise<void> | void;
  onShowSnackbar: (
    message: string,
    severity: "success" | "error" | "info" | "warning"
  ) => void;
}

export const PostInputActions = ({
  selectedMedia,
  setMediaExpanded,
  mediaExpanded,
  isSubmitting,
  hasContent,
  handleClearPost,
  uploadProgress,
  tabValue,
  newPost,
  onCreatePost,
  onShowSnackbar,
}: PostInputActionsProps) => {
  return (
    <>
      <Stack direction="row" spacing={1}>
        <Tooltip title="画像や動画を添付">
          <IconButton
            color="primary"
            disabled={isSubmitting}
            onClick={() => setMediaExpanded(!mediaExpanded)}
            aria-label="画像や動画を添付"
            aria-expanded={mediaExpanded}
            sx={{ width: 44, height: 44 }}
          >
            <Badge
              badgeContent={selectedMedia.length || null}
              color="secondary"
            >
              <PhotoCamera />
            </Badge>
          </IconButton>
        </Tooltip>

        {hasContent && (
          <Tooltip title="入力を消す">
            <IconButton
              disabled={isSubmitting}
              onClick={handleClearPost}
              aria-label="入力を消す"
              sx={{ width: 44, height: 44, color: "text.secondary" }}
            >
              <Close />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      <Stack direction="row" spacing={2} alignItems="center">
        <PostButton
          newPost={newPost}
          selectedMedia={selectedMedia}
          isSubmitting={isSubmitting}
          uploadProgress={uploadProgress}
          tabValue={tabValue}
          hasContent={hasContent}
          onShowSnackbar={onShowSnackbar}
          onCreatePost={onCreatePost}
        />
      </Stack>
    </>
  );
};

export default PostInputActions;
