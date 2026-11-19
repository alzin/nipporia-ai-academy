import { colors } from "../theme/theme";

// One course theme for every course (the course type / level split was removed).
export const COURSE_THEME = {
  primary: colors.accent,
  secondary: colors.accentHover,
  accent: colors.accentSoft,
} as const;

export const getCourseTheme = (_course?: unknown) => COURSE_THEME;

/** No gradients in this design: returns the flat accent color. */
export const createCourseGradient = (theme: { primary: string; secondary: string }) => theme.primary;
