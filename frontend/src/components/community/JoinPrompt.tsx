import React from "react";
import { Paper, Typography, Button, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useCommunityAccess } from "../../hooks/useCommunityAccess";

/** Replaces the post input for guests and non-members. */
export const JoinPrompt: React.FC = () => {
  const navigate = useNavigate();
  const { isGuest } = useCommunityAccess();

  return (
    <Paper
      elevation={0}
      sx={{ p: { xs: 2.5, sm: 3 }, mb: 3, borderRadius: 3.5, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
      >
        <Typography color="text.secondary">
          {isGuest
            ? "投稿やコメントは、メンバーになると使えます。まずは無料で登録してみてください。"
            : "投稿やコメントは、メンバーになると使えます。"}
        </Typography>
        {isGuest ? (
          <Stack direction="row" spacing={1} flexShrink={0} flexWrap="wrap" useFlexGap>
            <Button variant="contained" onClick={() => navigate("/register")}>
              無料で登録
            </Button>
            <Button variant="outlined" onClick={() => navigate("/login")}>
              ログイン
            </Button>
          </Stack>
        ) : (
          <Button
            variant="contained"
            sx={{ flexShrink: 0 }}
            onClick={() => navigate("/subscription")}
          >
            メンバーになる
          </Button>
        )}
      </Stack>
    </Paper>
  );
};

export default JoinPrompt;
