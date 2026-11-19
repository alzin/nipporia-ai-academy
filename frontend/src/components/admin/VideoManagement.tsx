// frontend/src/components/admin/VideoManagement.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Avatar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  YouTube,
  CloudDownload,
  CheckCircle,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../store/store";
import {
  fetchVideo,
  checkVideoExists,
  createOrUpdateVideo,
  deleteVideo,
  clearError,
} from "../../store/slices/videoSlice";
import {
  Video,
  VideoType,
  CreateOrUpdateVideoData,
  videoService,
} from "../../services/videoService";
import AdminNavigationButton from "./AdminNavigationButton";

// ===== Forms & Types =====
// Removed title, duration, and isActive
interface VideoFormData extends CreateOrUpdateVideoData {
  description: string;
  videoUrl: string;
  videoType: VideoType;
  thumbnailUrl?: string;
}

const buildInitialForm = (video?: Video | null): VideoFormData => ({
  description: video?.description || "",
  videoUrl: video?.videoUrl || "",
  videoType: video?.videoType ?? VideoType.YOUTUBE,
  thumbnailUrl: video?.thumbnailUrl || "",
});

const VideoForm: React.FC<{
  open: boolean;
  onClose: () => void;
  onSubmit: (data: VideoFormData) => void;
  video?: Video | null;
  loading?: boolean;
}> = ({ open, onClose, onSubmit, video, loading = false }) => {
  const [formData, setFormData] = useState<VideoFormData>(() =>
    buildInitialForm(video),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null);

  // --- Reset form whenever dialog opens or when the bound video changes ---
  useEffect(() => {
    if (open) {
      const init = buildInitialForm(video);
      setFormData(init);
      setErrors({});
      if (init.videoType === VideoType.YOUTUBE && init.videoUrl) {
        const thumb = videoService.getYouTubeThumbnail(init.videoUrl);
        setPreviewThumbnail(thumb);
      } else {
        setPreviewThumbnail(null);
      }
    }
  }, [open, video]);

  // --- Keep preview in sync with url/type ---
  useEffect(() => {
    if (formData.videoType === VideoType.YOUTUBE && formData.videoUrl) {
      const thumb = videoService.getYouTubeThumbnail(formData.videoUrl);
      setPreviewThumbnail(thumb);
      if (thumb && !formData.thumbnailUrl) {
        setFormData((prev) => ({ ...prev, thumbnailUrl: thumb }));
      }
    } else {
      setPreviewThumbnail(null);
    }
  }, [formData.videoUrl, formData.videoType, formData.thumbnailUrl]);

  const handleInputChange =
    (field: keyof VideoFormData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    };

  const handleSelectChange = (field: keyof VideoFormData) => (event: any) => {
    const nextType = event.target.value as VideoType;
    setFormData((prev) => {
      const next: VideoFormData = {
        ...prev,
        [field]: nextType,
      } as VideoFormData;
      if (nextType !== VideoType.YOUTUBE) {
        setPreviewThumbnail(null);
      }
      return next;
    });
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.description.trim())
      newErrors.description = "説明を入力してください";
    if (!formData.videoUrl.trim()) {
      newErrors.videoUrl = "動画のURLを入力してください";
    } else if (
      !videoService.isValidVideoUrl(formData.videoUrl, formData.videoType)
    ) {
      newErrors.videoUrl =
        formData.videoType === VideoType.YOUTUBE
          ? "YouTube のURLの形式が違います"
          : "S3 のURLの形式が違います";
    }
    if (formData.thumbnailUrl && formData.thumbnailUrl.trim()) {
      try {
        new URL(formData.thumbnailUrl);
      } catch {
        newErrors.thumbnailUrl = "サムネイルのURLの形式が違います";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;
    const submitData: VideoFormData = { ...formData };
    if (!submitData.thumbnailUrl?.trim()) delete submitData.thumbnailUrl;
    onSubmit(submitData);
  };

  const closeAndReset = () => {
    setFormData(buildInitialForm(video));
    setErrors({});
    setPreviewThumbnail(null);
    onClose();
  };

  const urlHelper = useMemo(
    () =>
      formData.videoType === VideoType.YOUTUBE
        ? "例：https://www.youtube.com/watch?v=VIDEO_ID"
        : "例：https://your-bucket.s3.amazonaws.com/video.mp4",
    [formData.videoType],
  );

  return (
    <Dialog open={open} onClose={closeAndReset} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {video ? "紹介動画を編集" : "紹介動画を追加"}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="説明"
              value={formData.description}
              onChange={handleInputChange("description")}
              error={!!errors.description}
              helperText={errors.description}
              multiline
              rows={3}
              fullWidth
              required
            />

            <FormControl fullWidth>
              <InputLabel>動画の種類</InputLabel>
              <Select
                value={formData.videoType}
                label="動画の種類"
                onChange={handleSelectChange("videoType")}
              >
                <MenuItem value={VideoType.YOUTUBE}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <YouTube fontSize="small" />
                    <span>YouTube</span>
                  </Stack>
                </MenuItem>
                <MenuItem value={VideoType.S3}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CloudDownload fontSize="small" />
                    <span>S3</span>
                  </Stack>
                </MenuItem>
              </Select>
            </FormControl>

            <TextField
              label={
                formData.videoType === VideoType.YOUTUBE
                  ? "YouTube のURL"
                  : "S3 のURL"
              }
              value={formData.videoUrl}
              onChange={handleInputChange("videoUrl")}
              error={!!errors.videoUrl}
              helperText={errors.videoUrl || urlHelper}
              fullWidth
              required
            />

            {previewThumbnail && (
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    プレビュー
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar
                      src={previewThumbnail}
                      variant="rounded"
                      sx={{ width: 120, height: 80 }}
                    >
                      <YouTube />
                    </Avatar>
                    <Box>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <CheckCircle fontSize="small" color="success" />
                        <Typography variant="body2" color="success.main">
                          YouTube のURLを確認しました
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        サムネイルは自動で作られます
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            )}

            <Stack direction="row" spacing={2}>
              <TextField
                label="サムネイルのURL"
                value={formData.thumbnailUrl || ""}
                onChange={handleInputChange("thumbnailUrl")}
                error={!!errors.thumbnailUrl}
                helperText={errors.thumbnailUrl || "空欄でもかまいません"}
                fullWidth
              />
            </Stack>

            <Alert severity="info">
              紹介動画は、新しいユーザーがはじめてログインしたときに自動で表示されます。
              サイドバーのボタンからも見られます。
            </Alert>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={closeAndReset} disabled={loading}>
            キャンセル
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? "保存中…" : "保存"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export const VideoManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { video, loading, error, isCreatingOrUpdating, isDeleting } =
    useSelector((state: RootState) => state.videos);

  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    dispatch(fetchVideo());
    dispatch(checkVideoExists());
  }, [dispatch]);

  const handleCreateOrUpdate = async (data: VideoFormData) => {
    try {
      await dispatch(createOrUpdateVideo(data)).unwrap();
      setShowForm(false);
    } catch (error) {
      console.error("Failed to save video:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteVideo()).unwrap();
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Failed to delete video:", error);
    }
  };

  const getThumbnail = () => {
    if (!video) return null;
    if (video.thumbnailUrl) return video.thumbnailUrl;
    if (video.videoType === VideoType.YOUTUBE) {
      const regex =
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = video.videoUrl.match(regex);
      const videoId = match ? match[1] : null;
      return videoId
        ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        : null;
    }
    return null;
  };

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <AdminNavigationButton titlePage="紹介動画の管理" />

        <Button
          variant="contained"
          startIcon={video ? <Edit /> : <Add />}
          onClick={() => setShowForm(true)}
          disabled={isCreatingOrUpdating}
        >
          {video ? "動画を編集" : "動画を追加"}
        </Button>
      </Stack>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => dispatch(clearError())}
        >
          うまく処理できませんでした。もう一度お試しください。
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : video ? (
        <Card>
          <CardContent>
            <Stack direction="row" spacing={3} alignItems="center">
              <Avatar
                src={getThumbnail() || undefined}
                variant="rounded"
                sx={{ width: 120, height: 80 }}
              >
                {video.videoType === VideoType.YOUTUBE ? (
                  <YouTube />
                ) : (
                  <CloudDownload />
                )}
              </Avatar>

              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  紹介動画
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {video.description}
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    種類：{video.videoType === VideoType.YOUTUBE ? "YouTube" : "S3"}
                  </Typography>
                </Stack>
              </Box>

              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={() => setShowForm(true)}
                  disabled={isCreatingOrUpdating}
                >
                  編集
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                >
                  削除
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                紹介動画はまだありません
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                紹介動画を追加すると、新しいユーザーがはじめてログインしたときに表示されます。
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Form Dialog */}
      <VideoForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreateOrUpdate}
        video={video}
        loading={isCreatingOrUpdating}
      />

      {/* Delete Confirmation */}
      <Dialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
      >
        <DialogTitle>紹介動画を削除しますか？</DialogTitle>
        <DialogContent>
          <Typography>
            削除すると、新しいユーザーがはじめてログインしたときに紹介動画が表示されなくなります。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteConfirm(false)}>キャンセル</Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={isDeleting}
          >
            {isDeleting ? "削除中…" : "削除"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
