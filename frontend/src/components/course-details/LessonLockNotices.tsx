import React from "react";
import { Paper, Typography, Button, Stack } from "@mui/material";
import { LockOutlined } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";

/**
 * Shown instead of the content of a locked lesson.
 * Guests are asked to register or log in; logged-in non-members to become members.
 */
export const LessonLockNotices: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  return (
    <Paper
      variant="outlined"
      sx={{
        textAlign: "center",
        py: { xs: 4, sm: 6 },
        px: { xs: 2, sm: 3 },
        borderRadius: "14px",
        bgcolor: "background.paper",
      }}
    >
      <LockOutlined sx={{ fontSize: 40, color: "text.secondary", mb: 1.5 }} aria-hidden />
      <Typography variant="h6" component="h2" gutterBottom>
        このレッスンはメンバー限定です
      </Typography>

      {isAuthenticated ? (
        <>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            メンバーになると、すべてのレッスンを見られます。
          </Typography>
          <Button variant="contained" size="large" onClick={() => navigate("/subscription")}>
            メンバーになる
          </Button>
        </>
      ) : (
        <>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            メンバーになると、すべてのレッスンを見られます。まずは無料で登録するか、ログインしてください。
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="center">
            <Button variant="contained" size="large" onClick={() => navigate("/register")}>
              無料で登録
            </Button>
            <Button variant="outlined" size="large" onClick={() => navigate("/login")}>
              ログイン
            </Button>
          </Stack>
        </>
      )}
    </Paper>
  );
};
