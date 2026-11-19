// frontend/src/pages/admin/CommunityModeration.tsx - Updated with Feedback tab
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Snackbar,
  Pagination,
  CircularProgress,
} from '@mui/material';
import {
  Search,
  Flag,
  CheckCircle,
  Delete,
  Block,
  MoreVert,
  Campaign,
  ThumbUp,
  Comment,
  Share,
  Feedback,
} from '@mui/icons-material';
import api from '../../services/api';
import { announcementService } from '../../services/announcementService';
import { feedbackService } from '../../services/feedbackService';
import { useSweetAlert } from '../../utils/sweetAlert';
import AdminNavigationButton from '../../components/admin/AdminNavigationButton';

interface Post {
  id: string;
  content: string;
  mediaUrls: string[];
  likesCount: number;
  createdAt: string;
  isFlagged?: boolean;
  commentsCount: number;
  author?: {
    name: string;
    email: string;
    avatar?: string;
    userId: string;
  };
}

interface Announcement {
  id: string;
  author?: {
    userId: string;
    name: string;
    email: string;
    avatar?: string;
  };
  content: string;
  likesCount: number;
  isLiked: boolean;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
  isFlagged?: boolean;
}

interface FeedbackItem {
  id: string;
  content: string;
  mediaUrls: string[];
  likesCount: number;
  isLiked: boolean;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
  isFlagged?: boolean;
  author?: {
    userId: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

type ItemType = 'post' | 'announcement' | 'feedback';

const TYPE_LABELS: Record<ItemType, string> = {
  post: '投稿',
  announcement: 'お知らせ',
  feedback: 'フィードバック',
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  const day = date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const time = date.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${day} ${time}`;
};

interface PaginationData {
  currentPage: number;
  totalPages: number;
  total: number;
  limit: number;
}

export const CommunityModeration: React.FC = () => {
  const { showConfirm, showError } = useSweetAlert();
  const [posts, setPosts] = useState<Post[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [announcementDialog, setAnnouncementDialog] = useState(false);
  const [announcementContent, setAnnouncementContent] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // Pagination states
  const [announcementsPagination, setAnnouncementsPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 10
  });

  const [postsPagination, setPostsPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 10
  });

  const [feedbackPagination, setFeedbackPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 10
  });

  const [flaggedPagination, setFlaggedPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 10
  });

  useEffect(() => {
    fetchData();
  }, [tabValue]);

  // Reset pagination when tab changes
  useEffect(() => {
    if (tabValue === 0) {
      setAnnouncementsPagination(prev => ({ ...prev, currentPage: 1 }));
    } else if (tabValue === 1) {
      setPostsPagination(prev => ({ ...prev, currentPage: 1 }));
    } else if (tabValue === 2) {
      setFeedbackPagination(prev => ({ ...prev, currentPage: 1 }));
    } else if (tabValue === 3) {
      setFlaggedPagination(prev => ({ ...prev, currentPage: 1 }));
    }
  }, [tabValue]);

  // Fetch data when pagination changes
  useEffect(() => {
    if (tabValue === 0) {
      fetchAnnouncements(announcementsPagination.currentPage);
    }
  }, [announcementsPagination.currentPage]);

  useEffect(() => {
    if (tabValue === 1) {
      fetchPosts(postsPagination.currentPage);
    }
  }, [postsPagination.currentPage]);

  useEffect(() => {
    if (tabValue === 2) {
      fetchFeedbackItems(feedbackPagination.currentPage);
    }
  }, [feedbackPagination.currentPage]);

  useEffect(() => {
    if (tabValue === 3) {
      fetchFlaggedContent(flaggedPagination.currentPage);
    }
  }, [flaggedPagination.currentPage]);

  const fetchAnnouncements = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await announcementService.getAnnouncements(page, announcementsPagination.limit);
      setAnnouncements(response.announcements);
      setAnnouncementsPagination(prev => ({
        ...prev,
        currentPage: page,
        totalPages: response.totalPages || Math.ceil(response.total / prev.limit),
        total: response.total
      }));
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
      showError('エラー', 'お知らせを読み込めませんでした。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await api.get(`/community/posts?page=${page}&limit=${postsPagination.limit}`);
      setPosts(response.data.posts || []);
      setPostsPagination(prev => ({
        ...prev,
        currentPage: page,
        totalPages: response.data.totalPages || Math.ceil(response.data.total / prev.limit),
        total: response.data.total || 0
      }));
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      showError('エラー', '投稿を読み込めませんでした。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedbackItems = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await feedbackService.getFeedback(page, feedbackPagination.limit);
      setFeedbackItems(response.feedback || []);
      setFeedbackPagination(prev => ({
        ...prev,
        currentPage: page,
        totalPages: response.pagination?.totalPages || Math.ceil(response.pagination?.total / prev.limit),
        total: response.pagination?.total || 0
      }));
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
      showError('エラー', 'フィードバックを読み込めませんでした。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  const fetchFlaggedContent = async (page: number = 1) => {
    try {
      setLoading(true);
      const [flaggedPosts, flaggedAnnouncements, flaggedFeedback] = await Promise.all([
        api.get(`/admin/posts/flagged?page=${page}&limit=${Math.ceil(flaggedPagination.limit / 3)}`).catch(() => ({ data: { posts: [], total: 0, totalPages: 0 } })),
        api.get(`/admin/announcements/flagged?page=${page}&limit=${Math.ceil(flaggedPagination.limit / 3)}`).catch(() => ({ data: { announcements: [], total: 0, totalPages: 0 } })),
        api.get(`/admin/feedback/flagged?page=${page}&limit=${Math.ceil(flaggedPagination.limit / 3)}`).catch(() => ({ data: { feedback: [], total: 0, totalPages: 0 } }))
      ]);
      
      setPosts(flaggedPosts.data.posts || []);
      setAnnouncements(flaggedAnnouncements.data.announcements || []);
      setFeedbackItems(flaggedFeedback.data.feedback || []);
      
      const totalItems = (flaggedPosts.data.total || 0) + (flaggedAnnouncements.data.total || 0) + (flaggedFeedback.data.total || 0);
      setFlaggedPagination(prev => ({
        ...prev,
        currentPage: page,
        totalPages: Math.ceil(totalItems / prev.limit),
        total: totalItems
      }));
    } catch (error) {
      console.error('Failed to fetch flagged content:', error);
      showError('エラー', '通報された内容を読み込めませんでした。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    if (tabValue === 0) {
      await fetchAnnouncements(1);
    } else if (tabValue === 1) {
      await fetchPosts(1);
    } else if (tabValue === 2) {
      await fetchFeedbackItems(1);
    } else if (tabValue === 3) {
      await fetchFlaggedContent(1);
    }
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    if (tabValue === 0) {
      setAnnouncementsPagination(prev => ({ ...prev, currentPage: page }));
    } else if (tabValue === 1) {
      setPostsPagination(prev => ({ ...prev, currentPage: page }));
    } else if (tabValue === 2) {
      setFeedbackPagination(prev => ({ ...prev, currentPage: page }));
    } else if (tabValue === 3) {
      setFlaggedPagination(prev => ({ ...prev, currentPage: page }));
    }
  };

  const getCurrentPagination = () => {
    if (tabValue === 0) return announcementsPagination;
    if (tabValue === 1) return postsPagination;
    if (tabValue === 2) return feedbackPagination;
    return flaggedPagination;
  };

  const isVideo = (url: string) => {
    const videoExtensions = ['.mp4', '.mov', '.webm'];
    const extension = url?.split('.')?.pop()?.toLowerCase();
    return videoExtensions.includes(`.${extension}`);
  };

  const handlePostAction = async (action: string, item: Post | Announcement | FeedbackItem, itemType: 'post' | 'announcement' | 'feedback' = 'post') => {
    let confirmResult;
    let successMessage = '';

    switch (action) {
      case 'delete':
        confirmResult = await showConfirm({
          title: `この${TYPE_LABELS[itemType]}を削除しますか？`,
          text: 'この操作は元に戻せません。',
          icon: 'warning',
          confirmButtonText: '削除',
          cancelButtonText: 'キャンセル',
        });
        
        if (confirmResult.isConfirmed) {
          try {
            if (itemType === 'announcement') {
              await announcementService.deleteAnnouncement(item.id);
            } else if (itemType === 'feedback') {
              await feedbackService.deleteFeedback(item.id);
            } else {
              await api.delete(`/admin/posts/${item.id}`);
            }
            successMessage = `${TYPE_LABELS[itemType]}を削除しました`;
            
            // Refresh current page data
            if (tabValue === 0) {
              fetchAnnouncements(announcementsPagination.currentPage);
            } else if (tabValue === 1) {
              fetchPosts(postsPagination.currentPage);
            } else if (tabValue === 2) {
              fetchFeedbackItems(feedbackPagination.currentPage);
            } else {
              fetchFlaggedContent(flaggedPagination.currentPage);
            }
            
            setSnackbar({
              open: true,
              message: successMessage,
              severity: 'success'
            });
          } catch (error) {
            console.error(`Failed to delete ${itemType}:`, error);
            showError('エラー', `${TYPE_LABELS[itemType]}を削除できませんでした。もう一度お試しください。`);
          }
        }
        break;
        
      case 'unflag':
        confirmResult = await showConfirm({
          title: '通報を解除しますか？',
          text: `この${TYPE_LABELS[itemType]}は「通報された内容」に表示されなくなります。`,
          icon: 'question',
          confirmButtonText: '解除する',
          cancelButtonText: 'キャンセル',
        });
        
        if (confirmResult.isConfirmed) {
          try {
            let endpoint = '';
            if (itemType === 'announcement') {
              endpoint = `/admin/announcements/${item.id}/unflag`;
            } else if (itemType === 'feedback') {
              endpoint = `/admin/feedback/${item.id}/unflag`;
            } else {
              endpoint = `/admin/posts/${item.id}/unflag`;
            }
            
            await api.post(endpoint);
            successMessage = '通報を解除しました';
            
            // Refresh current page data
            if (tabValue === 0) {
              fetchAnnouncements(announcementsPagination.currentPage);
            } else if (tabValue === 1) {
              fetchPosts(postsPagination.currentPage);
            } else if (tabValue === 2) {
              fetchFeedbackItems(feedbackPagination.currentPage);
            } else {
              fetchFlaggedContent(flaggedPagination.currentPage);
            }
            
            setSnackbar({
              open: true,
              message: successMessage,
              severity: 'success'
            });
          } catch (error) {
            console.error(`Failed to unflag ${itemType}:`, error);
            showError('エラー', '通報を解除できませんでした。もう一度お試しください。');
          }
        }
        break;
        
      case 'blockUser':
        const userId = item.author?.userId;
        const userName = item.author?.name;
        
        confirmResult = await showConfirm({
          title: 'アカウントを停止しますか？',
          text: `${userName ? `${userName} さん` : 'このユーザー'}はログインできなくなります。`,
          icon: 'warning',
          confirmButtonText: '停止する',
          cancelButtonText: 'キャンセル',
        });
        
        if (confirmResult.isConfirmed) {
          try {
            await api.put(`/admin/users/${userId}/status`, { isActive: false });
            successMessage = 'アカウントを停止しました';
            
            // Refresh current page data
            if (tabValue === 0) {
              fetchAnnouncements(announcementsPagination.currentPage);
            } else if (tabValue === 1) {
              fetchPosts(postsPagination.currentPage);
            } else if (tabValue === 2) {
              fetchFeedbackItems(feedbackPagination.currentPage);
            } else {
              fetchFlaggedContent(flaggedPagination.currentPage);
            }
            
            setSnackbar({
              open: true,
              message: successMessage,
              severity: 'success'
            });
          } catch (error) {
            console.error('Failed to block user:', error);
            showError('エラー', 'アカウントを停止できませんでした。もう一度お試しください。');
          }
        }
        break;
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!announcementContent.trim()) {
      setSnackbar({
        open: true,
        message: 'お知らせの内容を入力してください',
        severity: 'error'
      });
      return;
    }
    
    try {
      const newAnnouncement = await announcementService.createAnnouncement({ content: announcementContent });
      
      setSnackbar({
        open: true,
        message: 'お知らせを投稿しました',
        severity: 'success'
      });
      setAnnouncementDialog(false);
      setAnnouncementContent('');
      
      if (tabValue === 0) {
        fetchAnnouncements(1);
        setAnnouncementsPagination(prev => ({ ...prev, currentPage: 1 }));
      }
    } catch (error) {
      console.error('Failed to create announcement:', error);
      setSnackbar({
        open: true,
        message: 'お知らせを投稿できませんでした。もう一度お試しください。',
        severity: 'error'
      });
    }
  };

  const getFilteredItems = () => {
    if (tabValue === 0) {
      return announcements.filter(announcement =>
        announcement.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        announcement.author?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else if (tabValue === 1) {
      return posts.filter(post =>
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else if (tabValue === 2) {
      return feedbackItems.filter(feedback =>
        feedback.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        feedback.author?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else {
      // Flagged content - combine all three
      const filteredPosts = posts.filter(post =>
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author?.name.toLowerCase().includes(searchQuery.toLowerCase())
      ).map(p => ({ ...p, itemType: 'post' }));
      
      const filteredAnnouncements = announcements.filter(announcement =>
        announcement.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        announcement.author?.name.toLowerCase().includes(searchQuery.toLowerCase())
      ).map(a => ({ ...a, itemType: 'announcement' }));
      
      const filteredFeedback = feedbackItems.filter(feedback =>
        feedback.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        feedback.author?.name.toLowerCase().includes(searchQuery.toLowerCase())
      ).map(f => ({ ...f, itemType: 'feedback' }));
      
      return [...filteredAnnouncements, ...filteredPosts, ...filteredFeedback];
    }
  };

  const ItemCard = ({ item, itemType }: { item: any; itemType?: 'post' | 'announcement' | 'feedback' }) => {
    const [itemAnchorEl, setItemAnchorEl] = useState<null | HTMLElement>(null);
    
    // Determine item type based on tab or explicit prop
    const type = itemType || (tabValue === 0 ? 'announcement' : tabValue === 1 ? 'post' : tabValue === 2 ? 'feedback' : item.itemType);
    
    return (
      <Card sx={{ 
        mb: 2, 
        ...(type === 'announcement' && {
          border: "2px solid",
          borderColor: "primary.main",
        }),
        ...(type === 'feedback' && {
          border: "2px solid",
          borderColor: "secondary.main",
        }),
        position: 'relative',
        overflow: 'hidden',
      }}>
        <CardContent sx={{ pb: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="start">
            <Stack direction="row" spacing={2}>
              <Avatar
                sx={{ width: 48, height: 48 }}
              >
                {item.author?.name?.[0] || item.author?.email?.[0]?.toUpperCase()}
              </Avatar>
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                  <Typography 
                    variant="subtitle1" 
                    fontWeight={600}
                    color="text.primary"
                  >
                    {item.author?.name || '名前未設定'}
                  </Typography>
                  {type === 'announcement' && (
                    <Chip 
                      icon={<Campaign />} 
                      label="お知らせ" 
                      size="small" 
                      color="primary"
                    />
                  )}
                  {type === 'feedback' && (
                    <Chip 
                      icon={<Feedback />} 
                      label="フィードバック" 
                      size="small" 
                      color="secondary"
                    />
                  )}
                  {item.isFlagged && (
                    <Chip 
                      icon={<Flag />} 
                      label="通報あり" 
                      size="small" 
                      color="error"
                    />
                  )}
                </Stack>
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ fontSize: "0.8rem" }}
                >
                  {item.author?.email} ・ {formatDateTime(item.createdAt)}
                </Typography>
              </Box>
            </Stack>
            <Box sx={{ position: 'relative' }}>
              <IconButton
                aria-label="操作メニュー"
                onClick={(e) => {
                  e.stopPropagation();
                  setItemAnchorEl(e.currentTarget);
                }}
                sx={{ 
                  color: "text.secondary",
                  "&:hover": {
                    color: "text.primary",
                    bgcolor: "action.hover",
                  },
                }}
              >
                <MoreVert />
              </IconButton>
              <Menu
                anchorEl={itemAnchorEl}
                open={Boolean(itemAnchorEl)}
                onClose={() => setItemAnchorEl(null)}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <MenuItem 
                  onClick={() => {
                    setItemAnchorEl(null);
                    handlePostAction('delete', item, type);
                  }}
                  sx={{ color: 'error.main' }}
                >
                  <Delete sx={{ mr: 1.5 }} /> {TYPE_LABELS[type as ItemType]}を削除
                </MenuItem>
                {item.isFlagged && (
                  <MenuItem 
                    onClick={() => {
                      setItemAnchorEl(null);
                      handlePostAction('unflag', item, type);
                    }}
                    sx={{ color: 'success.main' }}
                  >
                    <CheckCircle sx={{ mr: 1.5 }} /> 通報を解除
                  </MenuItem>
                )}
                <MenuItem 
                  onClick={() => {
                    setItemAnchorEl(null);
                    handlePostAction('blockUser', item, type);
                  }}
                  sx={{ color: 'warning.main' }}
                >
                  <Block sx={{ mr: 1.5 }} /> アカウントを停止
                </MenuItem>
              </Menu>
            </Box>
          </Stack>

          <Typography 
            variant="body1" 
            sx={{ 
              mt: 2, 
              mb: 2,
              whiteSpace: "pre-wrap"
            }}
          >
            {item.content}
          </Typography>

          {/* Media display for posts and feedback */}
          {(type === 'post' || type === 'feedback') && item.mediaUrls && item.mediaUrls.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {item.mediaUrls.map((url: string, index: number) => (
                  <Box key={index}>
                    {isVideo(url) ? (
                      <video
                        src={url}
                        controls
                        style={{
                          width: 100,
                          height: 100,
                          objectFit: 'cover',
                          borderRadius: 4,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        このブラウザでは動画を再生できません。
                      </video>
                    ) : (
                      <Box
                        component="img"
                        src={url}
                        alt={`添付画像 ${index + 1}`}
                        sx={{
                          width: 100,
                          height: 100,
                          objectFit: 'cover',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider'
                        }}
                      />
                    )}
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          {/* Likes and Comments Display */}
          <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" spacing={3} sx={{ color: 'text.secondary', alignItems: 'center' }}>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <ThumbUp sx={{ fontSize: '1rem' }} aria-label="いいね" />
                <Typography variant="body2" component="span" fontWeight="500">
                  {item.likesCount}
                </Typography>
              </Stack>
              
              {item.commentsCount !== undefined && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Comment sx={{ fontSize: '1rem' }} aria-label="コメント" />
                  <Typography variant="body2" component="span" fontWeight="500">
                    {item.commentsCount}
                  </Typography>
                </Stack>
              )}
            </Stack>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const filteredItems = getFilteredItems();
  const currentPagination = getCurrentPagination();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <AdminNavigationButton titlePage="コミュニティの管理" />
        <Button
          variant="contained"
          startIcon={<Campaign />}
          onClick={() => setAnnouncementDialog(true)}
        >
          お知らせを投稿
        </Button>
      </Stack>

      {tabValue === 3 && filteredItems.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          確認が必要な内容が{currentPagination.total}件あります
        </Alert>
      )}

      <Card>
        <CardContent>
          <TextField
            fullWidth
            placeholder="内容や名前で検索"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />

          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
            <Tab 
              label={`お知らせ${currentPagination.total > 0 && tabValue === 0 ? `（${currentPagination.total}）` : ''}`}
            />
            <Tab 
              label={`投稿${currentPagination.total > 0 && tabValue === 1 ? `（${currentPagination.total}）` : ''}`}
            />
            <Tab 
              label={`フィードバック${currentPagination.total > 0 && tabValue === 2 ? `（${currentPagination.total}）` : ''}`}
            />
            <Tab 
              label="通報された内容"
              icon={<Flag />} 
              iconPosition="end"
            />
          </Tabs>

          <Box>
            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : filteredItems.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" py={4}>
                {tabValue === 0 ? 'お知らせ' : tabValue === 1 ? '投稿' : tabValue === 2 ? 'フィードバック' : '通報された内容'}はありません
              </Typography>
            ) : (
              <>
                {filteredItems.map((item: any) => (
                  <ItemCard 
                    key={item.id} 
                    item={item} 
                    itemType={tabValue === 0 ? 'announcement' : tabValue === 1 ? 'post' : tabValue === 2 ? 'feedback' : item.itemType} 
                  />
                ))}

                {/* Pagination */}
                {currentPagination.totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Pagination
                      count={currentPagination.totalPages}
                      page={currentPagination.currentPage}
                      onChange={handlePageChange}
                      color="primary"
                      size="large"
                      showFirstButton
                      showLastButton
                      sx={{
                        '& .MuiPaginationItem-root': {
                          fontSize: '1rem',
                          fontWeight: 500,
                        },
                      }}
                    />
                  </Box>
                )}

                {/* Pagination Info */}
                {currentPagination.total > 0 && (
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      全{currentPagination.total}件中 {((currentPagination.currentPage - 1) * currentPagination.limit) + 1}〜
                      {Math.min(currentPagination.currentPage * currentPagination.limit, currentPagination.total)}件を表示
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Announcement Dialog */}
      <Dialog
        open={announcementDialog}
        onClose={() => setAnnouncementDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>お知らせを投稿</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="お知らせの内容を入力してください"
            value={announcementContent}
            onChange={(e) => setAnnouncementContent(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnnouncementDialog(false)}>キャンセル</Button>
          <Button
            variant="contained"
            onClick={handleCreateAnnouncement}
            disabled={!announcementContent.trim()}
          >
            投稿する
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};