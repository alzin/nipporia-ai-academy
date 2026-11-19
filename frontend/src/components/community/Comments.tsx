// frontend/src/components/community/Comments.tsx

import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Card,
  Collapse,
  Typography,
  TextField,
  Tooltip,
  Button,
  Avatar,
  Stack,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Divider,
  Alert,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Send,
  MoreVert,
  Edit,
  Delete,
  Report,
  Save,
  Cancel,
  Reply,
  ExpandMore,
  ExpandLess,
  Lock, // Added Lock icon
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { useCommunityAccess } from "../../hooks/useCommunityAccess";
import { useNavigate } from "react-router-dom"; // Added navigation
import { AppDispatch, RootState } from "../../store/store";
import {
  fetchComments,
  createComment,
  updateComment,
  deleteComment,
  startDeleteComment,
} from "../../store/slices/communitySlice";
import {
  fetchAnnouncementComments,
  createAnnouncementComment,
  updateAnnouncementComment,
  deleteAnnouncementComment,
  startDeleteAnnouncementComment,
} from "../../store/slices/announcementSlice";
import {
  fetchFeedbackComments,
  createFeedbackComment,
  updateFeedbackComment,
  deleteFeedbackComment,
  startDeleteFeedbackComment,
} from "../../store/slices/feedbackSlice";
import { linkifyText } from "../../utils/linkify";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { formatJaDate } from "../../utils/formatDateAndTime";

// Interfaces
interface Comment {
  id: string;
  userId: string;
  postId: string;
  content: string;
  parentCommentId?: string;
  createdAt: string;
  updatedAt: string;
  author?: {
    userId: string;
    name: string;
    email: string;
    avatar?: string;
  };
  replies?: Comment[];
  isEditing?: boolean;
  isDeleting?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  hasReplies?: boolean;
}

interface CommentsProps {
  postId: string;
  commentsCount?: number;
  isOpen: boolean;
  onToggle: () => void;
  isAnnouncement?: boolean;
  isFeedback?: boolean;
}

// Helpers
const formatCommentDate = (dateString: string): string => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();

  if (diffMs < 60 * 1000) return "たった今";
  if (diffMs < 7 * 24 * 60 * 60 * 1000) {
    return formatDistanceToNow(date, { addSuffix: true, locale: ja });
  }
  return formatJaDate(date);
};

interface CommentItemProps {
  comment: Comment;
  onReply: (parentId: string) => void;
  onEdit: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  onReport: (commentId: string, reason: string) => void;
  currentUserId?: string;
  level?: number;
  isAnnouncement?: boolean;
  isFeedback?: boolean;
  postId: string;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onReply,
  onEdit,
  onDelete,
  onReport,
  currentUserId,
  level = 0,
  isAnnouncement,
  isFeedback,
  postId,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [showReplies, setShowReplies] = useState(true);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { canWrite, disabledReason } = useCommunityAccess();
  const menuOpen = Boolean(anchorEl);

  const canEdit = comment.canEdit ?? currentUserId === comment.userId;
  const canDelete = comment.canDelete ?? currentUserId === comment.userId;
  const hasReplies =
    comment.hasReplies ?? (comment.replies && comment.replies.length > 0);

