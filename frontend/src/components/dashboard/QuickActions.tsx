import React from "react";
import { Card, CardContent, Typography, List, ListItemButton, ListItemText, Divider } from "@mui/material";
import { ChevronRight } from "@mui/icons-material";
import { CourseProgress } from "../../services/dashboardService";

interface QuickActionsProps {
  courseProgress: CourseProgress[];
  onNavigate: (path: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ courseProgress, onNavigate }) => {
  const hasProgress = courseProgress && courseProgress.length > 0;

  const items = [
    {
      key: "learn",
      primary: "学習を続ける",
      secondary: hasProgress
        ? `「${courseProgress[0].courseTitle}」の続きから`
        : "最初のレッスンを見てみましょう",
      path: "/classroom",
    },
    {
      key: "community",
      primary: "コミュニティ",
      secondary: "質問や気づきを共有できます",
      path: "/community",
    },
  ];

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 }, "&:last-child": { pb: { xs: 1, sm: 1.5 } } }}>
        <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
          次にすること
        </Typography>
        <List disablePadding>
          {items.map((item, index) => (
            <React.Fragment key={item.key}>
              {index > 0 && <Divider component="li" />}
              <ListItemButton
                onClick={() => onNavigate(item.path)}
                sx={{ px: 1, py: 1.25, minHeight: 56, borderRadius: 1 }}
              >
                <ListItemText
                  primary={item.primary}
                  secondary={item.secondary}
                  slotProps={{
                    primary: { sx: { fontWeight: 700 } },
                    secondary: { sx: { overflowWrap: "anywhere" } },
                  }}
                />
                <ChevronRight sx={{ color: "text.secondary", ml: 1 }} aria-hidden />
              </ListItemButton>
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};
