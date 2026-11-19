// frontend/src/pages/CommerceDisclosurePage.tsx
// 特定商取引法に基づく表記. Business details are the same as on nipporia.com/ja/commerce-disclosure.
// NOTE: the refund wording is a draft for a digital subscription. Confirm it before launch.
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Container, Link, Typography } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { colors } from '../theme/theme';

const LAST_UPDATED = '2026年11月20日';

const rows: Array<[string, React.ReactNode]> = [
  ['販売事業者名', 'Nipporia（ニッポリア）'],
  ['代表者', 'アルジンムハンマドガイス'],
  ['所在地', '埼玉県久喜市久喜中央1丁目9番4-902号'],
  ['電話番号', '070-8905-8857（お問い合わせは、なるべくメールでお願いします）'],
  ['メールアドレス', <Link href="mailto:info@nipporia.com">info@nipporia.com</Link>],
  ['サービス名', 'Nipporia AI Academy（オンライン動画講座とコミュニティ）'],
  ['販売価格', '月額プラン ¥4,980（税込）／年額プラン ¥49,800（税込）'],
  [
    '商品代金以外に必要な費用',
    'インターネットの接続料金・通信料金はお客様のご負担です。Claude Code を使うには、Anthropic の Claude の有料プランが別に必要です（講座の価格には含まれません）。',
  ],
  ['支払方法', 'クレジットカード（Stripe の決済ページ）'],
  ['支払時期', 'お申し込みのときに初回分をお支払いいただきます。その後は、月額プランは毎月、年額プランは毎年、同じ日に自動で更新され、請求されます。'],
  ['提供時期', 'お支払いが終わると、すぐに全レッスンをご覧いただけます。'],
  [
    '解約',
    'サイトの「サブスクリプション管理」から、いつでも解約できます。解約しても次の更新日までは見られ、それ以降の請求はありません。解約の手数料はかかりません。',
  ],
  [
    '返品・返金',
    'デジタルコンテンツのため、お支払い後の返金はお受けしていません。当方の不具合でご覧いただけない場合は、info@nipporia.com までご連絡ください。',
  ],
  ['動作環境', 'Google Chrome・Safari・Firefox・Microsoft Edge の最新版'],
];

export const CommerceDisclosurePage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: { xs: 4, sm: 6 } }}>
      <Container maxWidth="md">
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 3, minHeight: 44 }}>
          戻る
        </Button>
        <Typography component="h1" variant="h4" gutterBottom>
          特定商取引法に基づく表記
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          最終更新日：{LAST_UPDATED}
        </Typography>

        <Box
          component="dl"
          sx={{
            m: 0,
            bgcolor: 'background.paper',
            border: `1px solid ${colors.line}`,
            borderRadius: '14px',
            overflow: 'hidden',
          }}
        >
          {rows.map(([term, value], i) => (
            <Box
              key={term}
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '200px 1fr' },
                gap: { xs: 0.5, sm: 3 },
                px: { xs: 2.5, sm: 4 },
                py: 2,
                borderTop: i === 0 ? 'none' : `1px solid ${colors.line}`,
              }}
            >
              <Typography component="dt" variant="body2" fontWeight={700}>
                {term}
              </Typography>
              <Typography component="dd" variant="body1" sx={{ m: 0 }}>
                {value}
              </Typography>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
};
