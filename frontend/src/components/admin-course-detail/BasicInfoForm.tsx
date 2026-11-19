import React, { memo } from "react";
import { Controller, Control, FieldErrors } from "react-hook-form";
import { TextField, Stack, FormControlLabel, Checkbox, Typography } from "@mui/material";
import { LessonFormState } from "../../types/lsesson-form.types";

interface BasicInfoFormProps {
  control: Control<LessonFormState>;
  errors: FieldErrors<LessonFormState>;
  lessons: LessonFormState[];
  isEditing?: boolean;
}

export const BasicInfoForm: React.FC<BasicInfoFormProps> = memo(
  ({ control, errors, lessons, isEditing = false }) => {
    // When adding a new lesson, allow order up to lessons.length + 1
    // When editing, allow up to lessons.length (since the lesson already exists)
    const maxOrder = isEditing ? lessons.length : lessons.length + 1;

    return (
      <Stack spacing={3}>
        <Controller
          name="title"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="レッスン名"
              error={!!errors.title}
              helperText={errors.title?.message}
            />
          )}
        />

        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              multiline
              rows={3}
              label="説明"
              error={!!errors.description}
              helperText={errors.description?.message}
            />
          )}
        />

        <Controller
          name="order"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              type="number"
              label="並び順"
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
              error={!!errors.order}
              helperText={
                errors.order?.message ||
                "数字を変えると、レッスンの順番が入れ替わります"
              }
              inputProps={{ min: 1, max: Math.max(maxOrder, 1) }}
              onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
            />
          )}
        />

        <Controller
          name="isFree"
          control={control}
          render={({ field }) => (
            <Stack>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                }
                label="無料公開"
              />
              <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
                チェックすると、登録していない人もこのレッスンを見られます。
              </Typography>
            </Stack>
          )}
        />
      </Stack>
    );
  }
);

BasicInfoForm.displayName = "BasicInfoForm";
