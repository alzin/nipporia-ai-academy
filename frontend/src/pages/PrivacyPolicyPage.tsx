// frontend/src/pages/PrivacyPolicyPage.tsx
//
// NOTE: This Japanese text is a translation of the earlier English policy.
// It has NOT been reviewed by a lawyer. Get a legal review before launch
// (contents, the contact address and the 最終更新日 date).
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Button,
    Stack,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Grid,
    Link,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { colors } from '../theme/theme';

const LAST_UPDATED = '2025年8月2日';

const sections = [
    { id: 'introduction', title: 'はじめに' },
    { id: 'information-collection', title: '収集する情報' },
    { id: 'use-of-information', title: '情報の利用目的' },
    { id: 'sharing', title: '情報の共有' },
    { id: 'security', title: 'データの安全管理' },
    { id: 'rights', title: 'お客様の権利' },
    { id: 'contact', title: 'お問い合わせ' },
];

type Item = { primary: string; secondary?: string };

const ItemList: React.FC<{ items: Item[] }> = ({ items }) => (
    <Box component="ul" sx={{ m: 0, pl: 3, '& li': { mt: 1 } }}>
        {items.map((item) => (
            <li key={item.primary}>
                <Typography variant="body1" component="span" fontWeight={item.secondary ? 700 : 400}>
                    {item.primary}
                </Typography>
                {item.secondary && (
                    <Typography variant="body2" color="text.secondary">
                        {item.secondary}
                    </Typography>
                )}
            </li>
        ))}
    </Box>
);

const Section: React.FC<{ id: string; title: string; children: React.ReactNode }> = ({
    id,
    title,
    children,
}) => (
    <Box
        component="section"
        id={id}
        aria-labelledby={`${id}-title`}
        sx={{
            bgcolor: 'background.paper',
            border: `1px solid ${colors.line}`,
            borderRadius: '14px',
            p: { xs: 2.5, sm: 4 },
            scrollMarginTop: 24,
        }}
    >
        <Typography id={`${id}-title`} variant="h5" component="h2" sx={{ mb: 2 }}>
            {title}
        </Typography>
        {children}
    </Box>
);

