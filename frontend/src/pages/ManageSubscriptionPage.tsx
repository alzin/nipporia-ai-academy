// frontend/src/pages/ManageSubscriptionPage.tsx
import React from "react";
import {
  Box,
  Container,
  Typography,
  Breadcrumbs,
  Link as MuiLink,
  Stack,
  Button,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { NavigateNext, AdminPanelSettings, ArrowBack } from "@mui/icons-material";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { SubscriptionManagement } from "../components/subscription/SubscriptionManagement";
import { colors } from "../theme/theme";

export const ManageSubscriptionPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  // Admin-specific state — show a clear message instead of silent redirect
  if (user?.role === "ADMIN") {
    return (
      <Box sx={{ bgcolor: "background.default", py: 3 }}>
        <Container maxWidth="sm">
          <Stack
            alignItems="center"
            spacing={2.5}
            sx={{
              mt: { xs: 6, md: 12 },
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: colors.accentSoft,
                color: colors.accentHover,
              }}
            >
              <AdminPanelSettings aria-hidden sx={{ fontSize: 36 }} />
            </Box>
            <Typography variant="h5" component="h1">
              サブスクリプションは不要です
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 380 }}
            >
              管理者のアカウントは、はじめからすべての機能を使えます。サブスクリプションは受講者のアカウント向けです。
            </Typography>
            <Button
              variant="outlined"
              startIcon={<ArrowBack aria-hidden sx={{ fontSize: 18 }} />}
              onClick={() => navigate("/dashboard")}
              sx={{ mt: 1 }}
            >
              ホームに戻る
            </Button>
          </Stack>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "background.default", py: 3 }}>
      <Container maxWidth="lg">
        <Breadcrumbs
          aria-label="現在の場所"
          separator={<NavigateNext fontSize="small" />}
          sx={{ mb: 3 }}
        >
          <MuiLink
            component={Link}
            to="/dashboard"
            sx={{
              fontSize: "0.875rem",
              display: "inline-flex",
              alignItems: "center",
              minHeight: 44,
            }}
          >
            ホーム
          </MuiLink>
          <Typography
            color="text.primary"
            aria-current="page"
            sx={{ fontSize: "0.875rem", fontWeight: 700 }}
          >
            サブスクリプション管理
          </Typography>
        </Breadcrumbs>

        <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
          サブスクリプション管理
        </Typography>

        <SubscriptionManagement />
      </Container>
    </Box>
  );
};
