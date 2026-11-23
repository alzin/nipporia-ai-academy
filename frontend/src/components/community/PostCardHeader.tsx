import React from "react";
import {
  Stack,
  Typography,
  IconButton,
  Avatar,
} from "@mui/material";
import { MoreVert } from "@mui/icons-material";
import { Campaign, Feedback as FeedbackIcon } from "@mui/icons-material";
import { formatJaDateTime } from "../../utils/formatDateAndTime";
import { SampleBadge } from "./SampleBadge";

interface PostCardHeaderProps {
  userId?: string;
  name?: string;
  createdAt: string;
  isAnnouncement: boolean;
  isFeedback?: boolean;
  isEditing: boolean;
  onMenuClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  isDeleting: boolean;
  isOwnItem?: boolean;
  isSample?: boolean;
}

export const PostCardHeader: React.FC<PostCardHeaderProps> = ({
  userId,
  name,
  createdAt,
  isAnnouncement,
  isFeedback,
  isEditing,
  onMenuClick,
  isDeleting,
  isOwnItem,
  isSample,
}) => {
  return (
    <Stack direction="row" spacing={2} alignItems="flex-start" mb={2}>
      <Avatar sx={{ width: { xs: 40, sm: 44 }, height: { xs: 40, sm: 44 } }}>
        {name?.[0]}
      </Avatar>

      <Stack direction="column" flexGrow={1} spacing={0.5}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          flexWrap="wrap"
          useFlexGap
        >
          <Typography variant="subtitle1" component="p" fontWeight={700} color="text.primary">
            {name || "名前のないユーザー"}
          </Typography>
          {isSample && <SampleBadge />}
          {isAnnouncement && (
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: "primary.dark" }}>
              <Campaign sx={{ fontSize: 18 }} aria-hidden />
              <Typography variant="body2" fontWeight={700} component="span">
                お知らせ
              </Typography>
            </Stack>
          )}
          {isFeedback && (
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: "secondary.main" }}>
              <FeedbackIcon sx={{ fontSize: 18 }} aria-hidden />
              <Typography variant="body2" fontWeight={700} component="span">
                フィードバック
              </Typography>
            </Stack>
          )}
          {isEditing && (
            <Typography variant="body2" color="text.secondary" component="span">
              編集中
            </Typography>
          )}
        </Stack>
        <Typography variant="body2" color="text.secondary" component="p">
          <time dateTime={createdAt}>{formatJaDateTime(createdAt)}</time>
        </Typography>
      </Stack>

      {isOwnItem && (
        <IconButton
          onClick={onMenuClick}
          disabled={isDeleting}
          aria-label="メニューを開く"
          aria-haspopup="menu"
          sx={{
            width: 44,
            height: 44,
            color: "text.secondary",
            "&:hover": {
              color: "text.primary",
              bgcolor: "action.hover",
            },
          }}
        >
          <MoreVert />
        </IconButton>
      )}
    </Stack>
  );
};

export default PostCardHeader;
