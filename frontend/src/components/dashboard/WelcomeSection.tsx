import React from "react";
import { Box, Stack, Typography, IconButton, Tooltip } from "@mui/material";
import { Refresh } from "@mui/icons-material";

interface WelcomeSectionProps {
  userName?: string;
  userEmail?: string;
  onRefresh?: () => void;
  /** Guest: no name, generic welcome */
  isGuest?: boolean;
}

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({
  userName,
  userEmail,
  onRefresh,
  isGuest = false,
}) => {
  const displayName = userName || userEmail?.split("@")[0] || "";

  return (
    <Box component="section" sx={{ mb: { xs: 3, md: 4 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" component="h1" sx={{ mb: 1, overflowWrap: "anywhere" }}>
            {isGuest
              ? "Nipporia AI Academy へようこそ"
              : displayName
                ? `${displayName}さん、こんにちは`
                : "こんにちは"}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: "36em" }}>
            {isGuest
              ? "AI ツールの使い方を、短い動画で学べます。まずは無料のレッスンから見てみてください。"
              : "今日も少しずつ進めましょう。"}
          </Typography>
        </Box>
        {onRefresh && (
          <Tooltip title="最新の情報に更新">
            <IconButton
              onClick={onRefresh}
              aria-label="最新の情報に更新"
              sx={{ width: 44, height: 44, flexShrink: 0, color: "text.secondary" }}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </Box>
  );
};
