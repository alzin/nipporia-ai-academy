import React from "react";
import { Box, Typography } from "@mui/material";

export const ClassroomHeader = () => (
  <Box component="header" sx={{ mb: { xs: 3, md: 5 } }}>
    <Typography variant="h3" component="h1" sx={{ mb: 1 }}>
      講座
    </Typography>
    <Typography variant="body1" color="text.secondary" sx={{ maxWidth: "36em" }}>
      AI ツールの使い方を、短い動画で学べます。
    </Typography>
  </Box>
);