  useEffect(() => {
    if (!comment.isEditing && !isEditing && hasReplies) {
      setShowReplies(true);
    }
  }, [comment.isEditing, isEditing, hasReplies]);

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setEditContent(comment.content);
    setShowReplies(false);
    handleMenuClose();
  };

  const handleSaveEdit = async () => {
    if (editContent.trim() && editContent !== comment.content) {
      try {
        if (isAnnouncement) {
          await dispatch(
            updateAnnouncementComment({
              commentId: comment.id,
              announcementId: postId,
              data: { content: editContent.trim() },
            }),
          ).unwrap();
        } else if (isFeedback) {
          await dispatch(
            updateFeedbackComment({
              commentId: comment.id,
              data: { content: editContent.trim() },
            }),
          ).unwrap();
        } else {
          await dispatch(
            updateComment({
              commentId: comment.id,
              data: { content: editContent.trim() },
            }),
          ).unwrap();
        }
        setIsEditing(false);
        if (hasReplies) setShowReplies(true);
      } catch (error) {
        console.error("Failed to update comment:", error);
        setEditContent(comment.content);
        if (hasReplies) setShowReplies(true);
      }
    } else {
      setIsEditing(false);
      setEditContent(comment.content);
      if (hasReplies) setShowReplies(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(comment.content);
    if (hasReplies) setShowReplies(true);
  };

  const handleDeleteClick = () => {
    handleMenuClose();
    onDelete(comment.id);
  };

  const handleReportClick = () => {
    setReportDialogOpen(true);
    setReportReason("");
    handleMenuClose();
  };

  const handleReportSubmit = () => {
    if (reportReason.trim()) {
      onReport(comment.id, reportReason);
      setReportDialogOpen(false);
      setReportReason("");
    }
  };

  return (
    <Box
      sx={{
        ml: level * (isMobile ? 2 : 4),
        mb: 2,
        opacity: comment.isDeleting ? 0.5 : 1,
        transition: "opacity 0.3s ease",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          variant="outlined"
          sx={{
            p: { xs: 1.5, sm: 2 },
            bgcolor: "background.paper",
            borderRadius: 2.5,
            position: "relative",
          }}
        >
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Avatar sx={{ width: 32, height: 32, flexShrink: 0, fontSize: "0.875rem" }}>
              {comment.author?.name?.[0] || "?"}
            </Avatar>

            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
                mb={1}
              >
                <Box>
                  <Typography
                    variant="subtitle2"
                    fontWeight={600}
                    sx={{ color: "text.primary" }}
                  >
                    {comment.author?.name || "名前のないユーザー"}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    component="p"
                  >
                    <time dateTime={comment.createdAt}>
                      {formatCommentDate(comment.createdAt)}
                    </time>
                    {comment.createdAt !== comment.updatedAt && "（編集済み）"}
                  </Typography>
                </Box>

                <IconButton
                  onClick={handleMenuClick}
                  disabled={comment.isDeleting}
                  aria-label="コメントのメニューを開く"
                  aria-haspopup="menu"
                  sx={{ width: 44, height: 44, mt: -1, mr: -1, color: "text.secondary" }}
                >
                  <MoreVert fontSize="small" />
                </IconButton>
              </Stack>

              {isEditing ? (
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={isMobile ? 2 : 3}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    variant="outlined"
                    size="small"
                    disabled={comment.isEditing}
                    sx={{ mb: 1 }}
                    inputProps={{ "aria-label": "コメントを編集" }}
                  />
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Button
                      variant="contained"
                      onClick={handleSaveEdit}
                      disabled={
                        !editContent.trim() ||
                        editContent === comment.content ||
                        comment.isEditing
                      }
                      startIcon={
                        comment.isEditing ? (
                          <CircularProgress size={14} />
                        ) : (
                          <Save />
                        )
                      }
                    >
                      {comment.isEditing ? "保存中…" : "保存"}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleCancelEdit}
                      disabled={comment.isEditing}
                      startIcon={<Cancel />}
                    >
                      キャンセル
                    </Button>
                  </Stack>
                </Box>
              ) : (
                <Typography
                  variant="body2"
                  sx={{
                    mb: 1,
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                  }}
                >
                  {linkifyText(comment.content)}
                </Typography>
              )}

              {!isEditing && !comment.isEditing && (
                <Stack direction="row" spacing={1} alignItems="center">
                  {level === 0 && (
                    <Tooltip title={disabledReason}>
                    <span>
                    <Button
                      variant="text"
                      color="inherit"
                      disabled={!canWrite}
                      onClick={() => onReply(comment.id)}
                      startIcon={<Reply fontSize="small" />}
                      sx={{ color: "text.secondary", ml: -1.5 }}
                    >
                      返信
                    </Button>
                    </span>
                    </Tooltip>
                  )}
                </Stack>
              )}
            </Box>
          </Stack>

          {comment.isDeleting && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: "rgba(255, 253, 249, 0.8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 1,
              }}
            >
              <CircularProgress size={24} />
            </Box>
          )}
        </Card>

        <Menu
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          {canEdit && (
            <MenuItem
              onClick={handleEditClick}
              disabled={comment.isEditing || comment.isDeleting}
            >
              <ListItemIcon>
                <Edit fontSize="small" />
              </ListItemIcon>
              <ListItemText>編集</ListItemText>
            </MenuItem>
          )}
          {canDelete && (
            <MenuItem
              onClick={handleDeleteClick}
              disabled={comment.isDeleting}
              sx={{ color: "error.main" }}
            >
              <ListItemIcon>
                <Delete fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>削除</ListItemText>
            </MenuItem>
          )}
          {!canEdit && (
            <MenuItem
              onClick={handleReportClick}
              sx={{ color: "warning.main" }}
            >
              <ListItemIcon>
                <Report fontSize="small" color="warning" />
              </ListItemIcon>
              <ListItemText>報告する</ListItemText>
            </MenuItem>
          )}
        </Menu>

        <Dialog
          open={reportDialogOpen}
          onClose={() => setReportDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>コメントを報告する</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              報告する理由を書いてください。
            </DialogContentText>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="例：内容が講座と関係ない、不快な表現がある など"
              inputProps={{ "aria-label": "報告する理由" }}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              variant="outlined"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setReportDialogOpen(false)} color="inherit">
              キャンセル
            </Button>
            <Button
              onClick={handleReportSubmit}
              color="warning"
              variant="contained"
              disabled={!reportReason.trim()}
            >
              報告する
            </Button>
          </DialogActions>
        </Dialog>
      </motion.div>

      {hasReplies && comment.replies && comment.replies.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Button
            variant="text"
            color="inherit"
            onClick={() => setShowReplies(!showReplies)}
            endIcon={showReplies ? <ExpandLess /> : <ExpandMore />}
            aria-expanded={showReplies}
            sx={{
              color: "text.secondary",
              ml: { xs: 2, sm: 4 },
            }}
          >
            {showReplies
              ? `返信を閉じる（${comment.replies.length}件）`
              : `返信を見る（${comment.replies.length}件）`}
          </Button>

          <Collapse in={showReplies}>
            <AnimatePresence>
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onReport={onReport}
                  currentUserId={currentUserId}
                  level={level + 1}
                  isAnnouncement={isAnnouncement}
                  isFeedback={isFeedback}
                  postId={postId}
                />
              ))}
            </AnimatePresence>
          </Collapse>
        </Box>
      )}
    </Box>
  );
};

