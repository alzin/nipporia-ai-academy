// src/pages/CourseDetailPage.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Paper,
  Drawer,
  Button,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";

// Hooks & Utils
import { getCourseColors, getLessonIcon } from "../utils/course-details";
import { useCourseDetails } from "../hooks/useCourseDetails";

// Components
import { LessonSidebar } from "../components/course-details";
import { MobileTopBar } from "../components/course-details/MobileTopBar";
import { LessonView } from "../components/course-details/LessonView";

export const CourseDetailPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // UI State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("sidebarCollapsed") === "true";
  });
  const [progressExpanded, setProgressExpanded] = useState(true);

  // Business Logic from Hook
  const {
    selectedCourse,
    lessons,
    selectedLesson,
    setSelectedLesson,
    enrollments,
    courseProgress,
    lessonLoading,
    completingLesson,
    handleCompleteLesson,
    isAuthenticated,
    navigate,
    activeItemRef,
    lessonsContainerRef,
  } = useCourseDetails();

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Derived Values
  const selectedCourseColors = getCourseColors();
  const isEnrolled = enrollments.some(
    (e: any) => e.courseId === selectedCourse?.id,
  );
  // Progress is shown only to logged-in users
  const showProgress = isAuthenticated && isEnrolled;
  const currentProgress = courseProgress.find(
    (p) => p.courseId === selectedCourse?.id,
  ) || {
    completedLessons: 0,
    totalLessons: 0,
    completionPercentage: 0,
  };

  // Complete the current lesson (logged-in users only) and move to the next one
  const onCompleteInstant = (score?: number) => {
    if (!selectedLesson) return;
    const currentIndex = lessons.findIndex((l) => l.id === selectedLesson.id);
    const nextLesson = currentIndex >= 0 ? lessons[currentIndex + 1] : undefined;

    if (isAuthenticated && !selectedLesson.isLocked) {
      setSelectedLesson({ ...selectedLesson, isCompleted: true });
      handleCompleteLesson(score);
    }

    if (nextLesson) {
      setSelectedLesson(nextLesson);
    }
  };

  const SidebarContent = (
    <>
      <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate("/classroom")}
          aria-label="講座一覧へ戻る"
          color="inherit"
          sx={{
            ...(sidebarCollapsed && {
              minWidth: "auto",
              px: 1,
              "& .MuiButton-startIcon": { mr: 0 },
            }),
          }}
        >
          {!sidebarCollapsed && "講座一覧へ戻る"}
        </Button>
      </Box>
      <LessonSidebar
        selectedCourse={selectedCourse}
        getCourseProgress={() => currentProgress}
        sidebarCollapsed={sidebarCollapsed}
        selectedCourseColors={selectedCourseColors}
        setSidebarCollapsed={setSidebarCollapsed}
        isMobile={isMobile}
        setDrawerOpen={setDrawerOpen}
        isEnrolled={() => showProgress}
        progressExpanded={progressExpanded}
        setProgressExpanded={setProgressExpanded}
        lessonLoading={lessonLoading}
        lessons={lessons}
        selectedLesson={selectedLesson}
        setSelectedLesson={setSelectedLesson}
        getLessonTypeIcon={getLessonIcon}
        navigate={navigate}
        activeItemRef={activeItemRef}
        lessonsContainerRef={lessonsContainerRef}
      />
    </>
  );

  return (
    <Box
      sx={{
        display: "flex",
        height: "calc(100vh - 64px)",
        bgcolor: "background.default",
      }}
    >
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Paper
          component="nav"
          aria-label="レッスン一覧"
          sx={{
            width: sidebarCollapsed ? 80 : 380,
            flexShrink: 0,
            borderRadius: 0,
            borderRight: "1px solid",
            borderColor: "divider",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            transition: "width 0.3s ease-in-out",
          }}
        >
          {SidebarContent}
        </Paper>
      )}

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          display: { md: "none" },
          "& .MuiDrawer-paper": { width: { xs: "88vw", sm: 380 }, maxWidth: 380 },
        }}
      >
        <Box sx={{ pt: "70px" }}>{SidebarContent}</Box>
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, overflowY: "auto" }}>
        <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
          {isMobile && (
            <MobileTopBar
              title={selectedCourse?.title}
              onOpenDrawer={() => setDrawerOpen(true)}
            />
          )}

          <LessonView
            selectedLesson={selectedLesson}
            selectedCourse={selectedCourse}
            onComplete={onCompleteInstant}
            canComplete={isAuthenticated}
            isLoadingNextLesson={completingLesson}
          />
        </Container>
      </Box>

    </Box>
  );
};
