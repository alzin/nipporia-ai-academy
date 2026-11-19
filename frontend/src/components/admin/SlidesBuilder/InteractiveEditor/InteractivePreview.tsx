import React from 'react';
import {
  Stack,
  Alert,
  Paper,
  Avatar,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Box,
} from '@mui/material';
import { Preview, PlayArrow, CheckCircleOutline } from '@mui/icons-material';
import { getDifficultyLabel, interactiveTypes } from '../../../../utils/interactiveTypes';
import { InteractiveContent } from '../../../../types/interactive.types';

interface InteractivePreviewProps {
  interactiveContent: InteractiveContent;
}

export const InteractivePreview: React.FC<InteractivePreviewProps> = ({
  interactiveContent,
}) => {
  const currentTypeConfig = interactiveTypes.find(t => t.value === interactiveContent.type);

  return (
    <Stack spacing={3}>
      <Alert severity="info" sx={{ mb: 3 }}>
        受講者にどう表示されるかの概要です。
      </Alert>
      
      <Paper variant="outlined" sx={{ p: 3, bgcolor: 'background.default' }}>
        <Stack spacing={2} alignItems="center">
          <Avatar
            sx={{
              bgcolor: currentTypeConfig?.color,
              width: 64,
              height: 64
            }}
          >
            {currentTypeConfig?.icon}
          </Avatar>
          
          <Typography variant="h6" gutterBottom>
            プレビュー
          </Typography>
          
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" fontWeight={600}>
              {currentTypeConfig?.label}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              項目 {interactiveContent.items?.length || 0} 個
            </Typography>
            <Typography variant="body2" color="text.secondary">
              難易度：{getDifficultyLabel(currentTypeConfig?.difficulty)}
            </Typography>
          </Stack>
          
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ maxWidth: 400 }}>
            {interactiveContent.instruction || '説明文はまだありません'}
          </Typography>

          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              startIcon={<Preview />}
              disabled={!interactiveContent.items?.length}
            >
              全画面で見る
            </Button>
            <Button
              variant="outlined"
              startIcon={<PlayArrow />}
              disabled={!interactiveContent.items?.length}
            >
              試しに解く
            </Button>
          </Stack>
          
          {!interactiveContent.items?.length && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              項目を追加すると、プレビューが使えます
            </Alert>
          )}
        </Stack>
      </Paper>
      
      {/* Preview Statistics */}
      {interactiveContent.items?.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              問題の概要
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary.main">
                    {interactiveContent.items.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    項目数
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Box textAlign="center">
                  <Typography variant="h4" color="success.main">
                    {Math.max(2, Math.ceil(interactiveContent.items.length * 0.6))}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    目安（分）
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Box textAlign="center">
                  <Typography variant="h4" color="info.main">
                    {getDifficultyLabel(currentTypeConfig?.difficulty)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    難易度
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Box textAlign="center">
                  <CheckCircleOutline sx={{ fontSize: 32, color: 'success.main' }} />
                  <Typography variant="body2" color="text.secondary">
                    使えます
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
};