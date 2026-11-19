// frontend/src/components/common/ProtectedRoute.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { Box, CircularProgress } from "@mui/material";

interface ProtectedRouteProps {
  children: React.ReactElement;
  requiredRole?: string;
}

/**
 * Requires a logged-in user (and optionally a role).
 * Pages that guests may view don't use this; see GuestAllowedRoute.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const location = useLocation();
  const { isAuthenticated, user, authChecking } = useSelector(
    (state: RootState) => state.auth
  );

  if (authChecking) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

/** Viewable by everyone, guests included. Waits for the first auth check only. */
export const GuestAllowedRoute: React.FC<{ children: React.ReactElement }> = ({
  children,
}) => {
  const authChecking = useSelector((state: RootState) => state.auth.authChecking);

  if (authChecking) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return <>{children}</>;
};
