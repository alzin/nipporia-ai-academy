// frontend/src/pages/TermsPage.tsx
// 利用規約. Matches what the site already says (prices and cancellation on 特商法,
// the refund rule, the privacy policy).
// NOTE: a draft written for this service. It has NOT been reviewed by a lawyer.
import React, { useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, Button, Container, Link, Stack, Typography } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { colors } from '../theme/theme';

const LAST_UPDATED = '2026年11月20日';

type Article = { title: string; body: React.ReactNode[] };

const articles: Article[] = [
  {
    title: '適用',
    body: [
      'この利用規約（以下「本規約」）は、Nipporia（ニッポリア、以下「当方」）が運営する「Nipporia AI Academy」（以下「本サービス」）の利用条件を定めるものです。',
      '本サービスに登録した方（以下「会員」）は、本規約に同意したうえで本サービスを利用するものとします。',
    ],
  },
  {
    title: 'サービスの内容',
    body: [
      '本サービスは、オンラインの動画講座と、会員どうしで質問や投稿ができるコミュニティを提供します。',
      '講座の内容や本数は、よりよいものにするために追加・変更することがあります。',
    ],
  },
  {
    title: '会員登録とアカウント',
    body: [
      'メールアドレスとパスワード、または Google アカウントで登録できます。登録の情報は、正しく最新のものにしてください。',
      'アカウントは本人だけが使えます。パスワードの管理は会員の責任で行い、ほかの人に使わせたり、共有したりしないでください。',
      'アカウントが不正に使われたと気づいたときは、すぐに info@nipporia.com までご連絡ください。',
    ],
  },
  {
    title: '料金と支払い',
    body: [
      <>
        メンバーシップの料金は、月額 ¥4,980（税込）または年額 ¥49,800（税込）です。支払方法や時期は
        <Link component={RouterLink} to="/tokushoho">特定商取引法に基づく表記</Link>
        のとおりです。
      </>,
      'お支払いは Stripe の決済ページで、クレジットカードで行います。月額プランは毎月、年額プランは毎年、同じ日に自動で更新され、請求されます。',
      '料金を変更するときは、変更の前に、サイトまたはメールでお知らせします。変更後の料金は、お知らせした日以降の更新から適用します。',
    ],
  },
  {
    title: '解約と返金',
    body: [
      'サイトの「サブスクリプション管理」から、いつでも解約できます。解約しても、次の更新日までは見られます。それ以降の請求はありません。',
      'デジタルコンテンツのため、お支払い後の返金はお受けしていません。ただし、当方の不具合でご覧いただけない場合は、info@nipporia.com までご連絡ください。',
    ],
  },
  {
    title: '禁止事項',
    body: [
      '会員は、次のことをしてはいけません。',
      <Box component="ul" sx={{ m: 0, pl: 3, '& li': { mt: 0.5 } }}>
        <li>動画や教材を、録画・ダウンロード・転載・再配布すること</li>
        <li>アカウントをほかの人と共有したり、売ったり、貸したりすること</li>
        <li>本サービスの内容を使って、同じような講座や商品を作って販売すること</li>
        <li>ほかの会員や第三者を傷つける投稿、迷惑になる投稿、宣伝だけを目的とした投稿</li>
        <li>本サービスのしくみを壊したり、負荷をかけたり、不正にアクセスしたりすること</li>
        <li>法令や公序良俗に反すること</li>
      </Box>,
    ],
  },
  {
    title: '投稿の取り扱い',
    body: [
      'コミュニティに投稿した内容の権利は、投稿した会員にあります。当方は、本サービスの運営に必要な範囲で、投稿を表示・保存できるものとします。',
      '禁止事項にあたる投稿は、予告なく削除することがあります。',
    ],
  },
  {
    title: '知的財産権',
    body: [
      '動画、文章、画像などの講座の内容の著作権は、当方または正当な権利を持つ人にあります。会員は、自分の学習のためにだけ利用できます。',
      'Claude および Claude Code は Anthropic の商標です。本サービスは Anthropic が提供・承認するものではありません。',
    ],
  },
  {
    title: '利用の停止と退会',
    body: [
      '会員が本規約に違反したときは、事前の通知なく、利用を停止したり、アカウントを削除したりすることがあります。この場合、支払い済みの料金はお返ししません。',
      '退会を希望するときは、解約のうえ、info@nipporia.com までご連絡ください。',
    ],
  },
  {
    title: 'サービスの変更・中断・終了',
    body: [
      'システムの保守や障害、そのほかやむを得ない理由で、本サービスを一時的に止めることがあります。',
      '本サービスを終了するときは、30日以上前にお知らせします。',
    ],
  },
  {
    title: '免責',
    body: [
      '講座の内容は、作成した時点の公式ドキュメントに沿っています。Claude Code の画面や機能は変わることがあり、講座のとおりに動かない場合があります。',
      '会員が講座の内容をもとに行った作業の結果について、当方は、当方に故意または重大な過失がある場合を除き、責任を負いません。責任を負う場合も、その額は、損害が生じた月に会員が支払った料金を上限とします。',
    ],
  },
  {
    title: '個人情報',
    body: [
      <>
        個人情報は、
        <Link component={RouterLink} to="/privacy-policy">プライバシーポリシー</Link>
        に従って取り扱います。
      </>,
    ],
  },
  {
    title: '規約の変更',
    body: [
      '本規約は、必要に応じて変更することがあります。変更するときは、効力が生じる日と内容を、このページでお知らせします。変更後も本サービスを利用した場合は、変更に同意したものとします。',
    ],
  },
  {
    title: '準拠法と管轄',
    body: [
      '本規約は日本法に従って解釈します。本サービスについて争いが生じたときは、さいたま地方裁判所を第一審の専属的合意管轄裁判所とします。',
    ],
  },
];

export const TermsPage: React.FC = () => {
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
          利用規約
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          最終更新日：{LAST_UPDATED}
        </Typography>

        <Stack spacing={2}>
          {articles.map((a, i) => (
            <Box
              key={a.title}
              component="section"
              aria-labelledby={`terms-${i + 1}`}
              sx={{
                bgcolor: 'background.paper',
                border: `1px solid ${colors.line}`,
                borderRadius: '14px',
                p: { xs: 2.5, sm: 4 },
              }}
            >
              <Typography id={`terms-${i + 1}`} variant="h6" component="h2" sx={{ mb: 1.5 }}>
                第{i + 1}条（{a.title}）
              </Typography>
              <Stack spacing={1}>
                {a.body.map((p, j) =>
                  typeof p === 'string' ? (
                    <Typography key={j} variant="body1">
                      {p}
                    </Typography>
                  ) : (
                    <Box key={j} sx={{ typography: 'body1' }}>
                      {p}
                    </Box>
                  )
                )}
              </Stack>
            </Box>
          ))}
        </Stack>

        <Typography variant="body1" sx={{ mt: 4 }}>
          運営：Nipporia（ニッポリア）／お問い合わせ：
          <Link href="mailto:info@nipporia.com">info@nipporia.com</Link>
        </Typography>
      </Container>
    </Box>
  );
};
