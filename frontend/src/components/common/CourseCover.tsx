import React, { useEffect, useState } from "react";
import { Box, SxProps, Theme } from "@mui/material";
import { colors } from "../../theme/theme";

interface CourseCoverProps {
  /** Cover image URL. When empty (or the image fails to load) nothing is rendered, so callers keep their usual look. */
  src?: string | null;
  /** Used as the alt text: the course title. */
  title: string;
  /** Load right away (true) or when scrolled near (false). */
  eager?: boolean;
  sx?: SxProps<Theme>;
}

/**
 * A course's main cover image in a fixed 16:9 box. The box keeps its space while
 * the image loads, so the layout does not shift.
 */
export const CourseCover: React.FC<CourseCoverProps> = ({ src, title, eager = false, sx }) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) return null;

  return (
    <Box
      sx={[
        {
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 9",
          overflow: "hidden",
          bgcolor: colors.accentSoft,
          flexShrink: 0,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box
        component="img"
        src={src}
        alt={title}
        width={1600}
        height={900}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onError={() => setFailed(true)}
        sx={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
    </Box>
  );
};

export default CourseCover;
