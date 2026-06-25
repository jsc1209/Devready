import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Stack,
} from "@mui/material";
import {
  ArrowBack,
  Favorite,
  FavoriteBorder,
  LocationOn,
  AccessTime,
  WorkOutlined,
  CheckCircle,
  OpenInNew,
  Psychology,
  Visibility,
  People,
  BarChart,
  Star,
  ChevronRight,
} from "@mui/icons-material";
import { JOBS_DATA } from "../data/jobsMock";
import { ApplicationForm } from "../components/common/ApplicationForm";

// 원본 ../auth 의 실행 가드(프로토타입 localStorage 플래그)를 그대로 복제.
function isAuthed() {
  try {
    return localStorage.getItem("devready_authed") === "1";
  } catch {
    return false;
  }
}
function isResumeComplete() {
  try {
    const v = localStorage.getItem("devready_resume_complete");
    return v === null ? true : v === "1";
  } catch {
    return true;
  }
}

const BAR_COLORS = ["#6C63FF", "#3B82F6", "#10B981", "#F59E0B"];

// 라벨 + 퍼센트 막대 (직군별 분포)
function MiniBar({ label, pct, color }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Typography sx={{ fontSize: 12, color: "text.secondary", width: 80, flexShrink: 0 }}>
        {label}
      </Typography>
      <Box sx={{ flex: 1, height: 8, borderRadius: "999px", bgcolor: "grey.100", overflow: "hidden" }}>
        <Box sx={{ height: 8, borderRadius: "999px", width: `${pct}%`, bgcolor: color }} />
      </Box>
      <Typography
        sx={{ fontSize: 12, fontWeight: 500, color: "text.primary", width: 32, textAlign: "right" }}
      >
        {pct}%
      </Typography>
    </Box>
  );
}

// 카드형 패널 공통
function SectionCard({ children, sx }) {
  return (
    <Paper
      variant="outlined"
      sx={{ borderRadius: "16px", p: 3, ...sx }}
    >
      {children}
    </Paper>
  );
}

/**
 * 공고 상세 (/jobs/:id) — test-demo-UI/JobDetailPage.tsx → JS+MUI.
 * 공통 레이아웃(헤더/띠)은 Layout 이 감싸므로 본문만 렌더.
 * 지원 모달은 공용 부품 common/ApplicationForm 사용.
 */
