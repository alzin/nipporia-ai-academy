// frontend/src/components/community/PostInput.tsx

import React from "react";
import {
  Card,
  CardActions,
  CardContent,
  Divider,
  LinearProgress,
  Box,
  Paper,
  Typography,
  Button,
} from "@mui/material";
import { AttachFile, Lock } from "@mui/icons-material";
import { usePostInput } from "../../hooks/usePostInput";
import PostInputHeader from "./PostInputHeader";
import PostInputActions from "./PostInputActions";
import { useSelector } from "react-redux"; // Import useSelector
import { RootState } from "../../store/store"; // Import RootState
import { useNavigate } from "react-router-dom"; // Import useNavigate

interface IPostInputProps {
  onShowSnackbar?: (
    message: string,
    severity: "success" | "error" | "info" | "warning",
  ) => void;
}

export const PostInput = ({ onShowSnackbar }: IPostInputProps) => {
  const navigate = useNavigate();
  // Check subscription status from Redux
  const subStatus = useSelector((state: RootState) => state.auth.status);
  const userRole = useSelector((state: RootState) => state.auth.user?.role);
  const isAdmin = userRole === "ADMIN";
  const isCanceled =
    subStatus === "canceled" ||
    subStatus === "past_due" ||
    subStatus === "unpaid";

  const {
    newPost,
    setNewPost,
    selectedMedia,
    isSubmitting,
    uploadProgress,
    mediaExpanded,
    setMediaExpanded,
    dragOver,
    tabValue,
    hasContent,
    name,
    handleMediaChange,
    handleClearPost,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleCreatePost,
    handleShowSnackbar,
  } = usePostInput({ onShowSnackbar });

  // --- RESTRICTION VIEW ---
  // Admin users can always post regardless of subscription status
  if (isCanceled && !isAdmin) {
    return (
      <Card sx={{ mb: 4, p: 3, textAlign: "center" }}>
        <Lock sx={{ fontSize: 32, color: "text.secondary", mb: 1 }} aria-hidden />
        <Typography variant="h6" component="h2" gutterBottom>
          いまは投稿できません
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          サブスクリプションが止まっています。もう一度メンバーになると、投稿やコメントができます。
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/subscription")}
        >
          メンバーになる
        </Button>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        mb: 4,
        position: "relative",
        overflow: "visible",
        border: dragOver ? "2px dashed" : "1px solid",
        borderColor: dragOver ? "primary.main" : "divider",
        bgcolor: "background.paper",
        transition: "border-color 0.15s ease",
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Upload progress bar */}
      {isSubmitting && uploadProgress > 0 && (
        <LinearProgress
          variant="determinate"
          value={uploadProgress}
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            zIndex: 1,
          }}
        />
      )}

      <CardContent sx={{ pb: 1 }}>
        <PostInputHeader
          name={name}
          newPost={newPost}
          setNewPost={setNewPost}
          selectedMedia={selectedMedia}
          onMediaChange={handleMediaChange}
          mediaExpanded={mediaExpanded}
          setMediaExpanded={setMediaExpanded}
          isSubmitting={isSubmitting}
          dragOver={dragOver}
          tabValue={tabValue}
          handleClearPost={handleClearPost}
        />

        {dragOver && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: "rgba(248, 230, 221, 0.85)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2,
              borderRadius: 1,
            }}
          >
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                textAlign: "center",
                borderRadius: 2.5,
              }}
            >
              <AttachFile sx={{ fontSize: 36, mb: 1, color: "primary.main" }} aria-hidden />
              <Typography variant="h6" component="p">
                ここにファイルを置くと添付されます
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {tabValue === 2 ? "送信" : "投稿"}するときにアップロードします。
              </Typography>
            </Paper>
          </Box>
        )}
      </CardContent>

      <Divider />

      <CardActions sx={{ px: { xs: 2, sm: 3 }, py: 1.5, justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
        <PostInputActions
          selectedMedia={selectedMedia}
          setMediaExpanded={setMediaExpanded}
          mediaExpanded={mediaExpanded}
          isSubmitting={isSubmitting}
          hasContent={hasContent}
          handleClearPost={handleClearPost}
          uploadProgress={uploadProgress}
          tabValue={tabValue}
          newPost={newPost}
          onCreatePost={handleCreatePost}
          onShowSnackbar={handleShowSnackbar}
        />
      </CardActions>
    </Card>
  );
};
