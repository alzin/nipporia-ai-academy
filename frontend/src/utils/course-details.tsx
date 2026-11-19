import {
  VideoLibrary,
  PictureAsPdf,
  School,
  Quiz as QuizIcon,
  Slideshow,
} from "@mui/icons-material";
import { COURSE_THEME } from "./theme.utils";

export const getCourseColors = (_course?: unknown) => COURSE_THEME;

export const getLessonIcon = (
  lessonType: string,
  size: "small" | "medium" = "medium"
) => {
  const props = { sx: { fontSize: size === "small" ? 18 : 24 } };
  switch (lessonType) {
    case "VIDEO":
      return <VideoLibrary {...props} />;
    case "PDF":
      return <PictureAsPdf {...props} />;
    case "QUIZ":
      return <QuizIcon {...props} />;
    case "SLIDES":
      return <Slideshow {...props} />;
    default:
      return <School {...props} />;
  }
};
