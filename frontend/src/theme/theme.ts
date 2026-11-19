import { alpha, createTheme, responsiveFontSizes } from '@mui/material/styles';

// Colors from the course landing page (marketing/course1).
export const colors = {
  paper: '#F4F1EB',
  card: '#FFFDF9',
  ink: '#23211D',
  muted: '#5F5B54',
  line: '#E3DDD2',
  lineStrong: '#CFC6B8',
  accent: '#AE4A24',
  accentHover: '#8F3B1B',
  accentSoft: '#F8E6DD',
  blue: '#3C5A80',
  blueHover: '#2F4766',
  success: '#3F6B4A',
  successSoft: '#E4EEE3',
  error: '#A23B2E',
  errorSoft: '#F6E1DC',
  warning: '#8A5A12',
  warningSoft: '#F6ECD7',
  info: '#3C5A80',
  infoSoft: '#E3E9F1',
} as const;

export const fontFamily =
  '"Zen Kaku Gothic New", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic UI", "Meiryo", sans-serif';

const focusRing = {
  outline: `3px solid ${colors.blue}`,
  outlineOffset: 2,
};

export const theme = responsiveFontSizes(
  createTheme({
    palette: {
      primary: {
        main: colors.accent,
        dark: colors.accentHover,
        light: colors.accentSoft,
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: colors.blue,
        dark: colors.blueHover,
        light: colors.infoSoft,
        contrastText: '#FFFFFF',
      },
      success: { main: colors.success, light: colors.successSoft, contrastText: '#FFFFFF' },
      error: { main: colors.error, light: colors.errorSoft, contrastText: '#FFFFFF' },
      warning: { main: colors.warning, light: colors.warningSoft, contrastText: '#FFFFFF' },
      info: { main: colors.info, light: colors.infoSoft, contrastText: '#FFFFFF' },
      background: {
        default: colors.paper,
        paper: colors.card,
      },
      text: {
        primary: colors.ink,
        secondary: colors.muted,
      },
      divider: colors.line,
      action: {
        hover: alpha(colors.ink, 0.04),
        selected: colors.accentSoft,
      },
    },
    typography: {
      fontFamily,
      fontSize: 15,
      h1: { fontSize: '2.25rem', fontWeight: 700, lineHeight: 1.45, letterSpacing: '0.01em' },
      h2: { fontSize: '1.875rem', fontWeight: 700, lineHeight: 1.45, letterSpacing: '0.01em' },
      h3: { fontSize: '1.625rem', fontWeight: 700, lineHeight: 1.45, letterSpacing: '0.01em' },
      h4: { fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.5, letterSpacing: '0.01em' },
      h5: { fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.5, letterSpacing: '0.01em' },
      h6: { fontSize: '1.0625rem', fontWeight: 700, lineHeight: 1.55, letterSpacing: '0.01em' },
      subtitle1: { fontWeight: 500, lineHeight: 1.7 },
      subtitle2: { fontWeight: 700, lineHeight: 1.6 },
      body1: { fontSize: '1rem', lineHeight: 1.75 },
      body2: { fontSize: '0.875rem', lineHeight: 1.7 },
      caption: { lineHeight: 1.6 },
      button: { textTransform: 'none', fontWeight: 700, letterSpacing: '0.04em' },
    },
    shape: {
      borderRadius: 10,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: colors.paper,
            color: colors.ink,
            fontFeatureSettings: '"palt"',
            letterSpacing: '0.02em',
            lineHeight: 1.75,
            WebkitFontSmoothing: 'antialiased',
          },
          '::selection': { backgroundColor: colors.accentSoft, color: colors.ink },
          'a:focus-visible, button:focus-visible, [role="button"]:focus-visible': focusRing,
        },
      },
      MuiButtonBase: {
        defaultProps: { disableRipple: false },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 999,
            minHeight: 44,
            paddingLeft: 20,
            paddingRight: 20,
            boxShadow: 'none',
            transition: 'background-color .15s ease, border-color .15s ease, color .15s ease',
            '&.Mui-focusVisible': focusRing,
          },
          sizeSmall: { minHeight: 36, paddingLeft: 14, paddingRight: 14 },
          sizeLarge: { minHeight: 52, paddingLeft: 26, paddingRight: 26, fontSize: '1rem' },
          containedPrimary: {
            backgroundColor: colors.accent,
            '&:hover': { backgroundColor: colors.accentHover, boxShadow: 'none' },
          },
          outlined: {
            borderColor: colors.lineStrong,
            backgroundColor: colors.card,
          },
          outlinedPrimary: {
            borderColor: colors.accent,
            color: colors.accentHover,
            '&:hover': { backgroundColor: colors.accentSoft, borderColor: colors.accentHover },
          },
          textPrimary: {
            color: colors.accentHover,
            '&:hover': { backgroundColor: colors.accentSoft },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            '&.Mui-focusVisible': focusRing,
          },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: { backgroundImage: 'none' },
          outlined: { borderColor: colors.line },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundColor: colors.card,
            border: `1px solid ${colors.line}`,
            borderRadius: 14,
            boxShadow: 'none',
          },
        },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0, color: 'inherit' },
        styleOverrides: {
          root: {
            backgroundColor: colors.paper,
            color: colors.ink,
            borderBottom: `1px solid ${colors.lineStrong}`,
            boxShadow: 'none',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 14,
            border: `1px solid ${colors.line}`,
            boxShadow: '0 18px 40px -24px rgba(60,40,20,.35)',
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            border: `1px solid ${colors.line}`,
            boxShadow: '0 12px 28px -18px rgba(60,40,20,.35)',
          },
        },
      },
      MuiPopover: {
        styleOverrides: {
          paper: {
            border: `1px solid ${colors.line}`,
            boxShadow: '0 12px 28px -18px rgba(60,40,20,.35)',
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: { minHeight: 44 },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: { backgroundColor: colors.card, borderColor: colors.line },
        },
      },
      MuiDivider: {
        styleOverrides: { root: { borderColor: colors.line } },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 8, fontWeight: 500 },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: { backgroundColor: colors.ink, fontSize: '0.8125rem', lineHeight: 1.6 },
          arrow: { color: colors.ink },
        },
      },
      MuiLink: {
        defaultProps: { underline: 'always' },
        styleOverrides: {
          root: {
            color: colors.blue,
            fontWeight: 700,
            textUnderlineOffset: '0.25em',
            textDecorationColor: alpha(colors.blue, 0.35),
            '&:hover': { textDecorationColor: 'currentColor' },
            '&.Mui-focusVisible, &:focus-visible': { ...focusRing, borderRadius: 4 },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: colors.card,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.lineStrong },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.muted },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.accent, borderWidth: 2 },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            '& .MuiFormLabel-asterisk': { color: colors.error },
            '&.Mui-focused': { color: colors.accentHover },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 700,
            minHeight: 48,
            '&.Mui-selected': { color: colors.accentHover },
            '&.Mui-focusVisible': focusRing,
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: { backgroundColor: colors.accent, height: 3 },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: { borderRadius: 999, backgroundColor: colors.line },
          bar: { borderRadius: 999 },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: 10, alignItems: 'flex-start' },
          standardSuccess: { backgroundColor: colors.successSoft, color: colors.success },
          standardError: { backgroundColor: colors.errorSoft, color: colors.error },
          standardWarning: { backgroundColor: colors.warningSoft, color: colors.warning },
          standardInfo: { backgroundColor: colors.infoSoft, color: colors.info },
        },
      },
      MuiSnackbarContent: {
        styleOverrides: { root: { backgroundColor: colors.ink } },
      },
      MuiAvatar: {
        styleOverrides: {
          colorDefault: { backgroundColor: colors.accentSoft, color: colors.accentHover, fontWeight: 700 },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            '&.Mui-selected': { backgroundColor: colors.accentSoft },
            '&.Mui-selected:hover': { backgroundColor: colors.accentSoft },
            '&.Mui-focusVisible': focusRing,
          },
        },
      },
    },
  }),
);
