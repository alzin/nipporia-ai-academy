import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { CircularProgress, Box } from '@mui/material';

import { theme } from './theme/theme';

import { store, RootState, AppDispatch } from './store/store';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { checkPayment, checkAuth } from './store/slices/authSlice';
import { fetchDashboardData } from './store/slices/dashboardSlice';

// Auth Pages
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { RegistrationPage } from './pages/RegistrationPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';

// Admin Pages
import { Analytics } from './pages/admin/Analytics';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserManagement } from './pages/admin/UserManagement';
import { CourseManagement } from './pages/admin/CourseManagement';
import { CommunityModeration } from './pages/admin/CommunityModeration';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { ClassroomPage } from './pages/ClassroomPage';
import { CommunityPage } from './pages/CommunityPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { CommerceDisclosurePage } from './pages/CommerceDisclosurePage';
import { SubscriptionPage } from './pages/SubscriptionPage';

// Components
import { Layout } from './components/layout/Layout';
import { ProtectedRoute, GuestAllowedRoute } from './components/common/ProtectedRoute';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { AdminCourseDetailPage } from './pages/admin/AdminCourseDetailPage';
import { AdminVideoPage } from './pages/admin/AdminVideoPage';
import { SubscriptionSuccessPage } from './pages/SubscriptionSuccessPage';
import { ManageSubscriptionPage } from './pages/ManageSubscriptionPage';


function AppContent() {
  const dispatch = useDispatch<AppDispatch>();
  const { authChecking, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Never block on auth: if the check fails, the visitor continues as a guest.
    const initApp = async () => {
      const result = await dispatch(checkAuth());
      const payload = result.payload as { authenticated?: boolean } | undefined;
      if (payload?.authenticated) {
        await dispatch(checkPayment());
        dispatch(fetchDashboardData());
      }
      setInitializing(false);
    };

    initApp();
  }, [dispatch]);

  if (initializing || authChecking) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Router>
      <Routes>

        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/register/verify" element={<VerifyEmailPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route
          path="/subscription"
          element={
            isAuthenticated ? (
              <SubscriptionPage />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/subscription/success"
          element={
            isAuthenticated ? (
              <SubscriptionSuccessPage />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />

        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* User Routes */}
        <Route
          path="/dashboard"
          element={
            <GuestAllowedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </GuestAllowedRoute>
          }
        />
        <Route
          path="/classroom"
          element={
            <GuestAllowedRoute>
              <Layout>
                <ClassroomPage />
              </Layout>
            </GuestAllowedRoute>
          }
        />

        <Route
          path="/classroom/course/:courseId"
          element={
            <GuestAllowedRoute>
              <Layout>
                <CourseDetailPage />
              </Layout>
            </GuestAllowedRoute>
          }
        />
        <Route
          path="/community"
          element={
            <GuestAllowedRoute>
              <Layout>
                <CommunityPage />
              </Layout>
            </GuestAllowedRoute>
          }
        />

        <Route
          path="/manage-subscription"
          element={
            <ProtectedRoute>
              <Layout>
                <ManageSubscriptionPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <Layout>
                <AdminDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <Layout>
                <UserManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/courses"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <Layout>
                <CourseManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path='/admin/videos'
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <Layout>
                <AdminVideoPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/courses/:courseId"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <Layout>
                <AdminCourseDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/community"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <Layout>
                <CommunityModeration />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <Layout>
                <Analytics />
              </Layout>
            </ProtectedRoute>
          }
        />


        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/tokushoho" element={<CommerceDisclosurePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}


function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppContent />
      </ThemeProvider>
    </Provider>
  );
}

export default App;