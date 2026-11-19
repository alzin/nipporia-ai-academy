import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  Stack,
  Avatar,
  Button,
  Alert,
  Snackbar,
  Collapse,
  Divider,
  Badge,
  Tooltip,
  Paper,
  Skeleton,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Search,
  MoreVert,
  FilterList,
  Block,
  CheckCircle,
  ArrowUpward,
  ArrowDownward,
  Close,
  RestartAlt,
  CalendarMonth,
  Person,
  CreditCard,
  ToggleOn,
} from "@mui/icons-material";
import api from "../../services/api";
import { useSweetAlert } from "../../utils/sweetAlert";
import AdminNavigationButton from "../../components/admin/AdminNavigationButton";

// ── Filter Types ───────────────────────────────────────────────────────────────
interface FilterState {
  roles: string[];
  statuses: string[];
  subscriptions: string[];
  dateFrom: string;
  dateTo: string;
}

const INITIAL_FILTERS: FilterState = {
  roles: [],
  statuses: [],
  subscriptions: [],
  dateFrom: "",
  dateTo: "",
};

const ROLE_OPTIONS = ["ADMIN", "STUDENT"];
const STATUS_OPTIONS = ["Active", "Inactive"];
const SUBSCRIPTION_OPTIONS = [
  "active",
  "trialing",
  "canceled",
  "No Subscription",
];

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "管理者",
  STUDENT: "受講者",
};

const STATUS_LABELS: Record<string, string> = {
  Active: "有効",
  Inactive: "停止中",
};

const SUBSCRIPTION_LABELS: Record<string, string> = {
  active: "契約中",
  trialing: "無料体験中",
  canceled: "解約済み",
  past_due: "支払い遅延",
  unpaid: "未払い",
  incomplete: "手続き中",
  incomplete_expired: "期限切れ",
  paused: "一時停止",
  "No Subscription": "なし",
};

const labelFor = (map: Record<string, string>, value: string) =>
  map[value] ?? value;

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

type SortField = "joined" | "name";

