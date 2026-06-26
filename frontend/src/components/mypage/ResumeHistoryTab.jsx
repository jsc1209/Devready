import { useState } from "react";
import { Box, Typography } from "@mui/material";
import {
  CheckCircle,
  Description,
  ExpandMore,
  ExpandLess,
  Replay,
} from "@mui/icons-material";

// ─── Data (co-located) ───────────────────────────────────────────────────────
const RESUME_HISTORY = [
  {
    id: "v3",
    label: "v3 — 카카오 지원용",
    date: "2026.06.05",
    summary:
      "카카오 FE 포지션 맞춤 수정. 프로젝트 항목 2건 추가, 기술 스택 업데이트",
    skills: ["React", "TypeScript", "Next.js", "GraphQL"],
    careers: 2,
    projects: 4,
  },
  {
    id: "v2",
    label: "v2 — 네이버 지원용",
    date: "2026.05.20",
    summary:
      "네이버 서버 포지션 지원용. 백엔드 프로젝트 강조, 자기소개 문구 수정",
    skills: ["Java", "Spring Boot", "MySQL", "Redis"],
    careers: 2,
    projects: 3,
  },
  {
    id: "v1",
    label: "v1 — 최초 작성",
    date: "2026.04.12",
    summary: "첫 작성본. 기본 정보 및 대학교 프로젝트 위주",
    skills: ["JavaScript", "React", "Node.js"],
    careers: 0,
    projects: 2,
  },
];

const mono = "'DM Mono', monospace";

/**
 * 내 이력서 탭 (MyPage) — test-demo-UI/MyPage.tsx ResumeHistoryTab → JS+MUI.
 * 이력서 버전 목록(아코디언) · 현재 버전 표시 · 버전 복원/열람/PDF 액션.
 */
export default function ResumeHistoryTab() {
  const [openId, setOpenId] = useState(null);
  const [currentVersion, setCurrentVersion] = useState("v3");
  const [restored, setRestored] = useState(null);

  const restore = (id, label) => {
    setCurrentVersion(id);
    setRestored(label);
    setTimeout(() => setRestored(null), 2500);
  };

  return (
    <Box
      sx={{
        borderRadius: "16px",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        p: 3,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2.5,
        }}
      >
        <Typography
          variant="h2"
          sx={{ fontSize: 16, fontWeight: 600, color: "text.primary" }}
        >
          이력서 버전 히스토리
        </Typography>
        {restored && (
          <Box
            component="span"
            sx={{
              fontSize: 12,
              color: "#22C55E",
              display: "flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <CheckCircle sx={{ fontSize: 14 }} />
            {restored}(으)로 복원됨
          </Box>
        )}
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {RESUME_HISTORY.map((r) => {
          const isCurrent = r.id === currentVersion;
          const isOpen = openId === r.id;
          return (
            <Box
              key={r.id}
              sx={{
                borderRadius: "12px",
                border: "1px solid",
                overflow: "hidden",
                transition: "all .2s",
                ...(isCurrent
                  ? {
                      borderColor: "rgba(108,99,255,0.4)",
                      bgcolor: "rgba(108,99,255,0.03)",
                    }
                  : { borderColor: "divider", bgcolor: "#F8F9FF" }),
              }}
            >
              <Box
                component="button"
                type="button"
                onClick={() => setOpenId(isOpen ? null : r.id)}
                sx={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 2,
                  py: 1.5,
                  bgcolor: "transparent",
                  border: "none",
                  font: "inherit",
                  cursor: "pointer",
                  transition: "background-color .2s",
                  "&:hover": { bgcolor: "rgba(241,243,251,0.5)" },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Description
                    sx={{
                      fontSize: 16,
                      color: isCurrent ? "primary.main" : "text.secondary",
                    }}
                  />
                  <Box sx={{ textAlign: "left" }}>
                    <Box
                      sx={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: "text.primary",
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      {r.label}
                      {isCurrent && (
                        <Box
                          component="span"
                          sx={{
                            fontSize: 12,
                            bgcolor: "primary.main",
                            color: "#fff",
                            px: 0.75,
                            py: 0.25,
                            borderRadius: "999px",
                          }}
                        >
                          현재
                        </Box>
                      )}
                    </Box>
                    <Box sx={{ fontSize: 12, color: "text.secondary" }}>
                      {r.date}
                    </Box>
                  </Box>
                </Box>
                {isOpen ? (
                  <ExpandLess sx={{ fontSize: 16, color: "text.secondary" }} />
                ) : (
                  <ExpandMore sx={{ fontSize: 16, color: "text.secondary" }} />
                )}
              </Box>

              {isOpen && (
                <Box
                  sx={{
                    px: 2,
                    pb: 2,
                    pt: 1,
                    borderTop: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 12,
                      color: "text.secondary",
                      mb: 1.5,
                      lineHeight: 1.625,
                    }}
                  >
                    {r.summary}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 0.75,
                      mb: 1.5,
                    }}
                  >
                    {r.skills.map((s) => (
                      <Box
                        key={s}
                        component="span"
                        sx={{
                          fontSize: 12,
                          bgcolor: "rgba(108,99,255,0.1)",
                          color: "primary.main",
                          px: 1,
                          py: 0.25,
                          borderRadius: "999px",
                        }}
                      >
                        {s}
                      </Box>
                    ))}
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      fontSize: 12,
                      color: "text.secondary",
                      mb: 2,
                    }}
                  >
                    <Box component="span">
                      경력{" "}
                      <Box
                        component="b"
                        sx={{ color: "text.primary", fontFamily: mono }}
                      >
                        {r.careers}
                      </Box>
                      건
                    </Box>
                    <Box component="span">
                      프로젝트{" "}
                      <Box
                        component="b"
                        sx={{ color: "text.primary", fontFamily: mono }}
                      >
                        {r.projects}
                      </Box>
                      건
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    {!isCurrent && (
                      <Box
                        component="button"
                        type="button"
                        onClick={() => restore(r.id, r.label)}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          px: 1.5,
                          py: 0.75,
                          borderRadius: "8px",
                          bgcolor: "primary.main",
                          color: "#fff",
                          fontSize: 12,
                          border: "none",
                          font: "inherit",
                          cursor: "pointer",
                          transition: "background-color .2s",
                          "&:hover": { bgcolor: "primary.dark" },
                        }}
                      >
                        <Replay sx={{ fontSize: 12 }} />이 버전으로 복원
                      </Box>
                    )}
                    {["열람", "PDF 다운로드"].map((label) => (
                      <Box
                        key={label}
                        component="button"
                        type="button"
                        sx={{
                          px: 1.5,
                          py: 0.75,
                          borderRadius: "8px",
                          bgcolor: "#F8F9FF",
                          border: "1px solid",
                          borderColor: "divider",
                          color: "text.secondary",
                          fontSize: 12,
                          font: "inherit",
                          cursor: "pointer",
                          transition: "color .2s",
                          "&:hover": { color: "text.primary" },
                        }}
                      >
                        {label}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
