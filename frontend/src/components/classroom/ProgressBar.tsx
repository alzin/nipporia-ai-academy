import React from 'react';
import { LinearProgress } from '@mui/material';

interface ProgressBarProps {
  progress: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  return (
    <LinearProgress
      variant="determinate"
      value={progress}
      aria-label="進み具合"
      sx={{ height: 8, borderRadius: 0 }}
    />
  );
};
