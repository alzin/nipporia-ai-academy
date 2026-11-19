import React from "react";
import { Add, ArrowBack } from "@mui/icons-material";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Course } from "../../services/courseService";

interface ICourseDetailHeaderProps {
  isMobile: boolean;
  selectedCourse: Course | null;
  handleAddNewLesson: () => void;
}

export const CourseDetailHeader = ({
  isMobile,
  selectedCourse,
  handleAddNewLesson,
}: ICourseDetailHeaderProps) => {
  const navigate = useNavigate();
  return (
    <Stack
      direction={isMobile ? "column" : "row"}
      justifyContent="space-between"
      alignItems="center"
      gap={2}
      mb={4}
    >
      <Box>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate("/admin/courses")}
          sx={{ mb: 1 }}
        >
          講座の一覧に戻る
        </Button>
        <Typography variant="h4" fontWeight={700}>
          {selectedCourse?.title}
        </Typography>
      </Box>
      <Button
        variant="contained"
        startIcon={<Add />}
        onClick={handleAddNewLesson}
      >
        レッスンを追加
      </Button>
    </Stack>
  );
};
