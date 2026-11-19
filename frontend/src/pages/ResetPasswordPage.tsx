import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
    Stack,
    Collapse,
    IconButton,
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    CheckCircle,
    ErrorOutline,
    RadioButtonUnchecked,
} from '@mui/icons-material';
import api from '../services/api';
import { AuthLayout } from '../components/layout/AuthLayout';
import { authErrorFrom } from '../utils/authErrors';

const cardContentSx = { px: { xs: 2.5, sm: 5 }, py: { xs: 4, sm: 5 } };

export const ResetPasswordPage: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false,
        hasMinLength: false,
    });

    // Get token from URL
    const getTokenFromUrl = () => {
        const params = new URLSearchParams(window.location.search);
        return params.get('token');
    };

    // Validate token on mount
    useEffect(() => {
        const validateToken = async () => {
            const token = getTokenFromUrl();
            if (!token) {
                setError('リンクが正しくありません。メールのリンクをもう一度開いてください。');
                setValidating(false);
                return;
            }

            try {
                const data = await api.get(`/auth/reset-password/validate/${token}`);

                if (data.data.valid) {
                    setTokenValid(true);
                    setEmail(data.data.email);
                } else {
                    setError(
                        authErrorFrom(
                            { message: data.data.error },
                            'このリンクは使えなくなっています。もう一度パスワードの再設定を申し込んでください。',
                        ),
                    );
                }
            } catch (err) {
                setError('リンクを確かめられませんでした。もう一度お試しください。');
            } finally {
                setValidating(false);
            }
        };

        validateToken();
    }, []);

    // Check password strength
    useEffect(() => {
        setPasswordStrength({
            hasUpperCase: /[A-Z]/.test(password),
            hasLowerCase: /[a-z]/.test(password),
            hasNumber: /\d/.test(password),
            hasSpecialChar: /[@$!%*?&#]/.test(password),
            hasMinLength: password.length >= 8,
        });
    }, [password]);

    const isPasswordValid = () => {
        return Object.values(passwordStrength).every(Boolean);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isPasswordValid()) {
            setError('パスワードの条件をすべて満たしてください。');
            return;
        }

        if (password !== confirmPassword) {
            setError('パスワードが一致しません。');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const token = getTokenFromUrl();
            await api.post('/auth/reset-password', { token, newPassword: password });
            setSuccess(true);
        } catch (err) {
            setError(authErrorFrom(err, 'パスワードを変更できませんでした。もう一度お試しください。'));
        } finally {
            setLoading(false);
        }
    };

    // Loading state
    if (validating) {
        return (
            <AuthLayout>
                <Card>
                    <CardContent sx={cardContentSx}>
                        <Stack direction="row" spacing={2} alignItems="center" role="status">
                            <CircularProgress size={24} />
                            <Typography color="text.secondary">読み込み中…</Typography>
                        </Stack>
                    </CardContent>
                </Card>
            </AuthLayout>
        );
    }

    // Error state
    if (!tokenValid && !validating) {
        return (
            <AuthLayout>
                <Card>
                    <CardContent sx={cardContentSx}>
                        <ErrorOutline sx={{ fontSize: 48, color: 'error.main', mb: 2 }} aria-hidden="true" />
                        <Typography component="h1" variant="h4" gutterBottom>
                            このリンクは使えません
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                            {error || 'リンクの有効期限が切れたか、正しくないリンクです。'}
                        </Typography>
                        <Button
                            variant="contained"
                            fullWidth
                            component={RouterLink}
                            to="/forgot-password"
                            size="large"
                        >
                            再設定をもう一度申し込む
                        </Button>
                    </CardContent>
                </Card>
            </AuthLayout>
        );
    }

    // Success state
    if (success) {
        return (
            <AuthLayout>
                <Card>
                    <CardContent sx={cardContentSx}>
                        <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} aria-hidden="true" />
                        <Typography component="h1" variant="h4" gutterBottom>
                            パスワードを変更しました
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                            新しいパスワードでログインできます。
                        </Typography>
                        <Button
                            variant="contained"
                            fullWidth
                            component={RouterLink}
                            to="/login"
                            size="large"
                        >
                            ログインする
                        </Button>
                    </CardContent>
                </Card>
            </AuthLayout>
        );
    }

    const requirements = [
        { check: passwordStrength.hasMinLength, text: '8文字以上' },
        { check: passwordStrength.hasUpperCase, text: '大文字を1つ以上' },
        { check: passwordStrength.hasLowerCase, text: '小文字を1つ以上' },
        { check: passwordStrength.hasNumber, text: '数字を1つ以上' },
        { check: passwordStrength.hasSpecialChar, text: '記号（@$!%*?&#）を1つ以上' },
    ];

    // Reset form
    return (
        <AuthLayout>
            <Card>
                <CardContent sx={cardContentSx}>
                    <Typography component="h1" variant="h4" gutterBottom>
                        新しいパスワードを決める
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        次のアカウントのパスワードを変更します。
                    </Typography>
                    <Typography variant="body1" fontWeight={700} sx={{ mb: 3, overflowWrap: 'anywhere' }}>
                        {email}
                    </Typography>

                    <Collapse in={!!error}>
                        <Alert
                            severity="error"
                            sx={{ mb: 3 }}
                            role="alert"
                            onClose={() => setError(null)}
                            closeText="閉じる"
                        >
                            {error}
                        </Alert>
                    </Collapse>

                    <form onSubmit={handleSubmit}>
                        <Stack spacing={3}>
                            <TextField
                                fullWidth
                                label="新しいパスワード"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
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

                            <TextField
                                fullWidth
                                label="新しいパスワード（確認）"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                error={!!confirmPassword && password !== confirmPassword}
                                helperText={
                                    confirmPassword && password !== confirmPassword
                                        ? 'パスワードが一致しません'
                                        : undefined
                                }
                            />

                            <Box>
                                <Typography variant="body2" fontWeight={700} gutterBottom>
                                    パスワードの条件
                                </Typography>
                                <Stack component="ul" spacing={0.5} sx={{ listStyle: 'none', m: 0, p: 0 }}>
                                    {requirements.map((req, index) => (
                                        <Stack
                                            component="li"
                                            key={index}
                                            direction="row"
                                            spacing={1}
                                            alignItems="center"
                                        >
                                            {req.check ? (
                                                <CheckCircle sx={{ fontSize: 18, color: 'success.main' }} aria-hidden="true" />
                                            ) : (
                                                <RadioButtonUnchecked sx={{ fontSize: 18, color: 'text.secondary' }} aria-hidden="true" />
                                            )}
                                            <Typography
                                                variant="body2"
                                                sx={{ color: req.check ? 'success.main' : 'text.secondary' }}
                                            >
                                                {req.text}
                                                <Box component="span" sx={visuallyHidden}>
                                                    {req.check ? '（満たしています）' : '（まだです）'}
                                                </Box>
                                            </Typography>
                                        </Stack>
                                    ))}
                                </Stack>
                            </Box>

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                size="large"
                                disabled={loading || !isPasswordValid() || password !== confirmPassword}
                            >
                                {loading ? (
                                    <CircularProgress size={24} color="inherit" aria-label="変更しています" />
                                ) : (
                                    'パスワードを変更する'
                                )}
                            </Button>
                        </Stack>
                    </form>
                </CardContent>
            </Card>
        </AuthLayout>
    );
};

const visuallyHidden = {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap',
} as const;
