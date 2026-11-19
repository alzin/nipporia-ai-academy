import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import api from "../services/api";
import { fetchDashboardData } from "../store/slices/dashboardSlice";
import { AppDispatch, RootState } from "../store/store";
import { Course, Lesson, Enrollment, CourseProgress } from "../types/course-details.types";

export const useCourseDetails = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  // Data State
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [rawLessons, setRawLessons] = useState<Lesson[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  // Loading State
  const [loading, setLoading] = useState(true);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [completingLesson, setCompletingLesson] = useState(false);
  const [error, setError] = useState<string | null>(null);

  
  // Ref to store the active DOM node
  const activeNodeRef = useRef<HTMLLIElement | null>(null);
  // Ref for the scrollable lessons list container
  const lessonsContainerRef = useRef<HTMLDivElement | null>(null);
  // Timeout ref for scroll debouncing and cleanup
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Callback ref that scrolls the active lesson into view whenever it mounts or changes
  const activeItemRef = useCallback((node: HTMLLIElement | null) => {
    activeNodeRef.current = node;

    // Clear any pending scroll
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }

    if (!node) return;

    // Delay to ensure container ref is assigned and framer-motion animations settle
    scrollTimeoutRef.current = setTimeout(() => {
      if (!node.isConnected) return;

      const container = lessonsContainerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const itemRect = node.getBoundingClientRect();
      const itemTopRelative =
        itemRect.top - containerRect.top + container.scrollTop;
      const scrollTarget =
        itemTopRelative - container.clientHeight / 2 + itemRect.height / 2;

      container.scrollTo({
        top: Math.max(0, scrollTarget),
        behavior: "smooth",
      });
    }, 150);
  }, []);

  // Cleanup scroll timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // 1. Lessons sorted by order. Locks come from the server (`isLocked`).
  const lessons = useMemo(() => {
    return [...rawLessons].sort((a, b) => a.order - b.order);
  }, [rawLessons]);

  const selectedLesson = useMemo(() => {
    return lessons.find((l) => l.id === selectedLessonId) || null;
  }, [lessons, selectedLessonId]);

  // 2. STABLE FETCH with ABORT SIGNAL
  const fetchLessons = useCallback(async (cId: string, signal?: AbortSignal) => {
    if (!cId) return;
    try {
      setLessonLoading(true);
      // Pass the signal to axios/api
      const response = await api.get(`/courses/${cId}/lessons`, { signal });
      setRawLessons(response.data);
    } catch (err: any) {
      // Ignore errors caused by cancellation
      if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
        console.error("Failed to fetch lessons", err);
      }
    } finally {
      setLessonLoading(false);
    }
  }, []);

  // 3. MASTER USE EFFECT (Handles Initial Load & Cleanup)
  useEffect(() => {
    if (!courseId) return;

    // Create a controller for this specific effect run
    const controller = new AbortController();

    const initData = async () => {
      try {
        setLoading(true);

        const courseRes = await api.get(`/courses/${courseId}`, { signal: controller.signal });
        setSelectedCourse(courseRes.data);

        // Enrollment only exists for logged-in users. Opening a course enrolls silently.
        if (isAuthenticated) {
          try {
            const enrollmentsRes = await api.get("/courses/my-enrollments", { signal: controller.signal });
            let list: Enrollment[] = enrollmentsRes.data;
            if (!list.some((e) => e.courseId === courseId)) {
              try {
                await api.post(`/courses/${courseId}/enroll`);
                const again = await api.get("/courses/my-enrollments", { signal: controller.signal });
                list = again.data;
              } catch {
                // already enrolled or not allowed; lessons still load
              }
            }
            setEnrollments(list);
          } catch (err: any) {
            if (err.name === "CanceledError" || err.code === "ERR_CANCELED") throw err;
          }
        }

        // Fetch Lessons (progress will be calculated in separate effect)
        await fetchLessons(courseId, controller.signal);

      } catch (err: any) {
        if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
          setError("講座を読み込めませんでした。");
        }
      } finally {
        // Only turn off loading if we weren't cancelled
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    initData();

    // CLEANUP FUNCTION: This runs if the component unmounts OR runs again
    // This cancels the previous request immediately.
    return () => {
      controller.abort();
    };
  }, [courseId, fetchLessons, isAuthenticated]);

  // 4. Calculate progress whenever lessons change
  useEffect(() => {
    if (!courseId || rawLessons.length === 0) return;

    const completedLessons = rawLessons.filter((l) => l.isCompleted).length;
    const totalLessons = rawLessons.length;
    const completionPercentage = totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;

    setCourseProgress([
      {
        courseId,
        completedLessons,
        totalLessons,
        completionPercentage,
      },
    ]);
  }, [courseId, rawLessons]);

  // 5. Auto-select logic (Remains the same)
  useEffect(() => {
    if (lessons.length > 0 && !selectedLessonId) {
      const next = lessons.find((l) => !l.isCompleted && !l.isLocked);
      const first = lessons.find((l) => l.order === 1);
      const target = next || first;
      if (target) setSelectedLessonId(target.id);
    }
  }, [lessons, selectedLessonId]);

  const handleCompleteLesson = async (quizScore?: number) => {
    // Guests can't save progress; locked lessons can't be completed.
    if (!isAuthenticated || !selectedLesson || !selectedCourse || selectedLesson.isLocked) return;
    try {
      setCompletingLesson(true);
      await api.post(`/courses/lessons/${selectedLesson.id}/complete`, { quizScore });

      // Refresh without signal (user action, not effect)
      await fetchLessons(selectedCourse.id);
      dispatch(fetchDashboardData());
    } catch (err) {
      console.error(err);
    } finally {
      setCompletingLesson(false);
    }
  };

  return {
    selectedCourse,
    lessons,
    selectedLesson,
    setSelectedLesson: (l: Lesson) => setSelectedLessonId(l.id),
    enrollments,
    courseProgress,
    loading,
    lessonLoading,
    completingLesson,
    error,
    activeItemRef,
    lessonsContainerRef,
    handleCompleteLesson,
    isAuthenticated,
    navigate
  };
};