import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Stack,
  Button,
  Chip,
  Typography,
  IconButton,
  Collapse,
  Divider,
} from "@mui/material";
import { Menu as MenuIcon, Close, ChevronRight } from "@mui/icons-material";
import useAuthStore from "../../store/authStore";

/**
 * 공통 네비 헤더. 로그인 상태는 zustand authStore(token/user) 구독으로 판별.
 * 반응형: lg(1024) 이상은 가로 메뉴, 미만은 햄버거 → 드롭다운(Collapse) 패널
 * (원본 Root.tsx 의 lg:hidden 모바일 nav 패턴 1:1).
 */
const NAV = [
  { label: "교육", path: "/education" },
  { label: "공고", path: "/jobs" },
  { label: "캘린더", path: "/calendar" },
  { label: "이력서", path: "/resume" },
  { label: "모의 면접", path: "/interview", badge: "유료" },
  { label: "커뮤니티", path: "/community" },
];

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  // 모바일 메뉴 항목 클릭 시 이동 + 메뉴 닫기
  const go = (path) => {
    navigate(path);
    setMobileOpen(false);
  };
  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate("/");
  };

  return (
    <Box
      component="header"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: (t) => t.zIndex.appBar,
        bgcolor: "background.paper",
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Box
        sx={{
          maxWidth: 1280,
          mx: "auto",
          px: 2,
          height: 64,
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        {/* 로고 → / */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          onClick={() => go("/")}
          sx={{ cursor: "pointer", flexShrink: 0, userSelect: "none" }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              bgcolor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: 13, letterSpacing: "-0.05em" }}>
              DR
            </Typography>
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: 18 }}>DevReady</Typography>
        </Stack>

        {/* 중앙 메뉴 (lg 이상에서만 노출 — 원본 hidden lg:flex) */}
        <Stack
          direction="row"
          spacing={0.5}
          sx={{ display: { xs: "none", lg: "flex" }, alignItems: "center", flex: 1 }}
        >
          {NAV.map(({ label, path, badge }) => {
            const active = isActive(path);
            return (
              <Button
                key={path}
                onClick={() => navigate(path)}
                sx={{
                  color: active ? "primary.main" : "text.secondary",
                  fontWeight: active ? 600 : 400,
                  "&:hover": { color: "primary.main", bgcolor: "action.hover" },
                }}
              >
                {label}
                {badge && (
                  <Chip
                    label={badge}
                    size="small"
                    color="primary"
                    sx={{ ml: 0.75, height: 18, fontSize: 11 }}
                  />
                )}
              </Button>
            );
          })}
        </Stack>

        {/* 우측 영역 */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: "auto", flexShrink: 0 }}>
          {/* 로그인 영역 — lg 이상 (모바일에선 드롭다운으로 이동) */}
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ display: { xs: "none", lg: "flex" } }}
          >
            {token ? (
              <>
                <Button
                  size="small"
                  onClick={() => navigate("/mypage")}
                  sx={{ color: "text.secondary", "&:hover": { color: "primary.main", bgcolor: "action.hover" } }}
                >
                  {user?.nickname ?? "사용자"}님
                </Button>
                <Button size="small" onClick={handleLogout}>
                  로그아웃
                </Button>
              </>
            ) : (
              <>
                <Button size="small" sx={{ color: "text.secondary" }} onClick={() => navigate("/login")}>
                  로그인
                </Button>
                <Button size="small" variant="contained" color="primary" onClick={() => navigate("/signup")}>
                  무료 시작
                </Button>
              </>
            )}
          </Stack>

          {/* 햄버거 — lg 미만 (원본 lg:hidden) */}
          <IconButton
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "메뉴 닫기" : "메뉴 열기"}
            sx={{ display: { xs: "inline-flex", lg: "none" }, color: "text.secondary" }}
          >
            {mobileOpen ? <Close /> : <MenuIcon />}
          </IconButton>
        </Stack>
      </Box>

      {/* 모바일 드롭다운 메뉴 — lg 미만 (원본: lg:hidden border-t bg-card flex-col) */}
      <Collapse in={mobileOpen} sx={{ display: { lg: "none" } }}>
        <Box
          sx={{
            borderTop: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
            px: 2,
            py: 1.5,
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
          }}
        >
          {NAV.map(({ label, path, badge }) => {
            const active = isActive(path);
            return (
              <Box
                key={path}
                component="button"
                type="button"
                onClick={() => go(path)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 1.5,
                  py: 1.25,
                  borderRadius: "8px",
                  border: "none",
                  bgcolor: "transparent",
                  font: "inherit",
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "left",
                  transition: "background-color .2s",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography
                    sx={{
                      fontSize: 14,
                      color: active ? "primary.main" : "text.primary",
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    {label}
                  </Typography>
                  {badge && (
                    <Chip label={badge} size="small" color="primary" sx={{ height: 18, fontSize: 11 }} />
                  )}
                </Box>
                <ChevronRight sx={{ fontSize: 16, color: "text.secondary" }} />
              </Box>
            );
          })}

          <Divider sx={{ my: 1 }} />

          {/* 로그인 상태 */}
          {token ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 1.5,
                py: 0.5,
              }}
            >
              <Button
                size="small"
                onClick={() => go("/mypage")}
                sx={{ fontSize: 14, color: "text.secondary", "&:hover": { color: "primary.main" } }}
              >
                {user?.nickname ?? "사용자"}님
              </Button>
              <Button size="small" onClick={handleLogout}>
                로그아웃
              </Button>
            </Box>
          ) : (
            <Stack direction="row" spacing={1} sx={{ px: 1.5, py: 0.5 }}>
              <Button size="small" sx={{ color: "text.secondary", flex: 1 }} onClick={() => go("/login")}>
                로그인
              </Button>
              <Button size="small" variant="contained" color="primary" sx={{ flex: 1 }} onClick={() => go("/signup")}>
                무료 시작
              </Button>
            </Stack>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
