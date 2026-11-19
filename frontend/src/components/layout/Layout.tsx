// frontend/src/components/layout/Layout.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  AppBar,
  Box,
  Button,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home,
  School,
  Groups,
  Logout,
  AdminPanelSettings,
  CreditCard,
  KeyboardArrowDown,
} from '@mui/icons-material';
import { logout } from '../../store/slices/authSlice';
import { RootState, AppDispatch } from '../../store/store';
import {
  fetchTourVideo,
  fetchTourVideoStatus,
  setShowTourModal,
  hideTourModal,
} from '../../store/slices/videoSlice';
import { TourVideoModal } from '../welcome-video/TourVideoModal';

export const BRAND_NAME = 'Nipporia AI Academy';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { title: 'ホーム', icon: <Home sx={{ fontSize: 20 }} />, path: '/dashboard' },
  { title: '講座', icon: <School sx={{ fontSize: 20 }} />, path: '/classroom' },
  { title: 'コミュニティ', icon: <Groups sx={{ fontSize: 20 }} />, path: '/community' },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();

  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const dashboardName = useSelector((state: RootState) => state.dashboard?.data?.user?.name);
  const profileName = useSelector((state: RootState) => state.profile?.data?.name);

  const displayName =
    user?.name || profileName || dashboardName || user?.email?.split('@')[0] || '';

  const { video, tourVideoStatus, showTourModal } = useSelector(
    (state: RootState) => state.videos
  );

  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  // Tour video for first-time login
  useEffect(() => {
    if (user) {
      Promise.all([dispatch(fetchTourVideo()), dispatch(fetchTourVideoStatus())]).catch(
        (error) => {
          console.error('Failed to load tour video data:', error);
        }
      );
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (!user) return;

    const shouldAutoShow =
      tourVideoStatus?.shouldShowTour && video && video.isActive && !showTourModal;

    if (shouldAutoShow) {
      const timer = setTimeout(() => {
        dispatch(setShowTourModal(true));
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [tourVideoStatus, video, showTourModal, dispatch, user]);

  const closeMenu = () => setMenuAnchor(null);

  const handleLogout = async () => {
    closeMenu();
    await dispatch(logout());
    navigate('/dashboard');
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const goFromDrawer = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const drawer = (
    <Box component="nav" aria-label="メインメニュー" sx={{ width: 260 }}>
      <Toolbar sx={{ minHeight: { xs: 64 } }}>
        <Typography sx={{ fontWeight: 700, letterSpacing: '0.04em' }}>{BRAND_NAME}</Typography>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={isActive(item.path)}
              aria-current={isActive(item.path) ? 'page' : undefined}
              onClick={() => goFromDrawer(item.path)}
              sx={{ minHeight: 48 }}
            >
              <ListItemIcon
                sx={{ minWidth: 36, color: isActive(item.path) ? 'primary.main' : 'text.secondary' }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.title}
                primaryTypographyProps={{ fontWeight: isActive(item.path) ? 700 : 500 }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      {!isAuthenticated && (
        <>
          <Divider />
          <Stack spacing={1} sx={{ p: 2 }}>
            <Button variant="contained" fullWidth onClick={() => goFromDrawer('/register')}>
              無料で登録
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              fullWidth
              onClick={() => goFromDrawer('/login')}
            >
              ログイン
            </Button>
          </Stack>
        </>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ gap: { xs: 1, md: 2 }, minHeight: { xs: 64 }, px: { xs: 1.5, sm: 3 } }}>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileOpen(true)}
              aria-label="メニューを開く"
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography
            component={Link}
            to="/dashboard"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              minHeight: 44,
              fontWeight: 700,
              fontSize: isMobile ? '0.95rem' : '1.1rem',
              letterSpacing: '0.04em',
              color: 'text.primary',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              borderRadius: 1,
            }}
          >
            {BRAND_NAME}
          </Typography>

          {!isMobile && (
            <Stack
              component="nav"
              aria-label="メインメニュー"
              direction="row"
              spacing={0.5}
              sx={{ ml: 2 }}
            >
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  component={Link}
                  to={item.path}
                  color="inherit"
                  aria-current={isActive(item.path) ? 'page' : undefined}
                  sx={{
                    fontWeight: isActive(item.path) ? 700 : 500,
                    color: isActive(item.path) ? 'primary.dark' : 'text.primary',
                    bgcolor: isActive(item.path) ? 'primary.light' : 'transparent',
                    '&:hover': {
                      bgcolor: isActive(item.path) ? 'primary.light' : 'action.hover',
                    },
                  }}
                >
                  {item.title}
                </Button>
              ))}
            </Stack>
          )}

          <Box sx={{ flexGrow: 1 }} />

          {isAuthenticated ? (
            <>
              <Button
                color="inherit"
                onClick={(e) => setMenuAnchor(e.currentTarget)}
                endIcon={<KeyboardArrowDown />}
                aria-label={displayName ? `${displayName}さんのメニュー` : 'アカウントのメニュー'}
                aria-haspopup="menu"
                aria-expanded={Boolean(menuAnchor)}
                sx={{ fontWeight: 500, maxWidth: { xs: 150, sm: 220 }, px: 1.5 }}
              >
                <Box
                  component="span"
                  sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {displayName}
                </Box>
              </Button>
              <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={closeMenu}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem
                  onClick={() => {
                    navigate('/manage-subscription');
                    closeMenu();
                  }}
                >
                  <ListItemIcon>
                    <CreditCard sx={{ fontSize: 20 }} />
                  </ListItemIcon>
                  サブスクリプション管理
                </MenuItem>
                {user?.role === 'ADMIN' && (
                  <MenuItem
                    onClick={() => {
                      navigate('/admin');
                      closeMenu();
                    }}
                  >
                    <ListItemIcon>
                      <AdminPanelSettings sx={{ fontSize: 20 }} />
                    </ListItemIcon>
                    管理画面
                  </MenuItem>
                )}
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <Logout sx={{ fontSize: 20 }} />
                  </ListItemIcon>
                  ログアウト
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                color="inherit"
                component={Link}
                to="/login"
                sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
              >
                ログイン
              </Button>
              <Button
                variant="contained"
                component={Link}
                to="/register"
                sx={{ whiteSpace: 'nowrap', px: { xs: 2, sm: 2.5 } }}
              >
                無料で登録
              </Button>
            </Stack>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile navigation */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' } }}
        PaperProps={{ sx: { maxWidth: '85vw' } }}
      >
        {drawer}
      </Drawer>

      <Box
        component="main"
        sx={{
          maxWidth: '100%',
          flexGrow: 1,
          bgcolor: 'background.default',
          minHeight: 'calc(100vh - 64px)',
          mt: '64px',
        }}
      >
        {children}
      </Box>

      <TourVideoModal
        open={showTourModal}
        onClose={() => dispatch(hideTourModal())}
        video={video}
        isFirstTimeUser={tourVideoStatus?.shouldShowTour || false}
      />
    </Box>
  );
};
