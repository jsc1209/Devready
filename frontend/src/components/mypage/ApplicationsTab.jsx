import { useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { Work, AccessTime, ChevronRight } from "@mui/icons-material";

// ─── Data (co-located) ───────────────────────────────────────────────────────
// 원본 statusCls(Tailwind className 문자열) → statusSx(인라인 hex)로 변환.
// blue-50 #EFF6FF / blue-200 #BFDBFE / blue-600 #2563EB
// green-50 #F0FDF4 / green-200 #BBF7D0 / green-600 #16A34A
// red-50 #FEF2F2 / red-200 #FECACA / red-600 #DC2626
const APPLICATION_HISTORY = [
  {
    id: "a1",
    jobId: "1",
    company: "카카오",
    title: "프론트엔드 개발자",
    location: "판교",
    appliedAt: "2026.06.05",
    status: "서류 검토 중",
    statusSx: { color: "#2563EB", bgcolor: "#EFF6FF", borderColor: "#BFDBFE" },
    resume: "v3 — 카카오 지원용",
  },
  {
    id: "a2",
    jobId: "3",
    company: "토스",
    title: "백엔드 개발자 (Java)",
    location: "강남",
    appliedAt: "2026.05.28",
    status: "서류 합격",
    statusSx: { color: "#16A34A", bgcolor: "#F0FDF4", borderColor: "#BBF7D0" },
    resume: "v2 — 네이버 지원용",
  },
  {
    id: "a3",
    jobId: "2",
    company: "네이버",
    title: "풀스택 개발자",
    location: "분당",
    appliedAt: "2026.05.15",
    status: "불합격",
    statusSx: { color: "#DC2626", bgcolor: "#FEF2F2", borderColor: "#FECACA" },
    resume: "v2 — 네이버 지원용",
  },
];

/**
 * 지원 내역 탭 (MyPage) — test-demo-UI/MyPage.tsx ApplicationsTab → JS+MUI.
 * 공고/상태 뱃지/날짜 + "서류 합격" 시 모의 면접 준비 CTA.
 */
export default function ApplicationsTab() {
  const navigate = useNavigate();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography
          variant="h2"
          sx={{ fontSize: 16, fontWeight: 600, color: "text.primary" }}
        >
          지원 내역
        </Typography>
        <Typography component="span" sx={{ fontSize: 12, color: "text.secondary" }}>
          총 {APPLICATION_HISTORY.length}건
        </Typography>
      </Box>

      {APPLICATION_HISTORY.map((a) => (
        <Box
          key={a.id}
          sx={{
            borderRadius: "16px",
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            p: 2.5,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 1.5,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 0.5,
                  flexWrap: "wrap",
                }}
              >
                <Typography
                  component="span"
                  sx={{ fontWeight: 600, color: "text.primary" }}
                >
                  {a.title}
                </Typography>
                <Box
                  component="span"
                  sx={{
                    fontSize: 12,
                    px: 1,
                    py: 0.25,
                    borderRadius: "999px",
                    border: "1px solid",
                    fontWeight: 500,
                    ...a.statusSx,
                  }}
                >
                  {a.status}
                </Box>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  fontSize: 12,
                  color: "text.secondary",
                  mb: 1,
                }}
              >
                <Box
                  component="span"
                  sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  <Work sx={{ fontSize: 12 }} />
                  {a.company}
                </Box>
                <Box component="span">{a.location}</Box>
                <Box
                  component="span"
                  sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  <AccessTime sx={{ fontSize: 12 }} />
                  {a.appliedAt} 지원
                </Box>
              </Box>

              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                제출 이력서:{" "}
                <Box component="span" sx={{ color: "text.primary" }}>
                  {a.resume}
                </Box>
              </Typography>
            </Box>

            <Box
              component="button"
              type="button"
              onClick={() => navigate(`/jobs/${a.jobId}`)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                fontSize: 12,
                color: "primary.main",
                bgcolor: "transparent",
                border: "none",
                p: 0,
                font: "inherit",
                cursor: "pointer",
                flexShrink: 0,
                transition: "color .2s",
                "&:hover": { color: "primary.dark" },
              }}
            >
              공고 보기 <ChevronRight sx={{ fontSize: 12 }} />
            </Box>
          </Box>

          {a.status === "서류 합격" && (
            <Box
              sx={{
                mt: 1.5,
                pt: 1.5,
                borderTop: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box
                component="button"
                type="button"
                onClick={() => navigate("/interview/setup")}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  px: 1.5,
                  py: 0.75,
                  borderRadius: "8px",
                  bgcolor: "rgba(108,99,255,0.1)",
                  color: "primary.main",
                  fontSize: 12,
                  fontWeight: 500,
                  border: "none",
                  font: "inherit",
                  cursor: "pointer",
                  transition: "background-color .2s",
                  "&:hover": { bgcolor: "rgba(108,99,255,0.2)" },
                }}
              >
                AI 모의 면접 준비하기 →
              </Box>
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
}
