import { createTheme } from "@mui/material/styles";

/**
 * DevReady MUI 테마 — 원본(test-demo-UI) 정확 토큰 기준.
 * 값 출처: frontend/DESIGN_SPEC.md §8(보강 제안) + §1~6(정확 토큰).
 * 화면들은 이 테마를 공유하므로, 토큰만 참조해도 원본과 1:1 에 가까워진다.
 */
const theme = createTheme({
  // 1) 브레이크포인트를 Tailwind 값과 일치 (원본 sm:/md:/lg: 가 MUI 키와 1:1)
  breakpoints: { values: { xs: 0, sm: 640, md: 768, lg: 1024, xl: 1280 } },

  palette: {
    primary: { main: "#6C63FF", light: "#8B85FF", dark: "#4F46E5", contrastText: "#FFFFFF" },
    secondary: { main: "#5B5FEF" },
    // 시맨틱 (차트/뱃지에서 실제로 쓰는 값 — MUI 기본 위에 main 덮어쓰기)
    error: { main: "#EF4444", light: "#FEF2F2" }, // destructive / red
    warning: { main: "#F59E0B", light: "#FEF3C7" }, // amber
    success: { main: "#10B981", light: "#ECFDF5" }, // emerald
    info: { main: "#3B82F6", light: "#EFF6FF" }, // blue
    background: { default: "#FFFFFF", paper: "#FFFFFF" }, // 원본 body = 흰색
    text: { primary: "#0F172A", secondary: "#64748B", disabled: "#9CA3AF" }, // slate
    divider: "rgba(0,0,0,0.07)", // border-border
    grey: {
      // Tailwind gray 스케일 (화면이 직접 사용)
      50: "#F9FAFB",
      100: "#F3F4F6",
      200: "#E5E7EB",
      300: "#D1D5DB",
      400: "#9CA3AF",
      500: "#6B7280",
      600: "#4B5563",
      700: "#374151",
      800: "#1F2937",
      900: "#111827",
    },
  },

  typography: {
    fontFamily: "'Inter','Noto Sans KR',-apple-system,system-ui,sans-serif",
    fontWeightMedium: 500,
    h1: { fontSize: "1.5rem", fontWeight: 700, lineHeight: 1.4 }, // 화면 Hero는 인라인으로 키움
    h2: { fontSize: "1.25rem", fontWeight: 700, lineHeight: 1.4 },
    h3: { fontSize: "1.125rem", fontWeight: 600, lineHeight: 1.5 },
    h4: { fontSize: "1rem", fontWeight: 600, lineHeight: 1.5 },
    body1: { fontSize: "0.875rem", lineHeight: 1.5 }, // text-sm 기본
    body2: { fontSize: "0.75rem", lineHeight: 1.4 }, // text-xs
    button: { textTransform: "none", fontWeight: 600 },
  },

  shape: { borderRadius: 12 }, // --radius 0.75rem (rounded-xl)

  // 커스텀 토큰(테마 확장) : sx 에서 theme.brand.* 로 참조. (DESIGN_SPEC §6 그라데이션 정확값)
  brand: {
    gradient: "linear-gradient(135deg, #6C63FF 0%, #8B5CF6 100%)",
    gradientSoft: "linear-gradient(135deg, rgba(108,99,255,0.06), rgba(139,92,246,0.08))",
    banner: "linear-gradient(to right, #6366F1, #8B5CF6)",
    primarySoft: "rgba(108,99,255,0.1)", // bg-primary/10
    secondaryFill: "#F8F9FF", // bg-secondary
    accent: "#EEF0FF",
    mono: "'DM Mono', monospace",
    shadowBtn: "0 4px 16px rgba(99,102,241,0.25)",
  },

  // 공통 컴포넌트 override : 카드 rounded-2xl(16), 버튼 rounded-xl(12)·플랫
  components: {
    MuiPaper: { styleOverrides: { rounded: { borderRadius: 16 } } },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 12 } },
    },
  },
});

export default theme;
