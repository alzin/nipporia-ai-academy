// frontend/src/pages/NotFoundPage.tsx
import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Button,
    Stack,
    Card,
    CardContent,
    Link,
} from '@mui/material';
import { Home, ArrowBack } from '@mui/icons-material';
import { colors } from '../theme/theme';

export const NotFoundPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Box
            component="main"
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                bgcolor: 'background.default',
                py: 4,
            }}
        >
            <Container maxWidth="sm">
                <Card>
                    <CardContent sx={{ p: { xs: 3, sm: 5 }, textAlign: 'center' }}>
                        <Typography
                            component="p"
                            sx={{
                                fontSize: { xs: '3.5rem', sm: '4.5rem' },
                                fontWeight: 700,
                                lineHeight: 1.2,
                                color: colors.accent,
                                fontVariantNumeric: 'tabular-nums',
                                mb: 1,
                            }}
                        >
                            404
                        </Typography>

                        <Typography variant="h4" component="h1" gutterBottom>
                            ページが見つかりません
                        </Typography>

                        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                            お探しのページは、移動したか削除された可能性があります。URL をもう一度確かめてください。
                        </Typography>

                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={2}
                            justifyContent="center"
                        >
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<Home aria-hidden />}
                                onClick={() => navigate('/')}
                            >
                                ホームへ
                            </Button>
                            <Button
                                variant="outlined"
                                size="large"
                                startIcon={<ArrowBack aria-hidden />}
                                onClick={() => navigate(-1)}
                            >
                                前のページに戻る
                            </Button>
                        </Stack>

                        <Box
                            component="nav"
                            aria-label="よく使うページ"
                            sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}
                        >
                            <Typography variant="body2" color="text.secondary">
                                よく使うページ
                            </Typography>
                            <Stack
                                direction="row"
                                spacing={3}
                                justifyContent="center"
                                flexWrap="wrap"
                                useFlexGap
                            >
                                {[
                                    { to: '/dashboard', label: 'ホーム' },
                                    { to: '/classroom', label: '講座' },
                                    { to: '/community', label: 'コミュニティ' },
                                ].map((item) => (
                                    <Link
                                        key={item.to}
                                        component={RouterLink}
                                        to={item.to}
                                        sx={{ display: 'inline-flex', alignItems: 'center', minHeight: 44 }}
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </Stack>
                        </Box>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
};