export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [wished, setWished] = useState(false);
  const [applied, setApplied] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [activeTab, setActiveTab] = useState("desc");

  const job = JOBS_DATA.find((j) => j.id === id) ?? JOBS_DATA[0];

  // 비로그인 → /auth, 이력서 미완 → /resume, 둘 다 충족 → action 실행 (경로 원본 유지)
  const guard = (action) => {
    if (!isAuthed()) {
      navigate("/auth");
      return;
    }
    if (!isResumeComplete()) {
      navigate("/resume");
      return;
    }
    action();
  };

  const handleApplicationSubmit = () => {
    setApplied(true);
    setShowApplicationForm(false);
  };

  const dDayNum = Math.max(
    0,
    Math.ceil((new Date(job.deadline).getTime() - Date.now()) / 86400000)
  );

  return (
    <Box sx={{ maxWidth: 896, mx: "auto", px: 2, py: 5 }}>
      <Button
        onClick={() => navigate("/jobs")}
        startIcon={<ArrowBack sx={{ fontSize: 16 }} />}
        sx={{ color: "text.secondary", mb: 3, "&:hover": { color: "text.primary", bgcolor: "transparent" } }}
      >
        공고 목록으로
      </Button>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
          gap: 3,
          alignItems: "start",
        }}
      >
        {/* Main */}
        <Stack spacing={2.5}>
          {/* Company header */}
          <SectionCard>
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    fontWeight: 700,
                    flexShrink: 0,
                    bgcolor: job.logoBg,
                    color: job.logoColor,
                    border: "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  {job.logo}
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary" }}>
                    {job.title}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mt: 0.25,
                      flexWrap: "wrap",
                      fontSize: 14,
                      color: "text.secondary",
                    }}
                  >
                    <span>{job.company}</span>
                    <span>·</span>
                    <LocationOn sx={{ fontSize: 14 }} />
                    <span>{job.location}</span>
                    <span>·</span>
                    <WorkOutlined sx={{ fontSize: 14 }} />
                    <span>{job.type}</span>
                  </Box>
                </Box>
              </Stack>
              <IconButton aria-label="찜" onClick={() => setWished((v) => !v)}>
                {wished ? (
                  <Favorite sx={{ fontSize: 20, color: "#F87171" }} />
                ) : (
                  <FavoriteBorder sx={{ fontSize: 20, color: "text.secondary" }} />
                )}
              </IconButton>
            </Box>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
              {job.tags.map((t) => (
                <Box
                  key={t}
                  component="span"
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    borderRadius: "999px",
                    bgcolor: "rgba(108,99,255,0.1)",
                    color: "primary.main",
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  {t}
                </Box>
              ))}
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1.5, mb: 2 }}>
              {[
                { label: "급여", value: job.salary },
                { label: "마감일", value: job.deadline },
                { label: "경력", value: job.type },
              ].map(({ label, value }) => (
                <Box key={label} sx={{ borderRadius: "12px", bgcolor: "grey.100", p: 1.5, textAlign: "center" }}>
                  <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 0.25 }}>{label}</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 500, color: "text.primary" }}>{value}</Typography>
                </Box>
              ))}
            </Box>

            <Stack
              direction="row"
              spacing={2}
              sx={{ fontSize: 12, color: "text.secondary", borderTop: 1, borderColor: "divider", pt: 1.5 }}
            >
              <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Visibility sx={{ fontSize: 14 }} />
                {job.viewCount.toLocaleString()}회 조회
              </Box>
              <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <People sx={{ fontSize: 14 }} />
                {job.applicants}명 지원
              </Box>
            </Stack>
          </SectionCard>

          {/* Tabs */}
          <Box sx={{ display: "flex", gap: 0.5, borderBottom: 1, borderColor: "divider" }}>
            {[
              { key: "desc", label: "공고 상세" },
              { key: "stats", label: "지원 통계" },
            ].map((t) => (
              <Box
                key={t.key}
                component="button"
                onClick={() => setActiveTab(t.key)}
                sx={{
                  px: 2,
                  py: 1.25,
                  fontSize: 14,
                  fontWeight: 500,
                  bgcolor: "transparent",
                  border: 0,
                  borderBottom: "2px solid",
                  borderColor: activeTab === t.key ? "primary.main" : "transparent",
                  color: activeTab === t.key ? "primary.main" : "text.secondary",
                  cursor: "pointer",
                  "&:hover": { color: activeTab === t.key ? "primary.main" : "text.primary" },
                }}
              >
                {t.label}
              </Box>
            ))}
          </Box>

          {activeTab === "desc" && (
            <Stack spacing={2.5}>
              <SectionCard>
                <Typography sx={{ fontWeight: 600, color: "text.primary", mb: 1.5 }}>공고 개요</Typography>
                <Typography sx={{ fontSize: 14, color: "text.primary", lineHeight: 1.7 }}>{job.desc}</Typography>
              </SectionCard>

              <SectionCard>
                <Typography sx={{ fontWeight: 600, color: "text.primary", mb: 2 }}>주요 업무</Typography>
                <Stack spacing={1.25}>
                  {job.mainDuties.map((d, i) => (
                    <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 1.25, fontSize: 14, color: "text.primary" }}>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          bgcolor: "rgba(108,99,255,0.1)",
                          color: "primary.main",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 500,
                          flexShrink: 0,
                          mt: 0.25,
                        }}
                      >
                        {i + 1}
                      </Box>
                      {d}
                    </Box>
                  ))}
                </Stack>
              </SectionCard>

              <SectionCard>
                <Typography sx={{ fontWeight: 600, color: "text.primary", mb: 2 }}>자격 요건</Typography>
                <Stack spacing={1.25}>
                  {job.requirements.map((r) => (
                    <Box key={r} sx={{ display: "flex", alignItems: "center", gap: 1.25, fontSize: 14, color: "text.primary" }}>
                      <CheckCircle sx={{ fontSize: 16, color: "success.main", flexShrink: 0 }} />
                      {r}
                    </Box>
                  ))}
                </Stack>
              </SectionCard>

              {job.preferred && job.preferred.length > 0 && (
                <SectionCard>
                  <Typography sx={{ fontWeight: 600, color: "text.primary", mb: 2 }}>우대 사항</Typography>
                  <Stack spacing={1.25}>
                    {job.preferred.map((p, i) => (
                      <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1.25, fontSize: 14, color: "text.primary" }}>
                        <Star sx={{ fontSize: 16, color: "#FACC15", flexShrink: 0 }} />
                        {p}
                      </Box>
                    ))}
                  </Stack>
                </SectionCard>
              )}

              {job.coverLetterQuestions && job.coverLetterQuestions.length > 0 && (
                <SectionCard>
                  <Typography sx={{ fontWeight: 600, color: "text.primary", mb: 2 }}>자기소개서 질문</Typography>
                  <Stack spacing={1.5}>
                    {job.coverLetterQuestions.map((q, idx) => (
                      <Stack key={q.id} direction="row" spacing={1.25} alignItems="flex-start">
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            bgcolor: "rgba(108,99,255,0.1)",
                            color: "primary.main",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: 500,
                            flexShrink: 0,
                          }}
                        >
                          {idx + 1}
                        </Box>
                        <Typography sx={{ fontSize: 14, color: "text.primary", flex: 1 }}>{q.question}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </SectionCard>
              )}

              {/* AI 면접 연습 팁 */}
              <Paper
                elevation={0}
                sx={{
                  borderRadius: "16px",
                  border: "1px solid rgba(108,99,255,0.2)",
                  bgcolor: "rgba(108,99,255,0.05)",
                  p: 2.5,
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Psychology sx={{ fontSize: 20, color: "primary.main", flexShrink: 0, mt: 0.25 }} />
                  <Box>
                    <Typography sx={{ fontWeight: 600, color: "text.primary", fontSize: 14, mb: 0.5 }}>
                      이 공고 맞춤 면접 연습
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.7, mb: 1.5 }}>
                      {job.company} {job.title} 포지션에 맞는 기술 질문과 인성 질문으로 면접을 연습해보세요.
                    </Typography>
                    <Button
                      onClick={() =>
                        navigate("/interview/setup", {
                          state: { jobId: job.id, company: job.company, title: job.title },
                        })
                      }
                      endIcon={<OpenInNew sx={{ fontSize: 12 }} />}
                      sx={{ fontSize: 12, color: "primary.main", p: 0, minWidth: 0, "&:hover": { color: "primary.dark", bgcolor: "transparent" } }}
                    >
                      맞춤 면접 시작
                    </Button>
                  </Box>
                </Stack>
              </Paper>
            </Stack>
          )}

          {activeTab === "stats" && (
            <Stack spacing={2.5}>
              {/* 요약 통계 */}
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
                <SectionCard sx={{ textAlign: "center" }}>
                  <Visibility sx={{ fontSize: 24, color: "#3B82F6", mb: 1 }} />
                  <Typography sx={{ fontSize: 24, fontWeight: 700, color: "text.primary" }}>
                    {job.viewCount.toLocaleString()}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.5 }}>총 조회수</Typography>
                </SectionCard>
                <SectionCard sx={{ textAlign: "center" }}>
                  <People sx={{ fontSize: 24, color: "#22C55E", mb: 1 }} />
                  <Typography sx={{ fontSize: 24, fontWeight: 700, color: "text.primary" }}>
                    {job.applicants}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.5 }}>총 지원자 수</Typography>
                </SectionCard>
              </Box>

              {/* 전환율 */}
              <SectionCard>
                <Typography sx={{ fontWeight: 600, color: "text.primary", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                  <BarChart sx={{ fontSize: 16, color: "primary.main" }} />
                  지원 전환율
                </Typography>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: 12, mb: 0.75 }}>
                    <Box component="span" sx={{ color: "text.secondary" }}>조회 → 지원</Box>
                    <Box component="span" sx={{ fontWeight: 500, color: "text.primary" }}>
                      {((job.applicants / job.viewCount) * 100).toFixed(1)}%
                    </Box>
                  </Box>
                  <Box sx={{ height: 12, borderRadius: "999px", bgcolor: "grey.100", overflow: "hidden" }}>
                    <Box
                      sx={{
                        height: 12,
                        borderRadius: "999px",
                        width: `${(job.applicants / job.viewCount) * 100}%`,
                        bgcolor: "#6C63FF",
                      }}
                    />
                  </Box>
                </Box>
                <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 1.5 }}>
                  이 공고는 유사 직군 평균보다 조회 대비 지원 전환율이 높습니다.
                </Typography>
              </SectionCard>

              {/* 직군별 분포 */}
              <SectionCard>
                <Typography sx={{ fontWeight: 600, color: "text.primary", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                  <BarChart sx={{ fontSize: 16, color: "primary.main" }} />
                  직군별 지원 분포
                </Typography>
                <Stack spacing={1.5}>
                  {job.categoryDist.map((c, i) => (
                    <MiniBar key={c.label} label={c.label} pct={c.pct} color={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Stack>
                <Box
                  sx={{
                    mt: 2,
                    pt: 2,
                    borderTop: 1,
                    borderColor: "divider",
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 1.5,
                  }}
                >
                  {job.categoryDist.map((c, i) => (
                    <Box key={c.label} sx={{ textAlign: "center" }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: "50%", mx: "auto", mb: 0.5, bgcolor: BAR_COLORS[i % BAR_COLORS.length] }} />
                      <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{c.label}</Typography>
                      <Typography sx={{ fontSize: 14, fontWeight: 600, color: "text.primary" }}>
                        {Math.round((job.applicants * c.pct) / 100)}명
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </SectionCard>

              {/* 일별 추이 (mock) */}
              <SectionCard>
                <Typography sx={{ fontWeight: 600, color: "text.primary", mb: 2 }}>일별 조회 추이 (최근 7일)</Typography>
                <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1, height: 96 }}>
                  {[420, 680, 590, 810, 750, 920, 651].map((v, i) => {
                    const max = 920;
                    const days = ["월", "화", "수", "목", "금", "토", "일"];
                    return (
                      <Box key={i} sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                        <Box
                          sx={{
                            width: "100%",
                            borderRadius: "8px 8px 0 0",
                            height: `${(v / max) * 80}px`,
                            bgcolor: i === 5 ? "#6C63FF" : "#E0DEFF",
                          }}
                        />
                        <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{days[i]}</Typography>
                      </Box>
                    );
                  })}
                </Box>
              </SectionCard>
            </Stack>
          )}
        </Stack>

        {/* Sidebar */}
        <Stack spacing={2}>
          <SectionCard sx={{ position: "sticky", top: 96 }}>
            {applied ? (
              <Box sx={{ textAlign: "center", py: 1 }}>
                <CheckCircle sx={{ fontSize: 40, color: "success.main", mb: 1 }} />
                <Typography sx={{ fontWeight: 600, color: "text.primary", mb: 0.5 }}>지원 완료!</Typography>
                <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 2 }}>
                  서류 검토 후 연락드립니다
                </Typography>
                <Button
                  fullWidth
                  onClick={() => navigate("/mypage?tab=applications")}
                  endIcon={<ChevronRight sx={{ fontSize: 14 }} />}
                  sx={{ py: 1.25, mb: 1, bgcolor: "grey.100", color: "text.primary", "&:hover": { bgcolor: "grey.200" } }}
                >
                  지원 내역 확인
                </Button>
                <Button
                  fullWidth
                  onClick={() =>
                    navigate("/interview/setup", {
                      state: { jobId: job.id, company: job.company, title: job.title },
                    })
                  }
                  startIcon={<Psychology sx={{ fontSize: 16 }} />}
                  sx={{
                    py: 1.25,
                    bgcolor: "rgba(108,99,255,0.1)",
                    color: "primary.main",
                    "&:hover": { bgcolor: "rgba(108,99,255,0.2)" },
                  }}
                >
                  AI 모의 면접 보기
                </Button>
              </Box>
            ) : (
              <>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => guard(() => setShowApplicationForm(true))}
                  sx={{ py: 1.5, mb: 1.5, boxShadow: "0 4px 16px rgba(99,102,241,0.25)" }}
                >
                  지원하기
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => setWished((v) => !v)}
                  sx={
                    wished
                      ? { py: 1.5, borderColor: "#FECACA", bgcolor: "#FEF2F2", color: "#EF4444" }
                      : { py: 1.5, borderColor: "divider", color: "text.primary", bgcolor: "grey.100" }
                  }
                >
                  {wished ? "❤️ 찜 완료" : "🤍 찜하기"}
                </Button>
              </>
            )}

            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
              <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 1 }}>마감까지</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, fontSize: 14, fontWeight: 500, color: "#EF4444" }}>
                <AccessTime sx={{ fontSize: 16 }} />
                D-{dDayNum}일
              </Box>
            </Box>

            <Stack spacing={0.75} sx={{ mt: 1.5, pt: 1.5, borderTop: 1, borderColor: "divider" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <Box component="span" sx={{ color: "text.secondary" }}>조회수</Box>
                <Box component="span" sx={{ fontWeight: 500, color: "text.primary" }}>
                  {job.viewCount.toLocaleString()}
                </Box>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <Box component="span" sx={{ color: "text.secondary" }}>지원자</Box>
                <Box component="span" sx={{ fontWeight: 500, color: "text.primary" }}>
                  {job.applicants}명
                </Box>
              </Box>
            </Stack>
          </SectionCard>

          {/* 통계 보기 바로가기 */}
          <Paper
            variant="outlined"
            component="button"
            onClick={() => setActiveTab("stats")}
            sx={{
              borderRadius: "16px",
              p: 2,
              textAlign: "left",
              cursor: "pointer",
              bgcolor: "background.paper",
              transition: "all .2s",
              "&:hover": { boxShadow: 1, borderColor: "rgba(108,99,255,0.3)" },
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <BarChart sx={{ fontSize: 16, color: "primary.main" }} />
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: "text.primary" }}>
                지원 통계 보기
              </Typography>
            </Stack>
            <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
              직군별 분포 · 조회 추이 확인
            </Typography>
          </Paper>
        </Stack>
      </Box>

      {/* 지원 모달 (공용 부품) */}
      {showApplicationForm && job.coverLetterQuestions && (
        <ApplicationForm
          jobTitle={job.title}
          company={job.company}
          questions={job.coverLetterQuestions}
          onClose={() => setShowApplicationForm(false)}
          onSubmit={handleApplicationSubmit}
        />
      )}
    </Box>
  );
}
