import React from 'react';
import {
  Paper,
  Grid,
  Typography,
  Stack,
  Chip,
  Alert,
  Box,
} from '@mui/material';
import {
  TextFields,
  Image,
  VideoLibrary,
  Quiz,
  Code,
  Extension,
} from '@mui/icons-material';
import { Slide } from '../../../types/slide.types';
import { getSlideTypeLabel } from '../../../utils/lideDefaults';

interface SlidesBuilderSummaryProps {
  slides: Slide[];
  totalErrors: number;
  onPreview: () => void;
  hasValidationErrors: boolean;
}

const getSlideIcon = (type: string) => {
  switch (type) {
    case 'text': return <TextFields />;
    case 'image': return <Image />;
    case 'video': return <VideoLibrary />;
    case 'quiz': return <Quiz />;
    case 'interactive': return <Extension />;
    case 'code': return <Code />;
    default: return <TextFields />;
  }
};

export const SlidesBuilderSummary: React.FC<SlidesBuilderSummaryProps> = ({
  slides,
  totalErrors,
  onPreview,
  hasValidationErrors,
}) => {
  const slideTypeDistribution = slides.reduce((acc, slide) => {
    acc[slide.content.type] = (acc[slide.content.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const estimatedDuration = slides.reduce((acc, slide) => acc + (slide.duration || 5), 0);
  const interactiveSlides = slides.filter(s => s.content.type === 'interactive').length;

  return (
    <Paper variant="outlined" sx={{ p: 3, mt: 3 }}>
      <Grid container spacing={3} alignItems="center">
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={2}>
            <Typography variant="h6" fontWeight={600} color="primary.main">
              スライドの概要
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
                  <Typography variant="h4" fontWeight={700} color="primary.main">
                    {slides.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    スライド数
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
                  <Typography variant="h4" fontWeight={700} color="warning.main">
                    {totalErrors}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    要修正
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
                  <Typography variant="h4" fontWeight={700} color="info.main">
                    {interactiveSlides}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    インタラクティブ
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
                  <Typography variant="h4" fontWeight={700} color="success.main">
                    {estimatedDuration}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    目安（分）
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* 種類ごとの枚数 */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                種類ごとの枚数
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {Object.entries(slideTypeDistribution).map(([type, count]) => (
                  <Chip
                    key={type}
                    icon={getSlideIcon(type)}
                    label={`${getSlideTypeLabel(type)}：${count}`}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Stack spacing={2}>
            {hasValidationErrors && (
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                <Typography variant="body2" fontWeight={500}>
                  公開する前に、エラーを直してください
                </Typography>
              </Alert>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  );
};