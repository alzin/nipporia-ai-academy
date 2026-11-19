// frontend/src/components/admin/SlidesBuilder/SlideList.tsx
import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Stack,
  Divider,
  Grid,
  Button,
  Tooltip,
  IconButton,
  FormControlLabel,
  Switch,
  Box,
} from '@mui/material';
import {
  Settings,
  TextFields,
  Image,
  VideoLibrary,
  Quiz,
  Code,
  Extension,
} from '@mui/icons-material';
import { Slide, SlideContent } from '../../../types/slide.types';
import { SlideListItem } from './SlideListItem';
import { getSlideTypeLabel } from '../../../utils/lideDefaults';

interface SlideListProps {
  slides: Slide[];
  activeSlide: number;
  onSlideSelect: (index: number) => void;
  onAddSlide: (type?: SlideContent['type']) => void;
  onDuplicateSlide: (index: number) => void;
  onRemoveSlide: (index: number) => void;
  onReorderSlides?: (slides: Slide[]) => void; // New prop for reordering
  validationErrors: Record<string, string[]>;
  showAdvancedSettings: boolean;
  onToggleAdvancedSettings: () => void;
}

const slideTypeConfigs = [
  { type: 'text' as const, icon: TextFields },
  { type: 'image' as const, icon: Image },
  { type: 'video' as const, icon: VideoLibrary },
  { type: 'quiz' as const, icon: Quiz },
  { type: 'code' as const, icon: Code },
  { type: 'interactive' as const, icon: Extension },
];

export const SlideList: React.FC<SlideListProps> = ({
  slides,
  activeSlide,
  onSlideSelect,
  onAddSlide,
  onDuplicateSlide,
  onRemoveSlide,
  onReorderSlides,
  validationErrors,
  showAdvancedSettings,
  onToggleAdvancedSettings,
}) => {
  // Drag and drop state
  const [draggedSlide, setDraggedSlide] = useState<Slide | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, slide: Slide, index: number) => {
    setDraggedSlide(slide);
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', ''); // Required for Firefox

    // Add visual feedback
    if (e.currentTarget) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    setDraggedSlide(null);
    setDraggedIndex(null);
    setDragOverIndex(null);

    // Reset visual feedback
    if (e.currentTarget) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Only clear if we're leaving the entire drop zone
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();

    if (draggedSlide === null || draggedIndex === null) return;
    if (draggedIndex === dropIndex) {
      setDraggedSlide(null);
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Create new array with reordered slides
    const newSlides = [...slides];
    const [draggedItem] = newSlides.splice(draggedIndex, 1);
    newSlides.splice(dropIndex, 0, draggedItem);

    // Call the reorder callback if provided
    if (onReorderSlides) {
      onReorderSlides(newSlides);
    }

    // Update active slide index if needed
    if (activeSlide === draggedIndex) {
      onSlideSelect(dropIndex);
    } else if (draggedIndex < activeSlide && dropIndex >= activeSlide) {
      onSlideSelect(activeSlide - 1);
    } else if (draggedIndex > activeSlide && dropIndex <= activeSlide) {
      onSlideSelect(activeSlide + 1);
    }

    // Clean up
    setDraggedSlide(null);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <Paper sx={{ p: 2, height: 'fit-content', position: 'sticky', top: 20 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" gutterBottom>
          スライド（{slides.length}）
        </Typography>
        <Tooltip title="詳細設定">
          <IconButton
            size="small"
            onClick={onToggleAdvancedSettings}
            color={showAdvancedSettings ? 'primary' : 'default'}
          >
            <Settings />
          </IconButton>
        </Tooltip>
      </Stack>

      <Stack spacing={1} sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
        {slides.map((slide, index) => (
          <Box
            key={slide.id}
            draggable
            onDragStart={(e) => handleDragStart(e, slide, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            sx={{
              position: 'relative',
              cursor: 'move',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -4,
                left: 0,
                right: 0,
                height: 4,
                bgcolor: 'primary.main',
                opacity: dragOverIndex === index && draggedIndex !== index ? 1 : 0,
                transition: 'opacity 0.2s ease',
              },
            }}
          >
            <SlideListItem
              slide={slide}
              index={index}
              isActive={activeSlide === index}
              hasErrors={(validationErrors[index] || []).length > 0}
              errorCount={(validationErrors[index] || []).length}
              onSelect={() => onSlideSelect(index)}
              onDuplicate={() => onDuplicateSlide(index)}
              onRemove={() => onRemoveSlide(index)}
              canRemove={slides.length > 1}
              isDragging={draggedIndex === index}
              isDragOver={dragOverIndex === index && draggedIndex !== index}
            />
          </Box>
        ))}
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" gutterBottom>
        スライドを追加
      </Typography>
      <Grid container spacing={1}>
        {slideTypeConfigs.map(({ type, icon: Icon }) => (
          <Grid size={{ xs: 4 }} key={type}>
            <Tooltip title={`${getSlideTypeLabel(type)}のスライドを追加`}>
              <Button
                fullWidth
                size="small"
                onClick={() => onAddSlide(type)}
                sx={{
                  flexDirection: 'column',
                  py: 1,
                  minWidth: 0,
                }}
                variant="outlined"
              >
                <Icon />
                <Typography variant="caption" sx={{ mt: 0.5, whiteSpace: 'nowrap', fontSize: '0.65rem' }}>
                  {getSlideTypeLabel(type)}
                </Typography>
              </Button>
            </Tooltip>
          </Grid>
        ))}
      </Grid>

      {showAdvancedSettings && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" gutterBottom>
            表示の設定
          </Typography>
          <Stack spacing={2}>
            <FormControlLabel
              control={<Switch />}
              label="移動ボタンを表示"
              sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
            />
            <FormControlLabel
              control={<Switch />}
              label="進み具合を表示"
              sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
            />
            <FormControlLabel
              control={<Switch />}
              label="自動で次へ進む"
              sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
            />
          </Stack>
        </>
      )}
    </Paper>
  );
};