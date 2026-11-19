import React, { useState, useEffect } from "react";
import { Container, useMediaQuery, useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Course, CourseProgress } from "../types/course.types";
import { ClassroomService } from "../services/classroom.service";
import { ClassroomHeader } from "../components/classroom/ClassroomHeader";
import { CourseGrid } from "../components/classroom/CourseGrid";
import { RootState } from "../store/store";

export const ClassroomPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<string[]>([]);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const coursesData = await ClassroomService.getCourses();
        setCourses(coursesData);

        // Progress is only available for logged-in users
        if (isAuthenticated) {
          try {
            const enrollmentsData = await ClassroomService.getEnrollments();
            setEnrollments(enrollmentsData.map((e: any) => e.courseId));
            const progressData = await Promise.all(
              enrollmentsData.map((e: any) => ClassroomService.getCourseProgress(e.courseId))
            );
            setCourseProgress(progressData);
          } catch {
            // progress is optional
          }
        }
      } catch (err) {
        setError("講座を読み込めませんでした。");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isAuthenticated]);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <ClassroomHeader />

      <CourseGrid
        courses={courses}
        loading={loading}
        error={error}
        enrollments={enrollments}
        progressData={courseProgress}
        onCourseClick={(course) => navigate(`/classroom/course/${course.id}`)}
        isMobile={isMobile}
      />
    </Container>
  );
};
