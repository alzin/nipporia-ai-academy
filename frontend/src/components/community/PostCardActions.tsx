import React from "react";
import { Stack, Button, Tooltip } from "@mui/material";
import { useCommunityAccess } from "../../hooks/useCommunityAccess";
import { ThumbUp, Comment, Share } from "@mui/icons-material";

interface PostCardActionsProps {
  isLiked: boolean;
  likesCount: number;
  commentsCount: number | string;
  isDeleting: boolean;
  commentsOpen: boolean;
  onToggleLike: () => void;
  onToggleComments: () => void;
  onShare: () => void;
}

export const PostCardActions: React.FC<PostCardActionsProps> = ({
  isLiked,
  likesCount,
  commentsCount,
  isDeleting,
  commentsOpen,
  onToggleLike,
  onToggleComments,
  onShare,
}) => {
  // Guests and non-members can read but not like
  const { canWrite, disabledReason } = useCommunityAccess();

  return (
    <Stack direction="row" spacing={{ xs: 0.5, sm: 1.5 }} flexGrow={1} flexWrap="wrap" useFlexGap>
      <Tooltip title={disabledReason}>
        <span>
          <Button
            startIcon={<ThumbUp />}
            color={isLiked ? "primary" : "inherit"}
            sx={{ px: 1.5 }}
            onClick={onToggleLike}
            disabled={isDeleting || !canWrite}
            aria-pressed={isLiked}
          >
            いいね {likesCount}
          </Button>
        </span>
      </Tooltip>
      <Button
        startIcon={<Comment />}
        sx={{ px: 1.5 }}
        onClick={onToggleComments}
        disabled={isDeleting}
        color={commentsOpen ? "primary" : "inherit"}
        aria-expanded={commentsOpen}
      >
        コメント {commentsCount}
      </Button>
      <Button
        startIcon={<Share />}
        color="inherit"
        sx={{ px: 1.5 }}
        onClick={onShare}
        disabled={isDeleting}
      >
        共有
      </Button>
    </Stack>
  );
};

export default PostCardActions;
