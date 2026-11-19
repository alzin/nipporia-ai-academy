import React from "react";
import { IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { ChevronLeft, ChevronRight, Close, MenuBook } from "@mui/icons-material";

interface LessonSidebarHeaderProps {
  selectedCourse?: any;
  sidebarCollapsed: boolean;
  /** Kept for compatibility; colors come from the theme. */
  selectedCourseColors: { primary: string; secondary: string };
  setSidebarCollapsed: (v: boolean) => void;
  isMobile: boolean;
  setDrawerOpen?: (v: boolean) => void;
}

const squareButton = { width: 44, height: 44 } as const;

export const LessonSidebarHeader: React.FC<LessonSidebarHeaderProps> = ({
  selectedCourse,
  sidebarCollapsed,
  setSidebarCollapsed,
  isMobile,
  setDrawerOpen,
}) => {
  return (
    <Stack
      direction={sidebarCollapsed ? "column" : "row"}
      justifyContent="space-between"
      alignItems={sidebarCollapsed ? "center" : "flex-start"}
      spacing={sidebarCollapsed ? 0.5 : 1}
      mb={sidebarCollapsed ? 0 : 1.5}
    >
      {sidebarCollapsed && selectedCourse && (
        <Tooltip title={selectedCourse.title} placement="right" arrow>
          <IconButton
            onClick={() => setSidebarCollapsed(false)}
            aria-label={`${selectedCourse.title}のレッスン一覧を開く`}
            sx={{ ...squareButton, color: "primary.dark" }}
          >
            <MenuBook />
          </IconButton>
        </Tooltip>
      )}

      {!sidebarCollapsed && (
        <Typography variant="h6" component="h2" sx={{ fontSize: "1.0625rem", minWidth: 0, overflowWrap: "anywhere", pt: 1 }}>
          {selectedCourse?.title || "講座を選んでください"}
        </Typography>
      )}

      <Stack direction={sidebarCollapsed ? "column" : "row"} spacing={0.5} sx={{ flexShrink: 0 }}>
        {!isMobile && (
          <Tooltip
            title={sidebarCollapsed ? "サイドバーを広げる" : "サイドバーをたたむ"}
            placement={sidebarCollapsed ? "right" : "top"}
            arrow
          >
            <IconButton
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label={sidebarCollapsed ? "サイドバーを広げる" : "サイドバーをたたむ"}
              aria-expanded={!sidebarCollapsed}
              sx={{ ...squareButton, color: "text.secondary" }}
            >
              {sidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
            </IconButton>
          </Tooltip>
        )}
        {isMobile && (
          <IconButton onClick={() => setDrawerOpen?.(false)} aria-label="閉じる" sx={squareButton}>
            <Close />
          </IconButton>
        )}
      </Stack>
    </Stack>
  );
};

export default LessonSidebarHeader;
