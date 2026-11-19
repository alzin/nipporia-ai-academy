// frontend/src/pages/LoginPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Link,
  Stack,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { login, clearError, checkPayment } from '../store/slices/authSlice';
import { fetchDashboardData } from '../store/slices/dashboardSlice';
import { AppDispatch, RootState } from '../store/store';
import { AuthLayout } from '../components/layout/AuthLayout';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, loading, error } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await dispatch(login(formData));

    if (login.fulfilled.match(result)) {
      await dispatch(checkPayment());
      dispatch(fetchDashboardData());
      navigate('/dashboard');
    }
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
    if (error) {
      dispatch(clearError());
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
    dispatch(clearError());
  }, [isAuthenticated, navigate, dispatch]);

  return (
    <AuthLayout>
      <Card>
        <CardContent sx={{ px: { xs: 2.5, sm: 5 }, py: { xs: 4, sm: 5 } }}>
          <Box mb={4}>
            <Typography component="h1" variant="h4" gutterBottom>
              ログイン
            </Typography>
            <Typography variant="body1" color="text.secondary">
              登録したメールアドレスとパスワードを入力してください。
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} role="alert">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} noValidate={false}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="メールアドレス"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange('email')}
                required
              />

              <TextField
                fullWidth
                label="パスワード"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange('password')}
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示する'}
                        sx={{ width: 44, height: 44 }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" aria-label="ログインしています" />
                ) : (
                  'ログイン'
                )}
              </Button>
            </Stack>
          </form>

          <Box mt={2}>
            <Link
              component={RouterLink}
              to="/forgot-password"
              sx={{ display: 'inline-flex', alignItems: 'center', minHeight: 44 }}
            >
              パスワードを忘れた方
            </Link>
          </Box>

          <Box mt={3} pt={3} sx={{ borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              アカウントをまだお持ちでない方
            </Typography>
            <Button
              component={RouterLink}
              to="/register"
              variant="outlined"
              color="primary"
              fullWidth
              sx={{ mt: 1 }}
            >
              無料で登録
            </Button>
          </Box>
        </CardContent>
      </Card>
    </AuthLayout>
  );
};
