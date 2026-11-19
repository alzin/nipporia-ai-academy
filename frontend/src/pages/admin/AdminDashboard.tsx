import React, { useCallback, useState } from "react";
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  People,
  School,
  Forum,
  VideoLibrary,
  ExpandMore,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { activityService } from "../../services/activityService";
import { ActivityFeed } from "../../components/activity/ActivityFeed";

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [globalActivities, setGlobalActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activityExpanded, setActivityExpanded] = useState(false);

  const fetchGlobalActivities = useCallback(async () => {
    setActivitiesLoading(true);
    try {
      const response = await activityService.getGlobalActivities(10);
      setGlobalActivities(response.activities);
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    } finally {
      setActivitiesLoading(false);
    }
  }, []);

  const handleActivityAccordionChange = (
    _event: React.SyntheticEvent,
    isExpanded: boolean,
  ) => {
    setActivityExpanded(isExpanded);

    if (isExpanded && !activitiesLoading) {
      void fetchGlobalActivities();
    }
  };

  const quickActions = [
    {
      title: "ユーザー管理",
      description: "登録しているユーザーの確認と管理",
      icon: <People />,
      path: "/admin/users",
    },
    {
      title: "講座の管理",
      description: "講座とレッスンの作成・編集",
      icon: <School />,
      path: "/admin/courses",
    },
    {
      title: "紹介動画の管理",
      description: "ツアー動画の追加・編集",
      icon: <VideoLibrary />,
      path: "/admin/videos",
    },
    {
      title: "コミュニティの管理",
      description: "投稿とコメントの確認",
      icon: <Forum />,
      path: "/admin/community",
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
      <Box mb={4}>
        <Typography variant="h3" fontWeight={700}>
          管理画面
        </Typography>
        <Typography variant="body1" color="text.secondary">
          講座やユーザー、コミュニティをここから管理します。
        </Typography>
      </Box>

      <Grid container spacing={3} mb={4}>
        {quickActions.map((action, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4 }} key={action.path}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Paper
                sx={{
                  p: 3,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 4,
                  },
                }}
                onClick={() => navigate(action.path)}
              >
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: "action.hover",
                    color: "primary.main",
                    display: "inline-flex",
                    mb: 2,
                  }}
                >
                  {action.icon}
                </Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {action.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ flexGrow: 1 }}
                >
                  {action.description}
                </Typography>
              </Paper>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: quickActions.length * 0.1 }}
      >
        <Accordion
          expanded={activityExpanded}
          onChange={handleActivityAccordionChange}
          disableGutters
          sx={{
            borderRadius: 2,
            overflow: "hidden",
            "&:before": { display: "none" },
            width: { xs: "100%", md: "50%" },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMore />}
            sx={{ px: { xs: 2, sm: 3 }, py: 0.5 }}
          >
            <Typography variant="h6" fontWeight={600}>
              最近のアクティビティ
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <Card elevation={0} sx={{ borderRadius: 0 }}>
              <CardContent sx={{ pt: 0 }}>
                <ActivityFeed
                  activities={globalActivities}
                  loading={activitiesLoading}
                  showUser
                  compact
                  maxItems={100}
                />
              </CardContent>
            </Card>
          </AccordionDetails>
        </Accordion>
      </motion.div>
    </Container>
  );
};
