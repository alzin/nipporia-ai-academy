import React from "react";
import { Box, ButtonBase, Stack, Tooltip, Typography } from "@mui/material";
import { colors } from "../../theme/theme";

interface CollapsedProgressCardProps {
  selectedCourse?: any;
  /** Kept for compatibility; colors come from the theme. */
  selectedCourseColors: { primary: string; secondary: string };
  currentProgress: any;
  setSidebarCollapsed: (v: boolean) => void;
}

export const CollapsedProgressCard: React.FC<CollapsedProgressCardProps> = ({
  selectedCourse,
  currentProgress,
  setSidebarCollapsed,
}) => {
  if (!selectedCourse || !currentProgress) return null;

  const label = `${currentProgress.totalLessons}本中 ${currentProgress.completedLessons}本完了（${currentProgress.completionPercentage}%）`;

  return (
    <Tooltip title={label} placement="right" arrow>
      <ButtonBase
        onClick={() => setSidebarCollapsed(false)}
        aria-label={`進み具合：${label}`}
        sx={{
          mt: 1,
          width: "100%",
          minHeight: 44,
          p: 1,
          borderRadius: "10px",
          border: `1px solid ${colors.line}`,
          bgcolor: colors.card,
          "&:hover": { bgcolor: colors.accentSoft },
          "&.Mui-focusVisible": { outline: `3px solid ${colors.blue}`, outlineOffset: 2 },
        }}
      >
        <Stack alignItems="center" spacing={0.5} sx={{ width: "100%" }}>
          <Typography variant="caption" fontWeight={700} sx={{ fontVariantNumeric: "tabular-nums" }}>
            {currentProgress.completionPercentage}%
          </Typography>
          <Box sx={{ width: "100%", height: 4, borderRadius: 999, bgcolor: colors.line }}>
            <Box
              sx={{
                width: `${currentProgress.completionPercentage}%`,
                height: "100%",
                borderRadius: 999,
                bgcolor: colors.accent,
              }}
            />
          </Box>
        </Stack>
      </ButtonBase>
    </Tooltip>
  );
};

export default CollapsedProgressCard;
