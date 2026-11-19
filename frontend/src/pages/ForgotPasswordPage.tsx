import React, { useState } from 'react';
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
    Stack,
    Collapse,
} from '@mui/material';
import { ArrowBack, MarkEmailRead } from '@mui/icons-material';
import api from '../services/api';
import { AuthLayout } from '../components/layout/AuthLayout';
import { authErrorFrom } from '../utils/authErrors';

export const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await api.post('/auth/forgot-password', { email });
            setSuccess(true);
        } catch (err: any) {
            // Check for rate limiting
            if (err.response?.status === 429) {
                setError('短い時間に何度も申し込まれたため、いまは受け付けられません。しばらくしてからもう一度お試しください。');
            } else {
                const raw = err.response?.data?.error?.message || err.response?.data?.error;
                setError(
                    authErrorFrom(
                        raw ? { message: raw } : err,
                        'メールを送れませんでした。もう一度お試しください。',
                    ),
                );
            }
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <AuthLayout>
                <Card>
                    <CardContent sx={{ px: { xs: 2.5, sm: 5 }, py: { xs: 4, sm: 5 } }}>
                        <MarkEmailRead sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} aria-hidden="true" />
                        <Typography component="h1" variant="h4" gutterBottom>
                            メールを送りました
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, overflowWrap: 'anywhere' }}>
                            <Box component="strong" sx={{ color: 'text.primary' }}>{email}</Box>
                            {' '}に、パスワードを再設定するためのリンクを送りました。
                        </Typography>
                        <Alert severity="info" sx={{ mb: 3 }}>
                            リンクの有効期限は1時間です。メールが見当たらないときは、迷惑メールのフォルダも見てください。
                        </Alert>
                        <Stack spacing={1}>
                            <Button variant="contained" fullWidth component={RouterLink} to="/login">
                                ログイン画面にもどる
                            </Button>
                            <Button
                                variant="text"
                                color="secondary"
                                onClick={() => {
                                    setSuccess(false);
                                    setEmail('');
                                }}
                            >
                                別のメールアドレスで送る
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout>
            <Card>
                <CardContent sx={{ px: { xs: 2.5, sm: 5 }, py: { xs: 4, sm: 5 } }}>
                    <Box mb={4}>
                        <Button
                            startIcon={<ArrowBack />}
                            component={RouterLink}
                            to="/login"
                            color="inherit"
                            sx={{ mb: 2, ml: -1.5, color: 'text.secondary' }}
                        >
                            ログイン画面にもどる
                        </Button>

                        <Typography component="h1" variant="h4" gutterBottom>
                            パスワードの再設定
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            登録したメールアドレスを入力してください。パスワードを決め直すためのリンクを送ります。
                        </Typography>
                    </Box>

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
                                label="メールアドレス"
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                size="large"
                                disabled={loading || !email}
                            >
                                {loading ? (
                                    <CircularProgress size={24} color="inherit" aria-label="送信しています" />
                                ) : (
                                    '再設定のリンクを送る'
                                )}
                            </Button>
                        </Stack>
                    </form>
                </CardContent>
            </Card>
        </AuthLayout>
    );
};
