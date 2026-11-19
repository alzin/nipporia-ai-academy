import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  TextField,
  Stack,
  Paper,
  Typography,
  IconButton,
  Box,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  ContentCopy,
  Close,
  Facebook,
  Twitter,
  LinkedIn,
  WhatsApp,
} from "@mui/icons-material";

interface PostCardDialogsProps {
  deleteDialogOpen: boolean;
  reportDialogOpen: boolean;
  shareDialogOpen: boolean;
  itemType: string;
  isDeleting: boolean;
  shareUrl: string;
  reportReason: string;
  onDeleteDialogClose: () => void;
  onReportDialogClose: () => void;
  onShareDialogClose: () => void;
  onDeleteConfirm: () => void;
  onReportSubmit: () => void;
  onCopyShareUrl: () => void;
  onReportReasonChange: (reason: string) => void;
  onShareToSocial: (platform: string) => void;
}

const itemLabels: Record<string, string> = {
  announcement: "お知らせ",
  feedback: "フィードバック",
  post: "投稿",
};

const socialButtonSx = {
  width: 48,
  height: 48,
  border: "1px solid",
  borderColor: "divider",
  bgcolor: "background.paper",
  color: "text.primary",
  "&:hover": { bgcolor: "primary.light", color: "primary.dark" },
} as const;

export const PostCardDialogs: React.FC<PostCardDialogsProps> = ({
  deleteDialogOpen,
  reportDialogOpen,
  shareDialogOpen,
  itemType,
  isDeleting,
  shareUrl,
  reportReason,
  onDeleteDialogClose,
  onReportDialogClose,
  onShareDialogClose,
  onDeleteConfirm,
  onReportSubmit,
  onCopyShareUrl,
  onReportReasonChange,
  onShareToSocial,
}) => {
  const label = itemLabels[itemType] ?? "投稿";

  return (
    <>
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={onDeleteDialogClose}>
        <DialogTitle>{label}を削除しますか？</DialogTitle>
        <DialogContent>
          <DialogContentText>
            削除すると、元に戻せません。
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onDeleteDialogClose} disabled={isDeleting} color="inherit">
            キャンセル
          </Button>
          <Button
            onClick={onDeleteConfirm}
            color="error"
            variant="contained"
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={16} /> : undefined}
          >
            {isDeleting ? "削除中…" : "削除"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog */}
      <Dialog
        open={shareDialogOpen}
        onClose={onShareDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            {label}を共有する
            <IconButton onClick={onShareDialogClose} aria-label="閉じる" sx={{ width: 44, height: 44 }}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                このリンクを開くと、コミュニティのページでこの{label}が表示されます。
              </Typography>
              <Paper variant="outlined" sx={{ p: 1.5, pl: 2, bgcolor: "background.default" }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography
                    variant="body2"
                    sx={{ flex: 1, wordBreak: "break-all" }}
                  >
                    {shareUrl}
                  </Typography>
                  <IconButton onClick={onCopyShareUrl} aria-label="リンクをコピー" sx={{ width: 44, height: 44 }}>
                    <ContentCopy />
                  </IconButton>
                </Stack>
              </Paper>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                SNS でシェアする
              </Typography>
              <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                <IconButton
                  onClick={() => onShareToSocial("facebook")}
                  aria-label="Facebookでシェア"
                  sx={socialButtonSx}
                >
                  <Facebook />
                </IconButton>
                <IconButton
                  onClick={() => onShareToSocial("twitter")}
                  aria-label="X（Twitter）でシェア"
                  sx={socialButtonSx}
                >
                  <Twitter />
                </IconButton>
                <IconButton
                  onClick={() => onShareToSocial("linkedin")}
                  aria-label="LinkedInでシェア"
                  sx={socialButtonSx}
                >
                  <LinkedIn />
                </IconButton>
                <IconButton
                  onClick={() => onShareToSocial("whatsapp")}
                  aria-label="WhatsAppでシェア"
                  sx={socialButtonSx}
                >
                  <WhatsApp />
                </IconButton>
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog
        open={reportDialogOpen}
        onClose={onReportDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{label}を報告する</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            報告する理由を書いてください。
          </DialogContentText>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="例：内容が講座と関係ない、不快な表現がある など"
            inputProps={{ "aria-label": "報告する理由" }}
            value={reportReason}
            onChange={(e) => onReportReasonChange(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onReportDialogClose} color="inherit">
            キャンセル
          </Button>
          <Button
            onClick={onReportSubmit}
            color="warning"
            variant="contained"
            disabled={!reportReason.trim()}
          >
            報告する
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PostCardDialogs;
