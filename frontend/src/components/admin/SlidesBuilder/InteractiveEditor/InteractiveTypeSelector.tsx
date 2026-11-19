import React from 'react';
import {
  Card,
  CardContent,
  Grid,
  Avatar,
  Typography,
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { InteractiveContent } from '../../../../types/interactive.types';
import { getDefaultInstruction, getDifficultyLabel, interactiveTypes } from '../../../../utils/interactiveTypes';


interface InteractiveTypeSelectorProps {
  interactiveContent: InteractiveContent;
  onUpdateContent: (updates: Partial<InteractiveContent>) => void;
}

export const InteractiveTypeSelector: React.FC<InteractiveTypeSelectorProps> = ({
  interactiveContent,
  onUpdateContent,
}) => {
  const currentType = interactiveContent.type || 'drag-drop';

  const handleTypeChange = (typeValue: string) => {
    // Show confirmation dialog
    const isConfirmed = window.confirm("種類を変えると、入力した項目と設定は消えます。変更しますか？");

    // Only proceed if user confirms
    if (isConfirmed) {
      onUpdateContent({
        type: typeValue as any,
        items: [],
        settings: {},
        instruction: getDefaultInstruction(typeValue),
        feedback: {
          correct: '正解です。',
          incorrect: 'ちがいます。もう一度考えてみましょう。'
        }
      });
    }
  };
  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight={600} sx={{ mb: 3 }}>
          問題の種類を選ぶ
        </Typography>

        <Grid container spacing={2}>
          {interactiveTypes.map((type) => {
            const isSelected = currentType === type.value;
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={type.value}>
                <Card
                  onClick={() => handleTypeChange(type.value)}
                  sx={{
                    cursor: 'pointer',
                    height: '100%',
                    border: '2px solid',
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    bgcolor: isSelected ? 'action.selected' : 'background.paper',
                    transition: 'border-color 0.2s ease',
                    position: 'relative',
                    '&:hover': {
                      borderColor: 'primary.main',
                    }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Avatar
                      sx={{
                        bgcolor: type.color,
                        width: 56,
                        height: 56,
                        mx: 'auto',
                        mb: 2
                      }}
                    >
                      {type.icon}
                    </Avatar>

                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {type.label}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                      {type.description}
                    </Typography>

                    <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 1 }}>
                      難易度：{getDifficultyLabel(type.difficulty)}
                    </Typography>

                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      例：{type.example}
                    </Typography>

                    {isSelected && (
                      <CheckCircle sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        color: 'primary.main'
                      }} />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );
};