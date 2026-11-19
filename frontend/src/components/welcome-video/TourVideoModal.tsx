// frontend/src/components/video/TourVideoModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Stack,
  CircularProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Close,
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store/store';
import { Video, VideoType } from '../../services/videoService';
import { markTourVideoViewed } from '../../store/slices/videoSlice';

interface TourVideoModalProps {
  open: boolean;
  onClose: () => void;
  video: Video | null;
  isFirstTimeUser?: boolean;
}

// YouTube Player Component
const YouTubePlayer: React.FC<{
  videoId: string;
  width?: string | number;
  height?: string | number;
}> = ({ videoId, width = '100%', height = '400px' }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, [videoId]);

  const embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&rel=0&modestbranding=1`;

  return (
    <Box
      sx={{
        width: '100%',
        height: height,
        borderRadius: '12px',
        overflow: 'hidden',
        bgcolor: '#23211D',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {!isReady && <CircularProgress color="primary" />}
      {isReady && (
        <iframe
          width="100%"
          height="100%"
          src={embedUrl}
          title="サイトの使い方の動画"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ display: isReady ? 'block' : 'none' }}
        />
      )}
    </Box>
  );
};

// S3 Video Player Component
const S3VideoPlayer: React.FC<{ videoUrl: string }> = ({ videoUrl }) => {
  return (
    <Box
      sx={{
        width: '100%',
        borderRadius: '12px',
        overflow: 'hidden',
        bgcolor: '#23211D'
      }}
    >
      <video
        width="100%"
        controls
        aria-label="サイトの使い方の動画"
        autoPlay
        style={{ display: 'block', maxHeight: '60vh' }}
      >
        <source src={videoUrl} type="video/mp4" />
        お使いのブラウザでは動画を再生できません。
      </video>
    </Box>
  );
};

export const TourVideoModal: React.FC<TourVideoModalProps> = ({
  open,
  onClose,
  video,
  isFirstTimeUser = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch<AppDispatch>();

  // Mark as viewed when closing (stops future auto-shows)
  const handleClose = () => {
    dispatch(markTourVideoViewed()); // Sets hasSeedTourVideo = true
    onClose();
  };

  const getVideoPlayer = () => {
    if (!video) return null;

    if (video.videoType === VideoType.YOUTUBE) {
      const videoId = extractYouTubeVideoId(video.videoUrl);
      if (!videoId) return <Typography color="error">動画の URL が正しくありません。</Typography>;

      return (
        <YouTubePlayer
          videoId={videoId}
          height={isMobile ? '250px' : '400px'}
        />
      );
    } else if (video.videoType === VideoType.S3) {
      return <S3VideoPlayer videoUrl={video.videoUrl} />;
    }

    return <Typography color="error">この形式の動画は再生できません。</Typography>;
  };

  const extractYouTubeVideoId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  if (!video) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}

      sx={{
        '& .MuiDialog-paper': {
          borderRadius: isMobile ? 0 : '14px',
          maxHeight: isMobile ? '100vh' : '90vh'
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 2
        }}
      >
        <Typography variant="h6" component="span">
          サイトの使い方
        </Typography>
        <IconButton onClick={handleClose} edge="end" aria-label="閉じる" sx={{ width: 44, height: 44 }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }} >
        <Stack spacing={3}>
          {/* Video Player */}
          {getVideoPlayer()}

          {/* Video Info */}
          <Box>
            {isFirstTimeUser && (
              <Typography
                variant="body2"
                sx={{
                  mb: 2,
                  p: 2,
                  bgcolor: 'primary.light',
                  borderRadius: '10px',
                  color: 'text.primary',
                }}
              >
                ご登録ありがとうございます。短い動画で、このサイトの使い方を紹介します。
              </Typography>
            )}
            <Typography variant="h6" component="h2" gutterBottom>
              {video.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {video.description}
            </Typography>

            {/* Duration */}
            {/* {video.duration && (
              <Typography variant="caption" color="text.secondary">
                再生時間 {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
              </Typography>
            )} */}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={handleClose}
          variant="contained"
          color="primary"
        >
          はじめる
        </Button>
      </DialogActions>
    </Dialog>
  );
};