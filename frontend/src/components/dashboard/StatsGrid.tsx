import React from "react";
import { Grid } from "@mui/material";
import { School, Forum } from "@mui/icons-material";
import { StatCard } from "./StatCard";

interface StatsData {
  totalLessonsCompleted: number;
  totalLessonsAvailable: number;
  communityPostsCount: number;
}

interface StatsGridProps {
  stats: StatsData;
  loading: boolean;
  onNavigate: (path: string) => void;
}

const GRID_SIZES = {
  STATS: { xs: 12, sm: 6 },
} as const;

export const StatsGrid: React.FC<StatsGridProps> = ({ stats, loading, onNavigate }) => {
  const statCards = [
    {
      icon: <School />,
      title: "完了したレッスン",
      value: `${stats.totalLessonsCompleted} / ${stats.totalLessonsAvailable}`,
      onClick: () => onNavigate("/classroom"),
    },
    {
      icon: <Forum />,
      title: "コミュニティへの投稿",
      value: stats.communityPostsCount,
      onClick: () => onNavigate("/community"),
    },
  ];

  return (
    <Grid container spacing={2} sx={{ mb: { xs: 3, md: 4 } }}>
      {statCards.map((stat) => (
        <Grid size={GRID_SIZES.STATS} key={stat.title}>
          <StatCard {...stat} loading={loading} />
        </Grid>
      ))}
    </Grid>
  );
};
