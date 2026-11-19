// frontend/src/components/video/VideoButton.tsx
import React from 'react';
import { IconButton, Tooltip, Badge, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { PlayCircleOutline } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { setShowTourModal } from '../../store/slices/videoSlice';

interface VideoButtonProps {
  collapsed?: boolean; // Whether sidebar is collapsed
  inSidebar?: boolean; // Whether this is in the sidebar or standalone
}

const LABEL = 'サイトの使い方（動画）';

export const VideoButton: React.FC<VideoButtonProps> = ({ collapsed = false, inSidebar = false }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { video, tourVideoStatus } = useSelector((state: RootState) => state.videos);

  const handleOpenTourVideo = () => {
    dispatch(setShowTourModal(true)); // Open modal manually
  };

  const hasUnviewedTour = tourVideoStatus && !tourVideoStatus.hasSeenTour;
  const hasActiveVideo = video && video.isActive;

  // Don't show button if no active video
  if (!hasActiveVideo) {
    return null;
  }

  const ariaLabel = hasUnviewedTour ? `${LABEL}、まだ見ていません` : LABEL;

  if (inSidebar) {
    return (
      <ListItem disablePadding>
        <Tooltip title={collapsed ? LABEL : ''} placement="right">
          <ListItemButton
            onClick={handleOpenTourVideo}
            aria-label={collapsed ? ariaLabel : undefined}
            sx={{
              minHeight: 48,
              justifyContent: collapsed ? 'center' : 'initial',
              px: 2.5,
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 'auto' : 2, justifyContent: 'center' }}>
              <Badge variant="dot" color="primary" invisible={!hasUnviewedTour}>
                <PlayCircleOutline sx={{ fontSize: 22, color: hasUnviewedTour ? 'primary.main' : 'text.secondary' }} />
              </Badge>
            </ListItemIcon>
            {!collapsed && (
              <ListItemText
                primary={LABEL}
                slotProps={{ primary: { sx: { fontSize: '0.875rem', fontWeight: hasUnviewedTour ? 700 : 400 } } }}
              />
            )}
          </ListItemButton>
        </Tooltip>
      </ListItem>
    );
  }

  // Standalone version (for header)
  return (
    <Tooltip title={LABEL}>
      <IconButton
        onClick={handleOpenTourVideo}
        aria-label={ariaLabel}
        sx={{ width: 44, height: 44, color: hasUnviewedTour ? 'primary.main' : 'text.secondary' }}
      >
        <Badge variant="dot" color="primary" invisible={!hasUnviewedTour}>
          <PlayCircleOutline />
        </Badge>
      </IconButton>
    </Tooltip>
  );
};
