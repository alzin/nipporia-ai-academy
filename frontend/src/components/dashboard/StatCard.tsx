import React from "react";
import { Card, CardActionArea, CardContent, Typography, Stack, Box, Skeleton } from "@mui/material";
import { colors } from "../../theme/theme";

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  /** Kept for compatibility; the card always uses the accent color. */
  color?: string;
  onClick?: () => void;
  loading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ icon, title, value, onClick, loading }) => {
  const content = (
    <CardContent sx={{ p: { xs: 2, sm: 2.5 }, "&:last-child": { pb: { xs: 2, sm: 2.5 } } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          {loading ? (
            <Skeleton variant="text" width={72} height={40} />
          ) : (
            <Typography
              variant="h4"
              component="p"
              sx={{ fontVariantNumeric: "tabular-nums", lineHeight: 1.3, mt: 0.5 }}
            >
              {value}
            </Typography>
          )}
        </Box>
        <Box
          aria-hidden
          sx={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            bgcolor: colors.accentSoft,
            color: colors.accentHover,
          }}
        >
          {icon}
        </Box>
      </Stack>
    </CardContent>
  );

  return (
    <Card sx={{ height: "100%" }}>
      {onClick ? (
        <CardActionArea onClick={onClick} sx={{ height: "100%" }}>
          {content}
        </CardActionArea>
      ) : (
        content
      )}
    </Card>
  );
};
