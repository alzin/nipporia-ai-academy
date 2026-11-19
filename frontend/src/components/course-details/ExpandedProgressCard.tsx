import React from "react";
import { Box, ButtonBase, Collapse, LinearProgress, Stack, Typography } from "@mui/material";
import { ExpandLess } from "@mui/icons-material";
import { colors } from "../../theme/theme";

interface ExpandedProgressCardProps {
  currentProgress: any;
  progressExpanded: boolean;
  setProgressExpanded: (v: boolean) => void;
  /** Kept for compatibility; colors come from the theme. */
  selectedCourseColors: { primary: string; secondary: string };
}

export const ExpandedProgressCard: React.FC<ExpandedProgressCardProps> = ({
  currentProgress,
  progressExpanded,
  setProgressExpanded,
}) => {
  if (!currentProgress) return null;

  return (
    <Box
      sx={{
        overflow: "hidden",
        borderRadius: "10px",
        border: `1px solid ${colors.line}`,
        bgcolor: colors.paper,
      }}
    >
      <ButtonBase
        onClick={() => setProgressExpanded(!progressExpanded)}
        aria-expanded={progressExpanded}
        sx={{
          width: "100%",
          minHeight: 44,
          px: 2,
          py: 1,
          justifyContent: "space-between",
          textAlign: "left",
          "&:hover": { bgcolor: colors.accentSoft },
          "&.Mui-focusVisible": { outline: `3px solid ${colors.blue}`, outlineOffset: -3 },
        }}
      >
        <Typography variant="body2" color="text.secondary" component="span">
          進み具合
        </Typography>
        <Stack direction="row" alignItems="center" spacing={0.5} component="span">
          <Typography variant="body1" fontWeight={700} component="span" sx={{ fontVariantNumeric: "tabular-nums" }}>
            {currentProgress.completionPercentage}%
          </Typography>
          <ExpandLess
            aria-hidden
            sx={{
              color: "text.secondary",
              transition: "transform 0.2s ease-in-out",
              transform: progressExpanded ? "rotate(0deg)" : "rotate(180deg)",
            }}
          />
        </Stack>
      </ButtonBase>

      <Collapse in={progressExpanded}>
        <Box sx={{ px: 2, pb: 1.5 }}>
          <LinearProgress
            variant="determinate"
            value={currentProgress.completionPercentage}
            aria-label="講座の進み具合"
            sx={{ height: 8, mb: 1 }}
          />
          <Typography variant="caption" color="text.secondary">
            {currentProgress.totalLessons}本中 {currentProgress.completedLessons}本完了
          </Typography>
        </Box>
      </Collapse>
    </Box>
  );
};

export default ExpandedProgressCard;
