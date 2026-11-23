import React from "react";
import { Stack, IconButton, Typography } from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";
import { CourseCover } from "../common/CourseCover";

interface Props {
  title?: string;
  /** Course cover; shown as a small 16:9 thumbnail next to the title when set. */
  coverImageUrl?: string | null;
  onOpenDrawer: () => void;
}

export const MobileTopBar: React.FC<Props> = ({ title, coverImageUrl, onOpenDrawer }) => {
  return (
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
      <IconButton
        onClick={onOpenDrawer}
        aria-label="レッスン一覧を開く"
        sx={{ width: 44, height: 44, flexShrink: 0, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}
      >
        <MenuIcon />
      </IconButton>
      {title && coverImageUrl && (
        <CourseCover src={coverImageUrl} title={title} eager sx={{ width: 88, borderRadius: 1 }} />
      )}
      {title && (
        <Typography variant="h6" component="p" sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
          {title}
        </Typography>
      )}
    </Stack>
  );
};
