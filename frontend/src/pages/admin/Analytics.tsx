// frontend/src/pages/admin/Analytics.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  School,
  AttachMoney,
  CalendarMonth,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '../../services/api';
import AdminNavigationButton from '../../components/admin/AdminNavigationButton';

interface AnalyticsOverview {
  totalUsers: number;
  activeUsers: number;
  monthlyRevenue: number;
  completionRate: number;
  userGrowth: number;
  revenueGrowth: number;
}

interface AnalyticsData {
  revenue: Array<{ month: string; revenue: number }>;
  engagement: Array<{ day: string; lessons: number; posts: number }>;
}

const CHART_ACCENT = '#AE4A24';
const CHART_BLUE = '#3C5A80';

const formatYen = (value: number) => `¥${value.toLocaleString('ja-JP')}`;

const currencyFormatter = (value: any) => {
  if (typeof value !== 'number' || isNaN(value)) return formatYen(0);
  return formatYen(value);
};

// The API returns English month / weekday abbreviations.
const MONTH_LABELS: Record<string, string> = {
  Jan: '1月', Feb: '2月', Mar: '3月', Apr: '4月', May: '5月', Jun: '6月',
  Jul: '7月', Aug: '8月', Sep: '9月', Oct: '10月', Nov: '11月', Dec: '12月',
};

const DAY_LABELS: Record<string, string> = {
  Mon: '月', Tue: '火', Wed: '水', Thu: '木', Fri: '金', Sat: '土', Sun: '日',
};

// Validate and clean data
const validateRevenueData = (data: any[]): Array<{ month: string; revenue: number }> => {
  if (!Array.isArray(data)) return [];

  return data.map(item => ({
    month: MONTH_LABELS[String(item.month)] ?? String(item.month || ''),
    revenue: Number(item.revenue) || 0,
  })).filter(item => item.month && !isNaN(item.revenue));
};

const validateEngagementData = (data: any[]): Array<{ day: string; lessons: number; posts: number }> => {
  if (!Array.isArray(data)) return [];

  return data.map(item => ({
    day: DAY_LABELS[String(item.day)] ?? String(item.day || ''),
    lessons: Number(item.lessons) || 0,
    posts: Number(item.posts) || 0,
  })).filter(item => item.day);
};

export const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30days');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<AnalyticsOverview>({
    totalUsers: 0,
    activeUsers: 0,
    monthlyRevenue: 0,
    completionRate: 0,
    userGrowth: 0,
    revenueGrowth: 0,
  });
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    revenue: [],
    engagement: [],
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch overview data and detailed analytics
      const [
        overviewResponse,
        revenueResponse,
        engagementResponse
      ] = await Promise.all([
        api.get('/admin/analytics/overview'),
        api.get('/admin/analytics/revenue'),
        api.get('/admin/analytics/engagement'),
      ]);

      // Set overview data
      setOverview(overviewResponse.data);

      // Validate and clean the data
      const revenueData = validateRevenueData(revenueResponse.data);
      const engagementData = validateEngagementData(engagementResponse.data);

      setAnalyticsData({
        revenue: revenueData,
        engagement: engagementData,
      });
    } catch (error: any) {
      console.error('Failed to fetch analytics:', error);
      setError('分析データを読み込めませんでした。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <AdminNavigationButton titlePage="分析" />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Stack spacing={2} alignItems="center">
            <CircularProgress />
            <Typography variant="h6">読み込み中…</Typography>
          </Stack>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <AdminNavigationButton titlePage="分析" />
        <Alert severity="error" sx={{ my: 4 }}>
          {error}
        </Alert>
        <Box sx={{ textAlign: 'center' }}>
          <Button variant="outlined" onClick={fetchAnalyticsData}>
            再読み込み
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <AdminNavigationButton titlePage="分析" />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>期間</InputLabel>
          <Select value={timeRange} label="期間" onChange={(e) => setTimeRange(e.target.value)}>
            <MenuItem value="7days">過去7日間</MenuItem>
            <MenuItem value="30days">過去30日間</MenuItem>
            <MenuItem value="90days">過去90日間</MenuItem>
            <MenuItem value="1year">過去1年間</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {/* Key Metrics */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <AttachMoney color="action" />
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    {overview.revenueGrowth > 0 ? (
                      <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
                    ) : (
                      <TrendingDown sx={{ fontSize: 16, color: 'error.main' }} />
                    )}
                    <Typography variant="caption" color={overview.revenueGrowth > 0 ? 'success.main' : 'error.main'}>
                      {Math.abs(overview.revenueGrowth).toFixed(1)}%
                    </Typography>
                  </Stack>
                </Stack>
                <Typography variant="h4" fontWeight={700}>
                  {formatYen(overview.monthlyRevenue)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  月間売上
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <People color="action" />
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    {overview.userGrowth > 0 ? (
                      <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
                    ) : (
                      <TrendingDown sx={{ fontSize: 16, color: 'error.main' }} />
                    )}
                    <Typography variant="caption" color={overview.userGrowth > 0 ? 'success.main' : 'error.main'}>
                      {Math.abs(overview.userGrowth)}%
                    </Typography>
                  </Stack>
                </Stack>
                <Typography variant="h4" fontWeight={700}>
                  {overview.totalUsers.toLocaleString('ja-JP')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ユーザー数
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Stack spacing={1}>
                <School color="action" />
                <Typography variant="h4" fontWeight={700}>
                  {overview.completionRate}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  平均完了率
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Stack spacing={1}>
                <CalendarMonth color="action" />
                <Typography variant="h4" fontWeight={700}>
                  {overview.activeUsers.toLocaleString('ja-JP')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  アクティブユーザー（30日間）
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Revenue Chart */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                売上の推移
              </Typography>
              {analyticsData.revenue.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.revenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis
                      tickFormatter={(value) => formatYen(value)}
                      width={90}
                      domain={['dataMin', 'dataMax']}
                    />
                    <Tooltip formatter={currencyFormatter} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke={CHART_ACCENT}
                      strokeWidth={2}
                      dot={{ fill: CHART_ACCENT }}
                      name="売上"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">売上のデータはまだありません</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Engagement Chart */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                曜日ごとの利用状況
              </Typography>
              {analyticsData.engagement.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.engagement}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="lessons" fill={CHART_ACCENT} name="レッスン" />
                    <Bar dataKey="posts" fill={CHART_BLUE} name="投稿" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">利用状況のデータはまだありません</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};