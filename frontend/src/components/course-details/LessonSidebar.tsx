import { Box } from "@mui/material";
import React from "react";

import { LessonSidebarHeader } from "./LessonSidebarHeader";
import { CollapsedProgressCard } from "./CollapsedProgressCard";
import { ExpandedProgressCard } from "./ExpandedProgressCard";
import { LessonsList } from "./LessonsList";
import { CourseCover } from "../common/CourseCover";

interface LessonSidebarProps {
  selectedCourse?: any;
  getCourseProgress?: (id: string) => any;
  sidebarCollapsed: boolean;
  selectedCourseColors: { primary: string; secondary: string };
  setSidebarCollapsed: (v: boolean) => void;
  isMobile: boolean;
  setDrawerOpen?: (v: boolean) => void;
  isEnrolled: (id: string) => boolean;
  progressExpanded: boolean;
  setProgressExpanded: (v: boolean) => void;
  lessonLoading: boolean;
  lessons: any[];
  selectedLesson?: any;
  setSelectedLesson: (lesson: any) => void;
  getLessonTypeIcon: (
    lessonType: string,
    size: "small" | "medium"
  ) => React.ReactNode;
  navigate: (path: string) => void;
  activeItemRef: React.RefCallback<HTMLLIElement>;
  lessonsContainerRef: React.RefObject<HTMLDivElement | null>;
}

export const LessonSidebar: React.FC<LessonSidebarProps> = ({
  selectedCourse,
  getCourseProgress,
  sidebarCollapsed,
  selectedCourseColors,
  setSidebarCollapsed,
  isMobile,
  setDrawerOpen,
  isEnrolled,
  progressExpanded,
  setProgressExpanded,
  lessonLoading,
  lessons,
  selectedLesson,
  setSelectedLesson,
  getLessonTypeIcon,
  navigate,
  activeItemRef,
  lessonsContainerRef,
}) => {
  const currentProgress = selectedCourse
    ? getCourseProgress?.(selectedCourse.id)
    : null;

  return (
    <Box sx={{ flexGrow: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Header with collapse toggle */}
      <Box
        sx={{
          p: sidebarCollapsed ? 1 : 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          transition: "padding 0.3s ease-in-out",
        }}
      >
        <LessonSidebarHeader
          selectedCourse={selectedCourse}
          sidebarCollapsed={sidebarCollapsed}
          selectedCourseColors={selectedCourseColors}
          setSidebarCollapsed={setSidebarCollapsed}
          isMobile={isMobile}
          setDrawerOpen={setDrawerOpen}
        />

        {/* Course cover (only when the course has one) */}
        {!sidebarCollapsed && selectedCourse && (
          <CourseCover
            src={selectedCourse.coverImageUrl}
            title={selectedCourse.title}
            eager
            sx={{ borderRadius: 1, mb: 1.5 }}
          />
        )}

        {/* Collapsed Progress Indicator */}
        {sidebarCollapsed &&
          selectedCourse &&
          isEnrolled(selectedCourse.id) &&
          currentProgress && (
            <CollapsedProgressCard
              selectedCourse={selectedCourse}
              selectedCourseColors={selectedCourseColors}
              currentProgress={currentProgress}
              setSidebarCollapsed={setSidebarCollapsed}
            />
          )}

        {/* Expanded Course Progress */}
        {selectedCourse &&
          isEnrolled(selectedCourse.id) &&
          currentProgress &&
          !sidebarCollapsed && (
            <ExpandedProgressCard
              currentProgress={currentProgress}
              progressExpanded={progressExpanded}
              setProgressExpanded={setProgressExpanded}
              selectedCourseColors={selectedCourseColors}
            />
          )}
      </Box>

      {/* Lessons List */}
      <Box
        ref={lessonsContainerRef}
        sx={{ flexGrow: 1, overflowY: "auto", p: sidebarCollapsed ? 0.5 : 2 }}
      >
        <LessonsList
          lessonLoading={lessonLoading}
          lessons={lessons}
          sidebarCollapsed={sidebarCollapsed}
          selectedCourse={selectedCourse}
          selectedCourseColors={selectedCourseColors}
          selectedLesson={selectedLesson}
          setSelectedLesson={setSelectedLesson}
          isMobile={isMobile}
          setDrawerOpen={setDrawerOpen}
          getLessonTypeIcon={getLessonTypeIcon}
          navigate={navigate}
          activeItemRef={activeItemRef}
        />
      </Box>
    </Box>
  );
};
