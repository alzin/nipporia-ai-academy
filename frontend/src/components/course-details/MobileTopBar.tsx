import React from "react";
import { Stack, IconButton, Typography } from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";

interface Props {
  title?: string;
  onOpenDrawer: () => void;
}

export const MobileTopBar: React.FC<Props> = ({ title, onOpenDrawer }) => {
  return (
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
      <IconButton
        onClick={onOpenDrawer}
        aria-label="レッスン一覧を開く"
        sx={{ width: 44, height: 44, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}
      >
        <MenuIcon />
      </IconButton>
      {title && (
        <Typography variant="h6" component="p" sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
          {title}
        </Typography>
      )}
    </Stack>
  );
};