// ── Reusable FilterChipGroup ───────────────────────────────────────────────────
const FilterChipGroup: React.FC<{
  label: string;
  icon: React.ReactElement;
  options: string[];
  selected: string[];
  onChange: (value: string[]) => void;
  labelMap?: Record<string, string>;
  colorMap?: Record<
    string,
    | "default"
    | "primary"
    | "secondary"
    | "error"
    | "info"
    | "success"
    | "warning"
  >;
}> = ({ label, icon, options, selected, onChange, labelMap, colorMap }) => {
  const theme = useTheme();

  const handleToggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 1 }}>
        {React.cloneElement(icon as React.ReactElement<any>, {
          sx: { fontSize: 18, color: theme.palette.text.secondary },
        })}
        <Typography
          variant="caption"
          fontWeight={600}
          color="text.secondary"
        >
          {label}
        </Typography>
      </Stack>
      <Stack direction="row" flexWrap="wrap" gap={0.75}>
        {options.map((option) => {
          const isSelected = selected.includes(option);
          const chipColor = colorMap?.[option] || "default";
          return (
            <Chip
              key={option}
              label={labelMap ? labelFor(labelMap, option) : option}
              size="small"
              clickable
              variant={isSelected ? "filled" : "outlined"}
              color={isSelected ? chipColor : "default"}
              onClick={() => handleToggle(option)}
              sx={{
                fontWeight: isSelected ? 600 : 400,
                borderWidth: isSelected ? 0 : 1,
                transition: "all 0.2s ease",
                "&:hover": {
                  transform: "translateY(-1px)",
                  boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`,
                },
              }}
            />
          );
        })}
      </Stack>
    </Box>
  );
};

interface User {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  profile?: {
    name: string;
  };
  subscriptionStatus: string;
}

export const UserManagement: React.FC = () => {
  const theme = useTheme();
  const { showConfirm, showError } = useSweetAlert();
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [usersLoading, setUsersLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning" | "info",
  });

  // ── Filter State ───────────────────────────────────────────────────────────
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>("joined");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);

    try {
      const response = await api.get("/admin/users", {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search: searchQuery || undefined,
          roles: filters.roles.length ? filters.roles.join(",") : undefined,
          statuses: filters.statuses.length
            ? filters.statuses.join(",")
            : undefined,
          subscriptions: filters.subscriptions.length
            ? filters.subscriptions.join(",")
            : undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
          sortField,
          sortOrder,
        },
      });
      setUsers(response.data.users);
      setTotalUsers(response.data.total || 0);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setUsersLoading(false);
    }
  }, [
    page,
    rowsPerPage,
    searchQuery,
    filters,
    sortField,
    sortOrder,
  ]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUserAction = (action: string, user: User) => {
    setSelectedUser(user);
    setAnchorEl(null);

    switch (action) {
      case "toggleStatus":
        toggleUserStatus(user);
        break;
      case "changeRole":
        // Implement role change
        break;
    }
  };

  const toggleUserStatus = async (user: User) => {
    const action = user.isActive ? "停止" : "再開";
    const displayName = user.profile?.name || user.email;
    const result = await showConfirm({
      title: user.isActive
        ? "アカウントを停止しますか？"
        : "アカウントを再開しますか？",
      text: user.isActive
        ? `${displayName} さんはログインできなくなります。`
        : `${displayName} さんはまたログインできるようになります。`,
      icon: "warning",
      confirmButtonText: `${action}する`,
      cancelButtonText: "キャンセル",
    });

    if (result.isConfirmed) {
      try {
        await api.put(`/admin/users/${user.id}/status`, {
          isActive: !user.isActive,
        });
        setSnackbar({
          open: true,
          message: `アカウントを${action}しました`,
          severity: "success",
        });
        fetchUsers();
      } catch (error) {
        console.error("Failed to update user status:", error);
        showError(
          "エラー",
          `アカウントを${action}できませんでした。もう一度お試しください。`,
        );
      }
    }
  };

  // ── Filter Helpers ─────────────────────────────────────────────────────────
  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K],
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setSearchQuery("");
    setPage(0);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.roles.length > 0) count++;
    if (filters.statuses.length > 0) count++;
    if (filters.subscriptions.length > 0) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    return count;
  }, [filters]);

  // ── Active Filter Tags (for chips display) ────────────────────────────────
  const activeFilterTags = useMemo(() => {
    const tags: { key: string; label: string; onRemove: () => void }[] = [];

    filters.roles.forEach((role) =>
      tags.push({
        key: `role-${role}`,
        label: `権限：${labelFor(ROLE_LABELS, role)}`,
        onRemove: () =>
          updateFilter(
            "roles",
            filters.roles.filter((r) => r !== role),
          ),
      }),
    );
    filters.statuses.forEach((status) =>
      tags.push({
        key: `status-${status}`,
        label: `状態：${labelFor(STATUS_LABELS, status)}`,
        onRemove: () =>
          updateFilter(
            "statuses",
            filters.statuses.filter((s) => s !== status),
          ),
      }),
    );
    filters.subscriptions.forEach((sub) =>
      tags.push({
        key: `sub-${sub}`,
        label: `サブスクリプション：${labelFor(SUBSCRIPTION_LABELS, sub)}`,
        onRemove: () =>
          updateFilter(
            "subscriptions",
            filters.subscriptions.filter((s) => s !== sub),
          ),
      }),
    );
    if (filters.dateFrom)
      tags.push({
        key: "dateFrom",
        label: `${filters.dateFrom} から`,
        onRemove: () => updateFilter("dateFrom", ""),
      });
    if (filters.dateTo)
      tags.push({
        key: "dateTo",
        label: `${filters.dateTo} まで`,
        onRemove: () => updateFilter("dateTo", ""),
      });

    return tags;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const filteredUsers = users;
  const skeletonRowCount = Math.min(rowsPerPage, 8);

  const handleSortToggle = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
    setPage(0);
  };

  const SortIndicator: React.FC<{ field: SortField }> = ({ field }) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? (
      <ArrowUpward sx={{ fontSize: 16 }} />
    ) : (
      <ArrowDownward sx={{ fontSize: 16 }} />
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <AdminNavigationButton titlePage="ユーザー管理" />
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography variant="body2" color="text.secondary">
            {totalUsers.toLocaleString("ja-JP")}人
          </Typography>
          <Tooltip title={filtersOpen ? "絞り込みを閉じる" : "絞り込みを開く"}>
            <Badge
              badgeContent={activeFilterCount}
              color="primary"
              overlap="circular"
              sx={{
                "& .MuiBadge-badge": { fontSize: 11, minWidth: 18, height: 18 },
              }}
            >
              <Button
                variant={filtersOpen ? "contained" : "outlined"}
                startIcon={<FilterList />}
                onClick={() => setFiltersOpen(!filtersOpen)}
                sx={{ minWidth: 100 }}
              >
                絞り込み
              </Button>
            </Badge>
          </Tooltip>
        </Stack>
      </Stack>

      {/* ── Collapsible Filter Panel ────────────────────────────────────────── */}
      <Collapse in={filtersOpen} timeout={300}>
        <Paper
          variant="outlined"
          sx={{
            mb: 3,
            p: 3,
            borderRadius: 3,
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={2.5}
          >
            <Typography variant="subtitle1" fontWeight={600}>
              ユーザーを絞り込む
            </Typography>
            <Stack direction="row" spacing={1}>
              {activeFilterCount > 0 && (
                <Button
                  size="small"
                  startIcon={<RestartAlt />}
                  onClick={resetFilters}
                  color="inherit"
                >
                  すべてリセット
                </Button>
              )}
              <IconButton
                size="small"
                aria-label="絞り込みを閉じる"
                onClick={() => setFiltersOpen(false)}
              >
                <Close fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>

          {/* Row 1: Categorical filters */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
                md: "1fr 1fr 1fr 1fr",
              },
              gap: 3,
              mb: 3,
            }}
          >
            <FilterChipGroup
              label="権限"
              icon={<Person />}
              options={ROLE_OPTIONS}
              labelMap={ROLE_LABELS}
              selected={filters.roles}
              onChange={(val) => updateFilter("roles", val)}
              colorMap={{ ADMIN: "error", STUDENT: "primary" }}
            />
            <FilterChipGroup
              label="アカウントの状態"
              icon={<ToggleOn />}
              options={STATUS_OPTIONS}
              labelMap={STATUS_LABELS}
              selected={filters.statuses}
              onChange={(val) => updateFilter("statuses", val)}
              colorMap={{ Active: "success", Inactive: "default" }}
            />
            <FilterChipGroup
              label="サブスクリプション"
              icon={<CreditCard />}
              options={SUBSCRIPTION_OPTIONS}
              labelMap={SUBSCRIPTION_LABELS}
              selected={filters.subscriptions}
              onChange={(val) => updateFilter("subscriptions", val)}
              colorMap={{
                active: "info",
                trialing: "warning",
                canceled: "error",
                "No Subscription": "default",
              }}
            />
          </Box>

          <Divider sx={{ mb: 2.5 }} />

          {/* Row 2: Range filters */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
                md: "1fr 1fr",
              },
              gap: 3,
            }}
          >
            {/* Date Range */}
            <Box>
              <Stack
                direction="row"
                spacing={0.5}
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <CalendarMonth
                  sx={{ fontSize: 18, color: theme.palette.text.secondary }}
                />
                <Typography
                  variant="caption"
                  fontWeight={600}
                  color="text.secondary"
                >
                  登録日
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1.5}>
                <TextField
                  type="date"
                  size="small"
                  label="開始日"
                  value={filters.dateFrom}
                  onChange={(e) => updateFilter("dateFrom", e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField
                  type="date"
                  size="small"
                  label="終了日"
                  value={filters.dateTo}
                  onChange={(e) => updateFilter("dateTo", e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Stack>
            </Box>

          </Box>
        </Paper>
      </Collapse>

      {/* ── Active Filter Chips ─────────────────────────────────────────────── */}
      {activeFilterTags.length > 0 && !filtersOpen && (
        <Stack
          direction="row"
          flexWrap="wrap"
          gap={1}
          mb={2}
          alignItems="center"
        >
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={600}
            mr={0.5}
          >
            絞り込み中：
          </Typography>
          {activeFilterTags.map((tag) => (
            <Chip
              key={tag.key}
              label={tag.label}
              size="small"
              onDelete={tag.onRemove}
              deleteIcon={<Close sx={{ fontSize: 14 }} />}
              sx={{
                borderRadius: 2,
                fontWeight: 500,
                bgcolor: "action.hover",
                "& .MuiChip-deleteIcon": {
                  color: theme.palette.text.secondary,
                  "&:hover": { color: theme.palette.error.main },
                },
              }}
            />
          ))}
          <Chip
            label="すべて解除"
            size="small"
            variant="outlined"
            onClick={resetFilters}
            sx={{ fontWeight: 500, borderStyle: "dashed" }}
          />
        </Stack>
      )}

      {/* ── Main Table Card ─────────────────────────────────────────────────── */}
      <Card>
        <CardContent>
          <TextField
            fullWidth
            placeholder="名前かメールアドレスで検索"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    aria-label="検索をクリア"
                    onClick={() => setSearchQuery("")}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{ cursor: "pointer", userSelect: "none" }}
                    onClick={() => handleSortToggle("name")}
                  >
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Typography variant="body2" fontWeight={600}>
                        ユーザー
                      </Typography>
                      <SortIndicator field="name" />
                    </Stack>
                  </TableCell>
                  <TableCell>権限</TableCell>
                  <TableCell>状態</TableCell>
                  <TableCell>サブスクリプション</TableCell>
                  <TableCell
                    sx={{ cursor: "pointer", userSelect: "none" }}
                    onClick={() => handleSortToggle("joined")}
                  >
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Typography variant="body2" fontWeight={600}>
                        登録日
                      </Typography>
                      <SortIndicator field="joined" />
                    </Stack>
                  </TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usersLoading ? (
                  Array.from({ length: skeletonRowCount }).map((_, index) => (
                    <TableRow key={`skeleton-row-${index}`}>
                      <TableCell>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Skeleton variant="circular" width={36} height={36} />
                          <Box sx={{ width: "100%" }}>
                            <Skeleton variant="text" width="45%" height={22} />
                            <Skeleton variant="text" width="60%" height={18} />
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Skeleton variant="rounded" width={70} height={24} />
                      </TableCell>
                      <TableCell>
                        <Skeleton variant="rounded" width={90} height={24} />
                      </TableCell>
                      <TableCell>
                        <Skeleton variant="rounded" width={110} height={24} />
                      </TableCell>
                      <TableCell>
                        <Skeleton variant="text" width={78} height={22} />
                      </TableCell>
                      <TableCell align="right">
                        <Skeleton
                          variant="circular"
                          width={30}
                          height={30}
                          sx={{ ml: "auto" }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Stack alignItems="center" spacing={1}>
                        <FilterList
                          sx={{ fontSize: 40, color: "text.disabled" }}
                        />
                        <Typography color="text.secondary">
                          条件に合うユーザーがいません
                        </Typography>
                        {activeFilterCount > 0 && (
                          <Button size="small" onClick={resetFilters}>
                            絞り込みを解除
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                      <TableRow key={user.id} hover>
                        <TableCell>
                          <Stack
                            direction="row"
                            spacing={2}
                            alignItems="center"
                          >
                            <Avatar
                              sx={{
                                bgcolor: "primary.main",
                                width: 36,
                                height: 36,
                                fontSize: 14,
                              }}
                            >
                              {user.profile?.name?.[0] ||
                                user.email[0].toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography
                                  variant="body2"
                                  fontWeight={500}
                                  sx={{
                                    color: "text.primary",
                                    "&:hover": {
                                      color: "primary.main",
                                    },
                                    transition: "color 0.2s ease-in-out",
                                  }}
                                >
                                  {user.profile?.name || "名前未設定"}
                                </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {user.email}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={labelFor(ROLE_LABELS, user.role)}
                            size="small"
                            color={user.role === "ADMIN" ? "primary" : "default"}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={user.isActive ? <CheckCircle /> : <Block />}
                            label={user.isActive ? "有効" : "停止中"}
                            size="small"
                            color={user.isActive ? "success" : "default"}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={labelFor(
                              SUBSCRIPTION_LABELS,
                              user.subscriptionStatus,
                            )}
                            size="small"
                            color={
                              user.subscriptionStatus === "active"
                                ? "info"
                                : user.subscriptionStatus === "No Subscription"
                                  ? "default"
                                  : "warning"
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            aria-label="操作メニュー"
                            onClick={(e) => {
                              setAnchorEl(e.currentTarget);
                              setSelectedUser(user);
                            }}
                          >
                            <MoreVert fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={totalUsers}
            page={page}
            onPageChange={(_e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage="表示件数："
            labelDisplayedRows={({ from, to, count }) =>
              `${from}〜${to}件（全${count !== -1 ? count : `${to}以上`}件）`
            }
          />
        </CardContent>
      </Card>

      {/* ── Action Menu ─────────────────────────────────────────────────────── */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem
          onClick={() => handleUserAction("toggleStatus", selectedUser!)}
        >
          {selectedUser?.isActive ? "アカウントを停止" : "アカウントを再開"}
        </MenuItem>
      </Menu>

      {/* ── Snackbar ────────────────────────────────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};
