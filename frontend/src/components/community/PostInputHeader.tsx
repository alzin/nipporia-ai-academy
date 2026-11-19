import React from "react";
import {
  AttachFile,
  ExpandLess,
  ExpandMore,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Collapse,
  Stack,
  TextField,
} from "@mui/material";
import { SelectedMedia, MediaUpload } from "./MediaUpload";

interface PostInputHeaderProps {
  name?: string | null;
  newPost: string;
  setNewPost: (value: string) => void;
  selectedMedia: SelectedMedia[];
  onMediaChange: (files: SelectedMedia[]) => void;
  mediaExpanded: boolean;
  setMediaExpanded: (v: boolean) => void;
  isSubmitting: boolean;
  dragOver: boolean;
  tabValue: number;
  handleClearPost: () => void;
}

export const PostInputHeader = ({
  name,
  newPost,
  setNewPost,
  selectedMedia,
  onMediaChange,
  mediaExpanded,
  setMediaExpanded,
  isSubmitting,
  dragOver,
  tabValue,
  handleClearPost,
}: PostInputHeaderProps) => {
  const hasContent = newPost.trim().length > 0 || selectedMedia.length > 0;

  return (
    <>
      <Stack direction="row" spacing={2} mb={2}>
        <Avatar sx={{ width: 44, height: 44, display: { xs: "none", sm: "flex" } }}>
          {name?.[0] || "?"}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <TextField
            fullWidth
            multiline
            rows={hasContent ? 3 : 2}
            placeholder={
              dragOver
                ? "ファイルをここに置くか、文章を入力してください"
                : tabValue === 2
                ? "わからないことや、講座やサイトで気づいたことを書いてください"
                : "質問や気づきを書いてみましょう"
            }
            inputProps={{
              "aria-label": tabValue === 2 ? "質問・フィードバックの内容" : "投稿の内容",
            }}
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            variant="outlined"
            disabled={isSubmitting}
            sx={{
              "& .MuiOutlinedInput-root": {
                fontSize: "1rem",
              },
            }}
          />

          {selectedMedia.length > 0 && !mediaExpanded && (
            <Box sx={{ mt: 1 }}>
              <Button
                variant="text"
                color="inherit"
                startIcon={<AttachFile />}
                endIcon={mediaExpanded ? <ExpandLess /> : <ExpandMore />}
                onClick={() => setMediaExpanded(!mediaExpanded)}
                aria-expanded={mediaExpanded}
              >
                {selectedMedia.length}件のファイルを添付中
              </Button>
            </Box>
          )}
        </Box>
      </Stack>

      <Collapse in={mediaExpanded}>
        <Box sx={{ mb: 2 }}>
          <MediaUpload
            onMediaChange={onMediaChange}
            selectedMedia={selectedMedia}
            maxFiles={5}
            disabled={isSubmitting}
            showPreview={true}
            removeButtonDisabled={isSubmitting}
          />
        </Box>
      </Collapse>
    </>
  );
};

export default PostInputHeader;
