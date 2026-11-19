import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";

import { Container, Grid, Alert, IconButton, Typography, useMediaQuery, useTheme } from "@mui/material";
import { Refresh } from "@mui/icons-material";

import { RootState, AppDispatch } from "../store/store";
import { fetchDashboardData } from "../store/slices/dashboardSlice";
import {
  WelcomeSection,
  StatsGrid,
  ProgressSection,
  QuickActions,
} from "../components/dashboard";
import { CourseGrid } from "../components/classroom/CourseGrid";
import { ClassroomService } from "../services/classroom.service";
import { Course } from "../types/course.types";

const GRID_SIZES = {
  MAIN_CONTENT: { xs: 12, md: 8 },
  SIDEBAR: { xs: 12, md: 4 },
} as const;

/** Guests: welcome text and the course list, no progress. */
const GuestDashboard: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ClassroomService.getCourses()
      .then(setCourses)
      .catch(() => setError("講座を読み込めませんでした。"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
      <WelcomeSection isGuest />
      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
        講座
      </Typography>
      <CourseGrid
        courses={courses}
        loading={loading}
        error={error}
        enrollments={[]}
        progressData={[]}
        onCourseClick={(course) => navigate(`/classroom/course/${course.id}`)}
        isMobile={isMobile}
      />
    </Container>
  );
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  const {
    data: dashboardData,
    loading,
    error,
  } = useSelector((state: RootState) => state.dashboard);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchDashboardData());
    }
  }, [dispatch, isAuthenticated]);

  const handleRefresh = () => {
    dispatch(fetchDashboardData());
  };

  if (!isAuthenticated) {
    return <GuestDashboard />;
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert
          severity="error"
          action={
            <IconButton color="inherit" onClick={handleRefresh} aria-label="もう一度読み込む" sx={{ width: 44, height: 44 }}>
              <Refresh />
            </IconButton>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
      {/* Welcome Section */}
      <WelcomeSection
        userName={dashboardData?.user?.name}
        userEmail={dashboardData?.user?.email}
        onRefresh={handleRefresh}
      />

      {/* Stats Grid */}
      <StatsGrid
        stats={{
          totalLessonsCompleted:
            dashboardData?.stats?.totalLessonsCompleted || 0,
          totalLessonsAvailable:
            dashboardData?.stats?.totalLessonsAvailable || 0,
          communityPostsCount: dashboardData?.stats?.communityPostsCount || 0,
        }}
        loading={loading}
        onNavigate={navigate}
      />

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        <Grid size={GRID_SIZES.MAIN_CONTENT}>
          <ProgressSection
            courseProgress={dashboardData?.courseProgress || []}
            recentActivity={dashboardData?.recentActivity || []}
            loading={loading}
          />
        </Grid>

        <Grid size={GRID_SIZES.SIDEBAR}>
          <QuickActions
            courseProgress={dashboardData?.courseProgress || []}
            onNavigate={navigate}
          />
        </Grid>
      </Grid>
    </Container>
  );
};
