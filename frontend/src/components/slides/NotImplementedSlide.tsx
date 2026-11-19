import React from 'react';
import { Box, Typography, Alert, Paper, Stack } from '@mui/material';
import { Construction, Info } from '@mui/icons-material';

interface NotImplementedSlideProps {
  interactiveType: string;
  instruction?: string;
  title?: string;
}

export const NotImplementedSlide: React.FC<NotImplementedSlideProps> = ({
  interactiveType,
  instruction,
  title
}) => {
  return (
    <Box sx={{ 
      textAlign: 'center', 
      p: 4, 
      maxWidth: '800px', 
      margin: '0 auto',
      minHeight: '400px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }}>
      <Paper sx={{ 
        p: 6, 
        borderRadius: 3, 
        bgcolor: 'background.paper',
        border: '1px dashed',
        borderColor: 'divider'
      }}>
        <Stack spacing={3} alignItems="center">
          {/* Icon */}
          <Construction 
            sx={{ 
              fontSize: 72, 
              color: 'warning.main',
              opacity: 0.8
            }} 
          />

          {/* Title */}
          <Typography variant="h4" gutterBottom sx={{ color: 'text.primary', fontWeight: 600 }}>
            {title || `アクティビティ: ${interactiveType}`}
          </Typography>

          {/* Instruction */}
          <Typography 
            variant="body1" 
            color="text.secondary" 
            sx={{ 
              fontSize: '1.1rem', 
              lineHeight: 1.6,
              maxWidth: '600px' 
            }}
          >
            {instruction || 'アクティビティに取り組んでください。'}
          </Typography>

          {/* Not Implemented Alert */}
          <Alert 
            severity="info" 
            icon={<Info />}
            sx={{ 
              mt: 3,
              borderRadius: 3,
              fontSize: '1rem',
              maxWidth: '500px',
              '& .MuiAlert-message': {
                fontSize: '1rem'
              }
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              準備中です
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              「{interactiveType}」の形式は、まだ表示できません。今後のアップデートで対応します。
            </Typography>
          </Alert>

        </Stack>
      </Paper>
    </Box>
  );
};