import { Box, Stack, Typography } from "@mui/material";

interface IStepIndicatorProps {
  currentStep: number;
  label: string;
  /** Total number of steps in the registration flow. Defaults to 3 for backward compatibility. */
  totalSteps?: number;
}

export const StepIndicator = ({
  currentStep,
  label,
  totalSteps = 3,
}: IStepIndicatorProps) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Stack direction="row" spacing={1} aria-hidden="true">
        {[...Array(totalSteps)].map((_, index) => (
          <Box
            key={index}
            sx={{
              flex: 1,
              maxWidth: 56,
              height: 4,
              bgcolor: index + 1 <= currentStep ? "primary.main" : "divider",
              borderRadius: 2,
            }}
          />
        ))}
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        ステップ {currentStep}/{totalSteps}　{label}
      </Typography>
    </Box>
  );
};
