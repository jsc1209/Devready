import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Box, Typography, Stack } from "@mui/material";
import useAuthStore from "../store/authStore";
import {
  EmojiEvents,
  TrackChanges,
  Person,
  Work,
  Description,
  History,
  CreditCard,
} from "@mui/icons-material";
import EvaluationTab from "../components/mypage/EvaluationTab";
import GoalsTab from "../components/mypage/GoalsTab";
import ProfileTab from "../components/mypage/ProfileTab";
import ApplicationsTab from "../components/mypage/ApplicationsTab";
import ResumeHistoryTab from "../components/mypage/ResumeHistoryTab";
import InterviewHistoryTab from "../components/mypage/InterviewHistoryTab";
import PaymentTab from "../components/mypage/PaymentTab";

// 원본 MyPage.tsx 의 TABS (아이콘 컴포넌트 ref 보유 → 셸에 둠)
const TABS = [
  { id: "evaluation", label: "학습 종합 평가", icon: EmojiEvents },
  { id: "goals", label: "교육 목표", icon: TrackChanges },
  { id: "profile", label: "기본 정보", icon: Person },
  { id: "applications", label: "지원 내역", icon: Work },
  { id: "resume", label: "내 이력서", icon: Description },
  { id: "interview", label: "면접 히스토리", icon: History },
  { id: "payment", label: "결제 정보", icon: CreditCard },
];

/**
 * 마이페이지 (/mypage) — test-demo-UI/MyPage.tsx → JS+MUI.
 * 탭 셸(프로필 헤더 + 사이드바 7탭) + 탭별 서브뷰는 components/mypage/ 로 분할.
 * 기존 /me 의 인증용 MyPage.jsx 와 별개 (이쪽은 프로토타입 풀 마이페이지).
 * 공통 레이아웃(헤더/띠)은 App.jsx 의 Layout 이 감싸므로 본문만 렌더.
 * 탭은 ?tab= 쿼리로도 진입 가능(원본 방식).
 */
export default function MyPageFull() {
  const location = useLocation();
  const [tab, setTab] = useState("evaluation");

  // 실제 로그인 사용자(authStore.user = {memberId, email, nickname}) 연동.
  // 백엔드 nickname 은 자동생성(부자연)이라 email 을 주 식별자로 노출, 미로그인 시 mock fallback.
  const user = useAuthStore((s) => s.user);
  const avatarInitial =
    user?.nickname?.[0] ?? user?.email?.[0]?.toUpperCase() ?? "김";
  const displayName = user?.email ?? "jisu@example.com";

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get("tab");
    if (t) setTab(t);
  }, [location.search]);

  return (
    <Box sx={{ maxWidth: 896, mx: "auto", px: 2, py: 5 }}>
      {/* 프로필 헤더 */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "16px",
              bgcolor: "rgba(108,99,255,0.15)",
              border: "1px solid",
              borderColor: "rgba(108,99,255,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              fontWeight: 700,
              color: "primary.main",
            }}
          >
            {avatarInitial}
          </Box>
          <Box>
            <Typography sx={{ fontSize: 24, fontWeight: 700, color: "text.primary" }}>
              {displayName}
            </Typography>
            <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
              프로 플랜 구독 중
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "repeat(4, 1fr)" },
          gap: 3,
        }}
      >
        {/* 사이드바 탭 */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "row", lg: "column" },
            gap: 0.5,
            overflowX: { xs: "auto", lg: "visible" },
          }}
        >
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <Box
                key={id}
                component="button"
                type="button"
                onClick={() => setTab(id)}
                sx={{
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 2,
                  py: 1.25,
                  borderRadius: "12px",
                  fontSize: 14,
                  textAlign: "left",
                  whiteSpace: "nowrap",
                  border: "none",
                  font: "inherit",
                  cursor: "pointer",
                  transition: "background-color .2s, color .2s",
                  ...(active
                    ? {
                        bgcolor: "rgba(108,99,255,0.1)",
                        color: "primary.main",
                        fontWeight: 500,
                      }
                    : {
                        bgcolor: "transparent",
                        color: "text.secondary",
                        "&:hover": { bgcolor: "#F8F9FF" },
                      }),
                }}
              >
                <Icon sx={{ fontSize: 16 }} />
                {label}
              </Box>
            );
          })}
        </Box>

        {/* 탭 본문 */}
        <Box sx={{ gridColumn: { lg: "span 3" } }}>
          {tab === "evaluation" && <EvaluationTab />}
          {tab === "goals" && <GoalsTab />}
          {tab === "profile" && <ProfileTab />}
          {tab === "applications" && <ApplicationsTab />}
          {tab === "resume" && <ResumeHistoryTab />}
          {tab === "interview" && <InterviewHistoryTab />}
          {tab === "payment" && <PaymentTab />}
        </Box>
      </Box>
    </Box>
  );
}