export const Comments: React.FC<CommentsProps> = ({
  postId,
  commentsCount,
  isOpen,
  onToggle,
  isAnnouncement,
  isFeedback,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate(); // Added navigation hook

  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Get Subscription Status
  const { user } = useSelector((state: RootState) => state.auth);
  // Guests and non-members can read comments but not write
  const { canWrite, disabledReason, isGuest } = useCommunityAccess();
  const isCanceled = !canWrite;

  const announcement = useSelector((state: RootState) =>
    state.announcements.announcements.find((a) => a.id === postId),
  );
  const feedbackItem = useSelector((state: RootState) =>
    state.feedback.feedback.find((f) => f.id === postId),
  );
  const post = useSelector((state: RootState) =>
    state.community.posts.find((p) => p.id === postId),
  );

  const currentUserId = user?.id;
  const userProfile = useSelector(
    (state: RootState) => state.dashboard.data?.user,
  );

  const { comments, commentsLoading, commentsInitialized } = useMemo(() => {
    if (isAnnouncement) {
      return {
        comments: (announcement as any)?.comments || [],
        commentsLoading: (announcement as any)?.commentsLoading || false,
        commentsInitialized:
          (announcement as any)?.commentsInitialized || false,
      };
    } else if (isFeedback) {
      return {
        comments: feedbackItem?.comments || [],
        commentsLoading: feedbackItem?.commentsLoading || false,
        commentsInitialized: feedbackItem?.commentsInitialized || false,
      };
    } else {
      return {
        comments: (post as any)?.comments || [],
        commentsLoading: (post as any)?.commentsLoading || false,
        commentsInitialized: (post as any)?.commentsInitialized || false,
      };
    }
  }, [isAnnouncement, isFeedback, announcement, feedbackItem, post]);

  useEffect(() => {
    if (isOpen && !commentsInitialized && !commentsLoading) {
      if (isAnnouncement) {
        dispatch(
          fetchAnnouncementComments({
            announcementId: postId,
            page: 1,
            limit: 50,
          }),
        );
      } else if (isFeedback) {
        dispatch(
          fetchFeedbackComments({ feedbackId: postId, page: 1, limit: 50 }),
        );
      } else {
        dispatch(fetchComments({ postId, page: 1, limit: 50 }));
      }
    }
  }, [
    isOpen,
    commentsInitialized,
    commentsLoading,
    postId,
    dispatch,
    isAnnouncement,
    isFeedback,
  ]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || isCanceled) return; // Prevent submission if canceled

    setIsSubmitting(true);
    try {
      if (isAnnouncement) {
        await dispatch(
          createAnnouncementComment({
            announcementId: postId,
            data: {
              content: newComment.trim(),
              parentCommentId: replyToCommentId || undefined,
            },
          }),
        ).unwrap();
      } else if (isFeedback) {
        await dispatch(
          createFeedbackComment({
            feedbackId: postId,
            data: {
              content: newComment.trim(),
              parentCommentId: replyToCommentId || undefined,
            },
          }),
        ).unwrap();
      } else {
        await dispatch(
          createComment({
            postId,
            data: {
              content: newComment.trim(),
              parentCommentId: replyToCommentId || undefined,
            },
          }),
        ).unwrap();
      }
      setNewComment("");
      setReplyToCommentId(null);
    } catch (error) {
      console.error("Failed to create comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = (commentId: string) => {
    console.log("Edit comment:", commentId);
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      if (isAnnouncement) {
        dispatch(
          startDeleteAnnouncementComment({ announcementId: postId, commentId }),
        );
        await dispatch(
          deleteAnnouncementComment({ commentId, announcementId: postId }),
        ).unwrap();
      } else if (isFeedback) {
        dispatch(startDeleteFeedbackComment({ feedbackId: postId, commentId }));
        await dispatch(
          deleteFeedbackComment({ commentId, feedbackId: postId }),
        ).unwrap();
      } else {
        dispatch(startDeleteComment({ postId, commentId }));
        await dispatch(deleteComment({ commentId, postId })).unwrap();
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  const handleReportComment = (commentId: string, reason: string) => {
    console.log("Report comment:", commentId, reason);
  };

  const handleReply = (parentCommentId: string) => {
    if (isCanceled) return; // read-only visitors can't reply
    setReplyToCommentId(parentCommentId);
    const commentInput = document.getElementById("comment-input");
    if (commentInput) commentInput.focus();
  };

  const cancelReply = () => {
    setReplyToCommentId(null);
  };

  return (
    <Collapse in={isOpen} timeout={300}>
      <Divider />
      <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: "background.default" }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="subtitle1" component="h3" fontWeight={700}>
            コメント{commentsCount !== undefined && `（${commentsCount}件）`}
          </Typography>
          <Button
            onClick={onToggle}
            color="inherit"
            startIcon={<ExpandLess />}
            sx={{ color: "text.secondary" }}
          >
            閉じる
          </Button>
        </Stack>

        <Box sx={{ mb: 3 }}>
          {replyToCommentId && (
            <Alert
              severity="info"
              sx={{ mb: 2 }}
              action={
                <Button
                  color="inherit"
                  onClick={cancelReply}
                  startIcon={<Cancel />}
                >
                  返信をやめる
                </Button>
              }
            >
              コメントに返信しています
            </Alert>
          )}

          {!canWrite ? (
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
            >
              <Typography variant="body2" color="text.secondary">
                {disabledReason}
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Lock fontSize="small" />}
                sx={{ flexShrink: 0 }}
                onClick={() => navigate(isGuest ? "/login" : "/subscription")}
              >
                {isGuest ? "ログイン" : "メンバーになる"}
              </Button>
            </Stack>
          ) : (
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Avatar
              sx={{ width: 40, height: 40, mt: 0.5, display: { xs: "none", sm: "flex" } }}
            >
              {userProfile?.name?.[0] || "?"}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <TextField
                id="comment-input"
                fullWidth
                multiline
                rows={isMobile ? 2 : 3}
                placeholder={
                  replyToCommentId ? "返信を書く" : "コメントを書く"
                }
                inputProps={{
                  "aria-label": replyToCommentId ? "返信の内容" : "コメントの内容",
                }}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                variant="outlined"
                disabled={isSubmitting || isCanceled} // DISABLE INPUT
                sx={{
                  mb: 1,
                  "& .MuiOutlinedInput-root": {
                    bgcolor: isCanceled ? "action.hover" : "background.paper",
                  },
                }}
              />
              <Stack direction="row" justifyContent="flex-end" spacing={1}>
                <Button
                  variant="contained"
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isSubmitting || isCanceled} // DISABLE BUTTON
                  startIcon={
                    isSubmitting ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <Send />
                    )
                  }
                >
                  {isSubmitting
                    ? "送信中…"
                    : replyToCommentId
                      ? "返信する"
                      : "コメントする"}
                </Button>
              </Stack>
            </Box>
          </Stack>
          )}
        </Box>

        {commentsLoading && comments.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={24} aria-label="読み込み中…" />
          </Box>
        ) : comments.length > 0 ? (
          <AnimatePresence>
            {comments.map((comment: Comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onReply={handleReply}
                onEdit={handleEditComment}
                onDelete={handleDeleteComment}
                onReport={handleReportComment}
                currentUserId={currentUserId}
                isAnnouncement={isAnnouncement}
                isFeedback={isFeedback}
                postId={postId}
              />
            ))}
          </AnimatePresence>
        ) : commentsInitialized ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              まだコメントはありません。
            </Typography>
          </Box>
        ) : null}
      </Box>
    </Collapse>
  );
};
