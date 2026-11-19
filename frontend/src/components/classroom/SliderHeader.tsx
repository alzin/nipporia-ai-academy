import React from 'react';
import {
  Box,
  Stack,
  IconButton,
  Typography,
} from '@mui/material';
import {
  Fullscreen,
  FullscreenExit,
  TextFields,
  Image,
  VideoLibrary,
  Quiz,
  Extension,
  Code,
  Slideshow,
} from '@mui/icons-material';

interface SlideHeaderProps {
  currentSlide: number;
  totalSlides: number;
  isFullscreen: boolean;
  slideType: string;
  onToggleFullscreen: () => void;
  onExitFullscreen: () => void;
}

export const SlideHeader: React.FC<SlideHeaderProps> = ({
  currentSlide,
  totalSlides,
  isFullscreen,
  slideType,
  onToggleFullscreen,
  onExitFullscreen,
}) => {
  const getSlideIcon = (type: string) => {
    switch (type) {
      case 'text': return <TextFields />;
      case 'image': return <Image />;
      case 'video': return <VideoLibrary />;
      case 'quiz': return <Quiz />;
      case 'interactive': return <Extension />;
      case 'code': return <Code />;
      default: return <Slideshow />;
    }
  };

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{
        px: 2,
        py: 1,
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Left Side - Slide Info */}
      <Stack direction="row" spacing={1} alignItems="center">
        <Box component="span" sx={{ display: 'inline-flex', color: 'text.secondary' }} aria-hidden>
          {getSlideIcon(slideType)}
        </Box>
        <Typography variant="body2" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {currentSlide + 1} / {totalSlides}
        </Typography>
      </Stack>

      {/* Right Side - Controls */}
      <Stack direction="row" spacing={1}>
        {/* {isFullscreen && (
          <IconButton 
            onClick={onExitFullscreen} 
            sx={{ 
              bgcolor: 'action.hover',
              '&:hover': {
                bgcolor: 'action.selected'
              }
            }}
            title="全画面表示を終了"
          >
            <Close />
          </IconButton>
        )} */}
        <IconButton
          onClick={onToggleFullscreen}
          sx={{ width: 44, height: 44 }}
          aria-label={isFullscreen ? '全画面表示を終了' : '全画面で表示'}
          title={isFullscreen ? '全画面表示を終了' : '全画面で表示'}
        >
          {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
        </IconButton>
      </Stack>
    </Stack>
  );
};