export const PrivacyPolicyPage: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId);
        if (element) {
            const topOffset = 24;
            const elementTop = element.getBoundingClientRect().top + window.scrollY;

            window.scrollTo({
                top: elementTop - topOffset,
                behavior: 'smooth',
            });
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* Header */}
            <Box
                component="header"
                sx={{ borderBottom: `1px solid ${colors.lineStrong}`, py: { xs: 3, md: 5 } }}
            >
                <Container maxWidth="lg">
                    <Button
                        startIcon={<ArrowBack aria-hidden />}
                        onClick={() => navigate('/dashboard')}
                        sx={{ color: 'text.secondary', mb: 2, ml: -1 }}
                    >
                        ホームに戻る
                    </Button>
                    <Typography variant="h3" component="h1" gutterBottom>
                        プライバシーポリシー
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        最終更新日：{LAST_UPDATED}
                    </Typography>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
                <Grid container spacing={4}>
                    {/* Table of Contents */}
                    <Grid size={{ xs: 12, md: 3 }}>
                        <Box
                            component="nav"
                            aria-labelledby="toc-title"
                            sx={{
                                position: { md: 'sticky' },
                                top: { md: 24 },
                                bgcolor: 'background.paper',
                                border: `1px solid ${colors.line}`,
                                borderRadius: '14px',
                                p: 2,
                            }}
                        >
                            <Typography id="toc-title" variant="subtitle2" component="h2" sx={{ px: 1, mb: 0.5 }}>
                                目次
                            </Typography>
                            <List disablePadding>
                                {sections.map((section) => (
                                    <ListItem key={section.id} disablePadding>
                                        <ListItemButton
                                            onClick={() => scrollToSection(section.id)}
                                            sx={{ borderRadius: 1, minHeight: 44 }}
                                        >
                                            <ListItemText
                                                primary={section.title}
                                                primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    </Grid>

                    {/* Content */}
                    <Grid size={{ xs: 12, md: 9 }}>
                        <Stack spacing={3}>
                            <Section id="introduction" title="はじめに">
                                <Typography variant="body1" paragraph>
                                    Nipporia AI Academy（以下「当サービス」）は、お客様の個人情報とプライバシーの権利を守るよう努めます。このプライバシーポリシーでは、お客様が当サービスのウェブサイトとサービスを利用するときに、情報をどのように収集し、利用し、開示し、保護するかを説明します。
                                </Typography>
                                <Typography variant="body1" sx={{ mb: 0 }}>
                                    このポリシーをよくお読みください。内容に同意いただけない場合は、サイトにアクセスせず、サービスも利用しないでください。
                                </Typography>
                            </Section>

                            <Section id="information-collection" title="収集する情報">
                                <Typography variant="h6" component="h3" gutterBottom>
                                    個人情報
                                </Typography>
                                <ItemList
                                    items={[
                                        { primary: 'アカウント情報', secondary: '名前、メールアドレス、パスワード、プロフィール写真' },
                                        { primary: 'お支払い情報', secondary: 'クレジットカード情報、請求先住所（Stripe を通じて安全に処理されます）' },
                                        { primary: '学習データ', secondary: '講座の進み具合とクイズの得点' },
                                    ]}
                                />
                                <Typography variant="h6" component="h3" gutterBottom sx={{ mt: 3 }}>
                                    自動的に収集する情報
                                </Typography>
                                <ItemList
                                    items={[
                                        { primary: '端末の情報', secondary: 'IP アドレス、ブラウザの種類、OS' },
                                        { primary: '利用状況', secondary: '見たページ、滞在時間、使った機能' },
                                    ]}
                                />
                            </Section>

                            <Section id="use-of-information" title="情報の利用目的">
                                <Typography variant="body1" sx={{ mb: 1 }}>
                                    お客様の情報は、次の目的で利用します。
                                </Typography>
                                <ItemList
                                    items={[
                                        { primary: '学習サービスを提供し、運営するため' },
                                        { primary: 'お支払いを処理し、サブスクリプションを管理するため' },
                                        { primary: '学習の進み具合を記録し、お客様に合ったおすすめを出すため' },
                                        { primary: 'アカウントやサービスについて、大切なお知らせを送るため' },
                                        { primary: 'サービスを改善し、新しい機能を開発するため' },
                                    ]}
                                />
                            </Section>

                            <Section id="sharing" title="情報の共有">
                                <Typography variant="body1" sx={{ mb: 1 }}>
                                    お客様の個人情報を第三者に販売、交換、貸し出しすることはありません。情報を共有するのは、次の場合に限ります。
                                </Typography>
                                <ItemList
                                    items={[
                                        { primary: 'サービス提供事業者', secondary: '決済処理のための Stripe など、信頼できる外部サービスと共有する場合' },
                                        { primary: '法令にもとづく場合', secondary: '法律で求められた場合や、当サービスの権利を守るために必要な場合' },
                                        { primary: 'ご本人の同意がある場合', secondary: 'お客様が情報の共有にはっきり同意した場合' },
                                    ]}
                                />
                            </Section>

                            <Section id="security" title="データの安全管理">
                                <Typography variant="body1" sx={{ mb: 1 }}>
                                    個人情報を守るため、技術面と組織面で適切な安全対策をとります。たとえば次のような対策です。
                                </Typography>
                                <ItemList
                                    items={[
                                        { primary: '機密性の高いデータを、通信中も保存中も暗号化する' },
                                        { primary: '定期的に安全性を確認し、更新する' },
                                        { primary: '個人データにアクセスできる人を、業務に必要な人だけに限る' },
                                        { primary: '安全なデータセンターを使い、バックアップの手順を整える' },
                                    ]}
                                />
                            </Section>

                            <Section id="rights" title="お客様の権利">
                                <Typography variant="body1" sx={{ mb: 1 }}>
                                    お客様は、ご自身の個人情報について次の権利をお持ちです。
                                </Typography>
                                <ItemList
                                    items={[
                                        { primary: '開示', secondary: '個人データの写しを求められます' },
                                        { primary: '訂正', secondary: '正しくない情報を更新・訂正できます' },
                                        { primary: '削除', secondary: 'アカウントと個人データの削除を求められます' },
                                        { primary: 'データの持ち出し', secondary: 'データを持ち出しやすい形式で受け取れます' },
                                    ]}
                                />
                            </Section>

                            <Section id="contact" title="お問い合わせ">
                                <Typography variant="body1" sx={{ mb: 2 }}>
                                    このプライバシーポリシーやデータの取り扱いについてご質問があれば、次の連絡先までお問い合わせください。
                                </Typography>
                                <Box
                                    sx={{
                                        bgcolor: 'background.default',
                                        border: `1px solid ${colors.line}`,
                                        p: { xs: 2, sm: 3 },
                                        borderRadius: '10px',
                                    }}
                                >
                                    <Typography variant="body1" fontWeight={700}>
                                        Nipporia AI Academy
                                    </Typography>
                                    <Typography variant="body1">
                                        メール：
                                        <Link href="mailto:info@nipporia.com">info@nipporia.com</Link>
                                    </Typography>
                                    <Typography variant="body1">所在地：東京都</Typography>
                                </Box>
                            </Section>

                            <Box
                                component="section"
                                aria-labelledby="policy-updates-title"
                                sx={{
                                    bgcolor: colors.accentSoft,
                                    borderRadius: '14px',
                                    p: { xs: 2.5, sm: 4 },
                                }}
                            >
                                <Typography id="policy-updates-title" variant="h6" component="h2" gutterBottom>
                                    ポリシーの変更
                                </Typography>
                                <Typography variant="body2">
                                    このプライバシーポリシーは、必要に応じて変更することがあります。変更したときは、このページに新しいポリシーを載せ、上部の「最終更新日」を更新してお知らせします。
                                </Typography>
                            </Box>
                        </Stack>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};
