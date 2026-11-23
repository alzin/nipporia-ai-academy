import React from "react";
import { Chip } from "@mui/material";

// Shown on the labeled example threads (isSample from the API). Real posts and
// comments never have the flag, so they never get this badge.
export const SAMPLE_BADGE_LABEL = "サンプル投稿";

export const SampleBadge: React.FC<{ size?: "small" | "medium" }> = ({ size = "small" }) => (
  <Chip
    label={SAMPLE_BADGE_LABEL}
    size={size}
    variant="outlined"
    color="warning"
    sx={{ fontWeight: 700, height: 22, "& .MuiChip-label": { px: 1 } }}
  />
);

export default SampleBadge;
