import React from "react";
import { Tabs, Tab } from "@mui/material";
import {
  Campaign,
  People,
  Feedback as FeedbackIcon,
} from "@mui/icons-material";

interface CommunityTabsProps {
  value: number;
  onChange: (event: React.SyntheticEvent, newValue: number) => void;
  /** Feedback needs login to read */
  showFeedback?: boolean;
}

export const CommunityTabs: React.FC<CommunityTabsProps> = ({
  value,
  onChange,
  showFeedback = true,
}) => {
  return (
    <Tabs
      value={value}
      onChange={onChange}
      sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
      variant="scrollable"
      scrollButtons="auto"
      allowScrollButtonsMobile
      aria-label="コミュニティのタブ"
    >
      <Tab label="お知らせ" icon={<Campaign />} iconPosition="start" />
      <Tab label="みんなの投稿" icon={<People />} iconPosition="start" />
      {showFeedback && (
        <Tab
          label="質問・フィードバック"
          icon={<FeedbackIcon />}
          iconPosition="start"
        />
      )}
    </Tabs>
  );
};

export default CommunityTabs;
