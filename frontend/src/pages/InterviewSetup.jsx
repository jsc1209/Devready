import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import {
  Work,
  Bolt,
  CheckCircle,
  Shield,
  Videocam,
  Mic,
  Description,
  WarningAmber,
  ChevronRight,
  Lock,
  CreditCard,
  Psychology,
  Person,
  ChatBubbleOutlineOutlined,
  Apartment,
  Factory,
  RocketLaunch,
  Lan,
  Language,
  SentimentSatisfiedAlt,
} from "@mui/icons-material";
import { STEPS, CONSENT_ITEMS } from "../data/interviewSetupMock";
import { getMyResumes } from "../api/resumeApi";
import { getJobs } from "../api/jobsApi";
import { bindJobResume } from "../api/jobResumeApi";

// 원본 ../auth 의 실행 가드(프로토타입 localStorage 플래그)를 EducationPage 처럼 인라인 복제.
function isAuthed() {
  try {
    return localStorage.getItem("devready_authed") === "1";
  } catch {
    return false;
  }
}
function isResumeComplete() {
  try {
    // 플래그가 명시적으로 "1"(필수 충족)일 때만 통과. 미작성(null)·미충족·읽기 실패는 차단.
    return localStorage.getItem("devready_resume_complete") === "1";
  } catch {
    return false;
  }
}

// 아이콘 컴포넌트 ref 를 가진 옵션 배열 → 페이지 내 로컬 const(가독성).
const TYPES = [
  { id: "tech", icon: Psychology, label: "기술 면접", desc: "CS·언어·프레임워크 지식 검증" },
  { id: "personality", icon: Person, label: "인성 면접", desc: "가치관·협업·문제해결 성향" },
  { id: "job", icon: Work, label: "직무 면접", desc: "실무 경험·프로젝트 기반 질문" },
  { id: "comprehensive", icon: ChatBubbleOutlineOutlined, label: "종합 면접", desc: "기술+인성+직무 통합" },
];

const COMPANY_TYPES = [
  { id: "large", icon: Apartment, label: "대기업", desc: "삼성, LG, 현대 등 대규모 기업" },
  { id: "public", icon: Factory, label: "공기업", desc: "공공기관, 공사, 공단" },
  { id: "startup", icon: RocketLaunch, label: "스타트업", desc: "초기 성장 단계 기업" },
  { id: "si", icon: Lan, label: "SI/IT서비스", desc: "시스템 통합, IT 서비스 기업" },
  { id: "foreign", icon: Language, label: "외국계", desc: "글로벌 기업 한국 법인" },
];

const INTERVIEWER_TYPES = [
  { id: "normal", icon: SentimentSatisfiedAlt, label: "일반형", desc: "표준적인 면접 방식, 균형 잡힌 질문", color: "#6366F1" },
  { id: "pressure", icon: WarningAmber, label: "압박형", desc: "날카로운 질문, 모순 지적형", color: "#EF4444" },
  { id: "followup", icon: ChatBubbleOutlineOutlined, label: "꼬리질문형", desc: "답변마다 심화 꼬리질문 연속", color: "#F59E0B" },
  { id: "friendly", icon: SentimentSatisfiedAlt, label: "친화형", desc: "편안한 분위기, 대화형 진행", color: "#10B981" },
];

// Mock subscription check
const IS_PREMIUM = true;

const secondary = "#F8F9FF"; // bg-secondary

// 선택된 저장 이력서 스냅샷 → generate(맞춤 질문) 입력용 텍스트. (textarea 직접입력이 있으면 그쪽 우선)
function composeResumeText(data) {
  if (!data) return "";
  const b = data.basic || {};
  const parts = [];
  if (b.name) parts.push(`이름: ${b.name}`);
  if (Array.isArray(data.careers) && data.careers.length) {
    parts.push("경력:");
    data.careers.forEach((c) =>
      parts.push(`- ${[c.company, c.role, c.period, c.desc].filter(Boolean).join(" ")}`)
    );
  }
  if (Array.isArray(data.skills) && data.skills.length) parts.push(`스킬: ${data.skills.join(", ")}`);
  if (data.coverText) parts.push(`자기소개서: ${data.coverText}`);
  return parts.join("\n");
}

/**
 * 면접 설정 (/interview/setup) — test-demo-UI/InterviewSetup.tsx → JS+MUI.
 * 자체 풀페이지(중앙정렬 + 그라데이션 배경) 본문. 공통 헤더/띠는 Layout 담당.
 * 5단계 위저드: 이용 동의 / 이력서·질문 수 / 면접 환경 / 설정 요약 / 장비 점검.
 */
export default function InterviewSetup() {
  const navigate = useNavigate();
  const location = useLocation();
  const jobContext = location.state?.jobId
    ? {
        jobId: location.state.jobId,
        company: location.state.company,
        title: location.state.title,
      }
    : null;

  // 진입 가드: 비로그인 → 로그인, 이력서 미완 → 이력서 (직접 진입 포함)
  useEffect(() => {
    if (!isAuthed()) {
      navigate("/auth");
      return;
    }
    if (!isResumeComplete()) navigate("/resume");
  }, [navigate]);

  const [step, setStep] = useState(0);
  // job/level/coverText 는 원본에서 setter 가 한 번도 호출되지 않는(스텝 UI 미연결) 값.
  // navigate state 로만 넘기므로 상수로 유지(불필요한 useState/미사용 setter 제거).
  const job = jobContext ? "frontend" : "";
  const level = "";
  const coverText = "";
  const [type, setType] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [interviewer, setInterviewer] = useState("normal");
  const [count, setCount] = useState(5);
  const [consents, setConsents] = useState(
    Object.fromEntries(CONSENT_ITEMS.map((c) => [c.id, false]))
  );
  const [resume, setResume] = useState(""); // 선택된 저장 이력서의 resumeId(문자열)
  const [resumeText, setResumeText] = useState(""); // 맞춤 질문 생성용 이력서 본문(선택)
  const [jobPostingText, setJobPostingText] = useState(""); // 맞춤 질문 생성용 공고 본문(선택)

  // 저장된 이력서(DB) 목록 — 면접에 사용할 이력서 선택지. 공고 선택기(직접 진입 시) + 바인딩 상태.
  const [myResumes, setMyResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(jobContext?.jobId ?? "");
  const [binding, setBinding] = useState(false);
  const [bindError, setBindError] = useState("");

  useEffect(() => {
    getMyResumes()
      .then((list) => setMyResumes(Array.isArray(list) ? list : []))
      .catch(() => setMyResumes([]));
    if (!jobContext) {
      getJobs()
        .then((list) => setJobs(Array.isArray(list) ? list : []))
        .catch(() => setJobs([]));
    }
  }, []);

  // 공고에서 진입(jobContext)했으면 그 공고, 아니면 선택한 공고.
  const effectiveJobId = jobContext?.jobId ?? selectedJobId;

  // 본문 입력 textarea 공통 스타일
  const textareaSx = {
    width: "100%",
    minHeight: 88,
    px: 1.5,
    py: 1.25,
    borderRadius: "12px",
    bgcolor: secondary,
    border: "1px solid",
    borderColor: "divider",
    color: "text.primary",
    fontSize: 13,
    font: "inherit",
    resize: "vertical",
    boxSizing: "border-box",
    "&:focus": { outline: "none", borderColor: "rgba(108,99,255,0.6)" },
    "&::placeholder": { color: "text.secondary" },
  };

  const requiredIds = CONSENT_ITEMS.filter((c) => c.required).map((c) => c.id);
  const consentOk = requiredIds.every((id) => consents[id]);
  const allChecked = CONSENT_ITEMS.every((c) => consents[c.id]);
  const videoEnabled = consents.video_record; // 영상 동의 → 영상 면접 / 미동의 → 음성 면접

  const canNext = [consentOk, !!resume && !!effectiveJobId, !!type && !!companyType, true, !binding][step];

  const toggleAll = () => {
    const next = !allChecked;
    setConsents(Object.fromEntries(CONSENT_ITEMS.map((c) => [c.id, next])));
  };

  const handleNext = async () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    // 면접 시작: 선택한 저장 이력서를 공고에 바인딩 → jobResumeId 확보 후 Session 으로(슬라이스4가 사용).
    setBindError("");
    setBinding(true);
    try {
      const selected = myResumes.find((r) => String(r.resumeId) === String(resume));
      const { jobResumeId } = await bindJobResume({ resumeId: resume, jobPostingId: effectiveJobId });
      const effectiveResumeText = resumeText.trim() ? resumeText : composeResumeText(selected?.data);
      navigate("/interview/session", {
        state: {
          job,
          level,
          type,
          companyType,
          interviewer,
          count,
          coverText,
          resume,
          resumeText: effectiveResumeText,
          jobPostingText,
          jobContext,
          videoEnabled,
          jobResumeId,
          resumeId: resume,
          jobPostingId: effectiveJobId,
        },
      });
    } catch {
      setBindError("이력서를 공고에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      setBinding(false);
    }
  };

  if (!IS_PREMIUM) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
          background: "linear-gradient(135deg, #F8F9FF 0%, #EEF0FF 100%)",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 448, textAlign: "center" }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "16px",
              bgcolor: "rgba(108,99,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2.5,
            }}
          >
            <Lock sx={{ fontSize: 32, color: "primary.main" }} />
          </Box>
          <Typography sx={{ fontSize: 24, fontWeight: 700, color: "text.primary", mb: 1.5 }}>
            프리미엄 전용 기능
          </Typography>
          <Typography sx={{ color: "text.secondary", mb: 4 }}>
            AI 모의 면접은 프리미엄 구독자만 이용할 수 있습니다.
          </Typography>
          <Box
            component="button"
            type="button"
            onClick={() => navigate("/interview")}
            sx={{
              width: "100%",
              py: 1.5,
              borderRadius: "12px",
              bgcolor: "primary.main",
              color: "#fff",
              fontWeight: 600,
              border: "none",
              font: "inherit",
              cursor: "pointer",
              transition: "background-color .2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              "&:hover": { bgcolor: "primary.dark" },
            }}
          >
            <CreditCard sx={{ fontSize: 16 }} />
            요금제 보러가기
          </Box>
          <Box
            component="button"
            type="button"
            onClick={() => navigate(-1)}
            sx={{
              mt: 1.5,
              fontSize: 14,
              color: "text.secondary",
              border: "none",
              bgcolor: "transparent",
              font: "inherit",
              cursor: "pointer",
              "&:hover": { color: "text.primary" },
            }}
          >
            돌아가기
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 8,
        background: "linear-gradient(135deg, #F8F9FF 0%, #EEF0FF 100%)",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 672 }}>
        {jobContext && (
          <Box
            sx={{
              borderRadius: "16px",
              border: "1px solid",
              borderColor: "rgba(108,99,255,0.2)",
              bgcolor: "rgba(108,99,255,0.05)",
              p: 2,
              mb: 3,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
              <Work sx={{ fontSize: 20, color: "primary.main", flexShrink: 0, mt: "2px" }} />
              <Box>
                <Typography sx={{ fontWeight: 600, color: "text.primary", fontSize: 14, mb: "2px" }}>
                  {jobContext.company} — {jobContext.title} 맞춤 면접
                </Typography>
                <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                  해당 공고에 최적화된 면접 질문으로 연습합니다
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              px: 1.5,
              py: 0.75,
              borderRadius: "999px",
              bgcolor: "rgba(108,99,255,0.1)",
              border: "1px solid",
              borderColor: "rgba(108,99,255,0.2)",
              color: "primary.main",
              fontSize: 12,
              mb: 2,
            }}
          >
            <Bolt sx={{ fontSize: 12 }} />
            프리미엄 서비스
          </Box>
          <Typography sx={{ fontSize: 30, fontWeight: 700, color: "text.primary", mb: 1 }}>
            면접 설정
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: 14 }}>
            맞춤 면접을 위한 정보를 입력해주세요
          </Typography>
        </Box>

        {/* Progress */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 4, px: 1 }}>
          {STEPS.map((label, i) => (
            <Box key={label} sx={{ display: "flex", alignItems: "center", flex: 1 }}>
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "999px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 500,
                    transition: "all .2s",
                    ...(i <= step
                      ? { bgcolor: "primary.main", color: "#fff" }
                      : {
                          bgcolor: "background.paper",
                          border: "1px solid",
                          borderColor: "divider",
                          color: "text.secondary",
                        }),
                  }}
                >
                  {i < step ? <CheckCircle sx={{ fontSize: 14 }} /> : i + 1}
                </Box>
                <Typography
                  component="span"
                  sx={{
                    fontSize: 12,
                    mt: 0.5,
                    display: { xs: "none", sm: "block" },
                    ...(i === step
                      ? { color: "primary.main", fontWeight: 500 }
                      : { color: "text.secondary" }),
                  }}
                >
                  {label}
                </Typography>
              </Box>
              {i < STEPS.length - 1 && (
                <Box
                  sx={{
                    flex: 1,
                    height: "1px",
                    mx: 0.5,
                    bgcolor: i < step ? "primary.main" : "divider",
                  }}
                />
              )}
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            borderRadius: "16px",
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            boxShadow: 1,
            p: 4,
          }}
        >
          {/* Step 0: Consent */}
          {step === 0 && (
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Shield sx={{ fontSize: 20, color: "primary.main" }} />
                <Typography sx={{ fontWeight: 600, color: "text.primary" }}>
                  면접 전 동의 절차
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 14, color: "text.secondary", mb: 2.5, lineHeight: 1.7 }}>
                AI 모의 면접 진행을 위해 아래 항목에 동의해주세요.
                <br />
                <Box component="span" sx={{ color: "primary.main", fontWeight: 500 }}>
                  필수 항목 동의 후 면접 시작이 가능합니다.
                </Box>
              </Typography>

              {/* All agree */}
              <Box
                onClick={toggleAll}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 2,
                  p: 1.5,
                  borderRadius: "12px",
                  bgcolor: secondary,
                  border: "1px solid",
                  borderColor: "divider",
                  cursor: "pointer",
                  transition: "border-color .2s",
                  "&:hover": { borderColor: "rgba(108,99,255,0.3)" },
                }}
              >
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: "6px",
                    border: "2px solid",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background-color .2s, border-color .2s",
                    ...(allChecked
                      ? { bgcolor: "primary.main", borderColor: "primary.main" }
                      : { borderColor: "divider" }),
                  }}
                >
                  {allChecked && <CheckCircle sx={{ fontSize: 14, color: "#fff" }} />}
                </Box>
                <Typography component="span" sx={{ fontSize: 14, fontWeight: 500, color: "text.primary" }}>
                  전체 동의 (필수 + 선택)
                </Typography>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {[...CONSENT_ITEMS]
                  .sort((a, b) => Number(b.required) - Number(a.required))
                  .map((item) => (
                    <Box
                      key={item.id}
                      onClick={() => setConsents((c) => ({ ...c, [item.id]: !c[item.id] }))}
                      sx={{
                        p: 1.5,
                        borderRadius: "12px",
                        bgcolor: secondary,
                        border: "1px solid",
                        borderColor: "divider",
                        cursor: "pointer",
                        transition: "border-color .2s",
                        "&:hover": { borderColor: "rgba(108,99,255,0.3)" },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              borderRadius: "6px",
                              border: "2px solid",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "background-color .2s, border-color .2s",
                              ...(consents[item.id]
                                ? { bgcolor: "primary.main", borderColor: "primary.main" }
                                : { borderColor: "divider" }),
                            }}
                          >
                            {consents[item.id] && <CheckCircle sx={{ fontSize: 14, color: "#fff" }} />}
                          </Box>
                          <Typography component="span" sx={{ fontSize: 14, color: "text.primary" }}>
                            {item.label}
                          </Typography>
                        </Box>
                        <Box
                          component="span"
                          sx={{
                            fontSize: 12,
                            px: 1,
                            py: 0.25,
                            borderRadius: "999px",
                            fontWeight: 500,
                            border: "1px solid",
                            ...(item.required
                              ? {
                                  bgcolor: "rgba(108,99,255,0.1)",
                                  color: "primary.main",
                                  borderColor: "rgba(108,99,255,0.2)",
                                }
                              : {
                                  bgcolor: secondary,
                                  borderColor: "divider",
                                  color: "text.secondary",
                                }),
                          }}
                        >
                          {item.required ? "필수" : "선택"}
                        </Box>
                      </Box>
                      <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.75, ml: 3.5 }}>
                        {item.detail}
                      </Typography>
                    </Box>
                  ))}
              </Box>

              {/* 선택된 방식 안내 (실시간) */}
              <Box
                sx={{
                  mt: 2,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1.25,
                  p: 1.75,
                  borderRadius: "12px",
                  border: "1px solid",
                  fontSize: 14,
                  transition: "background-color .2s, border-color .2s",
                  ...(videoEnabled
                    ? { bgcolor: "rgba(108,99,255,0.05)", borderColor: "rgba(108,99,255,0.2)" }
                    : { bgcolor: secondary, borderColor: "divider" }),
                }}
              >
                {videoEnabled ? (
                  <Videocam sx={{ fontSize: 16, color: "primary.main", flexShrink: 0, mt: "2px" }} />
                ) : (
                  <Mic sx={{ fontSize: 16, color: "text.secondary", flexShrink: 0, mt: "2px" }} />
                )}
                <Box>
                  <Typography component="span" sx={{ fontWeight: 500, color: "text.primary" }}>
                    선택된 방식: {videoEnabled ? "영상 면접" : "음성 면접"}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: "text.secondary", mt: "2px" }}>
                    {videoEnabled
                      ? "카메라로 표정·시선까지 분석합니다."
                      : "카메라 없이 음성으로만 진행합니다."}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          {/* Step 1: 이력서 선택 + 질문 수 */}
          {step === 1 && (
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Description sx={{ fontSize: 20, color: "primary.main" }} />
                <Typography sx={{ fontWeight: 600, color: "text.primary" }}>
                  이력서를 선택하세요
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 14, color: "text.secondary", mb: 2 }}>
                면접에 사용할 이력서를 골라주세요.{" "}
                <Box component="span" sx={{ color: "primary.main", fontWeight: 500 }}>
                  (필수)
                </Box>
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 3 }}>
                {myResumes.length === 0 && (
                  <Typography sx={{ fontSize: 13, color: "text.secondary", py: 2, textAlign: "center" }}>
                    저장된 이력서가 없습니다. 이력서 페이지에서 작성·저장 후 이용해주세요.
                  </Typography>
                )}
                {myResumes.map((r) => {
                  const rid = String(r.resumeId);
                  const latest = r.versions && r.versions.length ? r.versions[r.versions.length - 1] : null;
                  return (
                    <Box
                      key={rid}
                      component="button"
                      type="button"
                      onClick={() => setResume(rid)}
                      sx={{
                        p: 1.75,
                        borderRadius: "12px",
                        border: "1px solid",
                        textAlign: "left",
                        font: "inherit",
                        cursor: "pointer",
                        transition: "all .2s",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        ...(resume === rid
                          ? { borderColor: "primary.main", bgcolor: "rgba(108,99,255,0.05)" }
                          : {
                              borderColor: "divider",
                              bgcolor: secondary,
                              "&:hover": { borderColor: "rgba(108,99,255,0.4)" },
                            }),
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Description
                          sx={{
                            fontSize: 16,
                            flexShrink: 0,
                            color: resume === rid ? "primary.main" : "text.secondary",
                          }}
                        />
                        <Box>
                          <Typography sx={{ fontWeight: 500, fontSize: 14, color: "text.primary" }}>
                            {r.name || "이력서"}
                          </Typography>
                          <Typography sx={{ fontSize: 12, color: "text.secondary", mt: "2px" }}>
                            {latest ? `${latest.label} · ${latest.date}` : "저장됨"}
                          </Typography>
                        </Box>
                      </Box>
                      {resume === rid && (
                        <CheckCircle sx={{ fontSize: 20, color: "primary.main", flexShrink: 0 }} />
                      )}
                    </Box>
                  );
                })}
              </Box>

              {/* 공고 선택 — 공고에서 진입(jobContext)하지 않았을 때만. job_resume 바인딩에 필요. */}
              {!jobContext && (
                <Box sx={{ mb: 3 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 500, color: "text.primary", mb: 1 }}>
                    지원 공고 선택{" "}
                    <Box component="span" sx={{ color: "primary.main" }}>
                      (필수)
                    </Box>
                  </Typography>
                  <Box
                    component="select"
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    sx={{
                      width: "100%",
                      px: 1.5,
                      py: 1.25,
                      borderRadius: "12px",
                      bgcolor: secondary,
                      border: "1px solid",
                      borderColor: "divider",
                      color: "text.primary",
                      fontSize: 14,
                      font: "inherit",
                      "&:focus": { outline: "none", borderColor: "rgba(108,99,255,0.6)" },
                    }}
                  >
                    <option value="">공고를 선택하세요</option>
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.company} — {j.title}
                      </option>
                    ))}
                  </Box>
                </Box>
              )}

              <Box sx={{ borderTop: "1px solid", borderColor: "divider", pt: 2.5 }}>
                <Typography
                  component="label"
                  sx={{ fontSize: 14, fontWeight: 500, color: "text.primary", display: "block", mb: 1.5 }}
                >
                  질문 수
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  {[5, 10, 15].map((n) => (
                    <Box
                      key={n}
                      component="button"
                      type="button"
                      onClick={() => setCount(n)}
                      sx={{
                        flex: 1,
                        py: 1.25,
                        borderRadius: "12px",
                        border: "1px solid",
                        fontSize: 14,
                        font: "inherit",
                        cursor: "pointer",
                        transition: "all .2s",
                        ...(count === n
                          ? {
                              borderColor: "primary.main",
                              bgcolor: "rgba(108,99,255,0.05)",
                              color: "primary.main",
                              fontWeight: 500,
                            }
                          : {
                              borderColor: "divider",
                              bgcolor: secondary,
                              color: "text.secondary",
                              "&:hover": { borderColor: "rgba(108,99,255,0.3)" },
                            }),
                      }}
                    >
                      {n}문항
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* 맞춤 질문 생성 (선택) — 이력서·공고 본문을 둘 다 입력하면 AI가 맞춤 질문을 생성 */}
              <Box sx={{ borderTop: "1px solid", borderColor: "divider", pt: 2.5, mt: 2.5 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: "text.primary", mb: 0.5 }}>
                  맞춤 질문 생성 (선택)
                </Typography>
                <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 1.5, lineHeight: 1.6 }}>
                  이력서 본문과 채용 공고를 둘 다 입력하면 AI가 이력서·공고 기반 맞춤 질문을 생성합니다.
                  비워두면 기본 질문으로 진행됩니다.
                </Typography>
                <Box
                  component="textarea"
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="이력서 본문을 붙여넣으세요 (선택)"
                  sx={{ ...textareaSx, mb: 1 }}
                />
                <Box
                  component="textarea"
                  value={jobPostingText}
                  onChange={(e) => setJobPostingText(e.target.value)}
                  placeholder="채용 공고 본문을 붙여넣으세요 (선택)"
                  sx={textareaSx}
                />
              </Box>
            </Box>
          )}

          {/* Step 2: 면접 환경 */}
          {step === 2 && (
            <Box>
              <Typography sx={{ fontWeight: 600, color: "text.primary", mb: 2 }}>
                면접 환경을 설정하세요
              </Typography>

              <Typography sx={{ fontSize: 14, fontWeight: 500, color: "text.primary", mb: 1.5 }}>
                면접 유형
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 1.5,
                  mb: 3,
                }}
              >
                {TYPES.map(({ id, icon: Icon, label, desc }) => (
                  <Box
                    key={id}
                    component="button"
                    type="button"
                    onClick={() => setType(id)}
                    sx={{
                      p: 2,
                      borderRadius: "12px",
                      border: "1px solid",
                      textAlign: "left",
                      font: "inherit",
                      cursor: "pointer",
                      transition: "all .2s",
                      ...(type === id
                        ? { borderColor: "primary.main", bgcolor: "rgba(108,99,255,0.05)" }
                        : {
                            borderColor: "divider",
                            bgcolor: secondary,
                            "&:hover": { borderColor: "rgba(108,99,255,0.4)" },
                          }),
                    }}
                  >
                    <Icon
                      sx={{
                        fontSize: 20,
                        mb: 1,
                        display: "block",
                        color: type === id ? "primary.main" : "text.secondary",
                      }}
                    />
                    <Typography sx={{ fontWeight: 500, fontSize: 14, color: "text.primary" }}>
                      {label}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: "text.secondary", mt: "2px" }}>
                      {desc}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Box sx={{ borderTop: "1px solid", borderColor: "divider", pt: 2.5, mb: 3 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: "text.primary", mb: 1.5 }}>
                  회사 유형
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "repeat(3, 1fr)", sm: "repeat(5, 1fr)" },
                    gap: 1,
                  }}
                >
                  {COMPANY_TYPES.map(({ id, icon: Icon, label, desc }) => (
                    <Box
                      key={id}
                      component="button"
                      type="button"
                      onClick={() => setCompanyType(id)}
                      sx={{
                        p: 1.5,
                        borderRadius: "12px",
                        border: "1px solid",
                        textAlign: "left",
                        font: "inherit",
                        cursor: "pointer",
                        transition: "all .2s",
                        display: "flex",
                        flexDirection: "column",
                        ...(companyType === id
                          ? { borderColor: "primary.main", bgcolor: "rgba(108,99,255,0.05)" }
                          : {
                              borderColor: "divider",
                              bgcolor: secondary,
                              "&:hover": { borderColor: "rgba(108,99,255,0.4)" },
                            }),
                      }}
                    >
                      <Icon
                        sx={{
                          fontSize: 20,
                          mb: 0.75,
                          color: companyType === id ? "primary.main" : "text.secondary",
                        }}
                      />
                      <Typography sx={{ fontWeight: 500, fontSize: 12, color: "text.primary" }}>
                        {label}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 12,
                          color: "text.secondary",
                          mt: "2px",
                          lineHeight: 1.25,
                          display: { xs: "none", sm: "block" },
                        }}
                      >
                        {desc.split(" ")[0]}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              <Box sx={{ borderTop: "1px solid", borderColor: "divider", pt: 2.5 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: "text.primary", mb: 1.5 }}>
                  면접관 유형
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1 }}>
                  {INTERVIEWER_TYPES.map(({ id, icon: Icon, label, desc, color }) => (
                    <Box
                      key={id}
                      component="button"
                      type="button"
                      onClick={() => setInterviewer(id)}
                      sx={{
                        p: 1.75,
                        borderRadius: "12px",
                        textAlign: "left",
                        font: "inherit",
                        cursor: "pointer",
                        transition: "all .2s",
                        ...(interviewer === id
                          ? { border: "2px solid", borderColor: color, backgroundColor: `${color}10` }
                          : {
                              border: "1px solid",
                              borderColor: "divider",
                              bgcolor: secondary,
                              "&:hover": { borderColor: "rgba(108,99,255,0.3)" },
                            }),
                      }}
                    >
                      <Icon
                        sx={{
                          fontSize: 16,
                          mb: 0.75,
                          display: "block",
                          color: interviewer === id ? color : "text.secondary",
                        }}
                      />
                      <Typography sx={{ fontSize: 14, fontWeight: 500, color: "text.primary" }}>
                        {label}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: "text.secondary", mt: "2px", lineHeight: 1.25 }}>
                        {desc}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          )}

          {/* Step 3: 면접 설정 요약 */}
          {step === 3 && (
            <Box>
              <Typography sx={{ fontWeight: 600, color: "text.primary", mb: 1 }}>
                면접 설정 요약
              </Typography>
              <Typography sx={{ fontSize: 14, color: "text.secondary", mb: 3 }}>
                아래 설정으로 면접을 시작합니다. 확인 후{" "}
                <Box component="span" sx={{ color: "text.primary", fontWeight: 500 }}>
                  면접 시작
                </Box>
                을 눌러주세요.
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                  gap: 1.5,
                }}
              >
                {[
                  ["이력서", myResumes.find((r) => String(r.resumeId) === resume)?.name ?? "-"],
                  ["면접 방식", videoEnabled ? "영상 면접" : "음성 면접"],
                  ["면접 유형", TYPES.find((t) => t.id === type)?.label ?? "-"],
                  ["회사 유형", COMPANY_TYPES.find((c) => c.id === companyType)?.label ?? "-"],
                  ["면접관", INTERVIEWER_TYPES.find((i) => i.id === interviewer)?.label ?? "-"],
                  ["질문 수", `${count}문항`],
                ].map(([k, v]) => (
                  <Box
                    key={k}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.5,
                      px: 2,
                      py: 2,
                      borderRadius: "12px",
                      bgcolor: secondary,
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Typography component="span" sx={{ fontSize: 12, color: "text.secondary" }}>
                      {k}
                    </Typography>
                    <Typography component="span" sx={{ fontSize: 18, fontWeight: 700, color: "text.primary" }}>
                      {v}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Step 4: 장비 점검 */}
          {step === 4 && (
            <Box>
              <Typography sx={{ fontWeight: 600, color: "text.primary", mb: 1 }}>
                {videoEnabled ? "카메라·음성 점검" : "마이크 점검"}
              </Typography>
              <Typography sx={{ fontSize: 14, color: "text.secondary", mb: 2.5 }}>
                {videoEnabled
                  ? "면접 전 카메라와 마이크가 정상 동작하는지 확인하세요."
                  : "영상 미동의 — 카메라 없이 음성으로만 진행됩니다. 마이크가 정상 동작하는지 확인하세요."}
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: videoEnabled
                    ? { xs: "1fr", sm: "repeat(2, 1fr)" }
                    : "1fr",
                  gap: 1.5,
                  mb: 2,
                }}
              >
                {/* 카메라 미리보기 (mock) — 영상 면접일 때만 */}
                {videoEnabled && (
                  <Box
                    sx={{
                      borderRadius: "12px",
                      border: "1px solid",
                      borderColor: "divider",
                      bgcolor: "#111827",
                      aspectRatio: "16 / 9",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#9CA3AF",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <Videocam sx={{ fontSize: 32, mb: 1 }} />
                    <Typography component="span" sx={{ fontSize: 12 }}>
                      카메라 미리보기
                    </Typography>
                    <Box
                      component="span"
                      sx={{
                        position: "absolute",
                        top: 8,
                        left: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        fontSize: 11,
                        color: "#4ADE80",
                      }}
                    >
                      <Box
                        component="span"
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: "999px",
                          bgcolor: "#4ADE80",
                          animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
                          "@keyframes pulse": { "50%": { opacity: 0.5 } },
                        }}
                      />
                      정상 인식
                    </Box>
                  </Box>
                )}
                {/* 음성 입력 레벨 (mock) */}
                <Box
                  sx={{
                    borderRadius: "12px",
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: secondary,
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, fontSize: 14, color: "text.primary" }}>
                    <Mic sx={{ fontSize: 16, color: "primary.main" }} />
                    마이크 입력
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "flex-end", gap: 0.5, height: 40 }}>
                    {[40, 70, 55, 85, 60, 75, 45, 90, 50, 65].map((h, i) => (
                      <Box
                        key={i}
                        sx={{
                          flex: 1,
                          borderRadius: "2px",
                          bgcolor: "rgba(108,99,255,0.6)",
                          height: `${h}%`,
                        }}
                      />
                    ))}
                  </Box>
                  <Box
                    component="span"
                    sx={{
                      fontSize: 11,
                      color: "#16A34A",
                      mt: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    <CheckCircle sx={{ fontSize: 12 }} />
                    음성이 정상적으로 입력됩니다
                  </Box>
                </Box>
              </Box>

              {/* 환경 안내 */}
              {videoEnabled ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1,
                    p: 1.5,
                    borderRadius: "12px",
                    bgcolor: "#FFFBEB",
                    border: "1px solid",
                    borderColor: "#FDE68A",
                    color: "#B45309",
                    fontSize: 12,
                    mb: 2,
                  }}
                >
                  <WarningAmber sx={{ fontSize: 16, flexShrink: 0, mt: "2px" }} />
                  <Box component="span">
                    현재 주변 조도는 적절합니다. 빛이 부족하면 표정 분석 정확도가 떨어질 수 있어요.
                  </Box>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1,
                    p: 1.5,
                    borderRadius: "12px",
                    bgcolor: secondary,
                    border: "1px solid",
                    borderColor: "divider",
                    color: "text.secondary",
                    fontSize: 12,
                    mb: 2,
                  }}
                >
                  <Mic sx={{ fontSize: 16, flexShrink: 0, mt: "2px", color: "primary.main" }} />
                  <Box component="span">
                    영상 미동의 — 카메라 없이 음성으로만 진행됩니다. 조용한 환경에서 또렷하게 답변해주세요.
                  </Box>
                </Box>
              )}

              {/* 경고문 */}
              <Box
                sx={{
                  borderRadius: "12px",
                  bgcolor: secondary,
                  border: "1px solid",
                  borderColor: "divider",
                  p: 2,
                }}
              >
                <Box
                  sx={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "text.primary",
                    mb: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                  }}
                >
                  <WarningAmber sx={{ fontSize: 16, color: "#F97316" }} />
                  면접 전 꼭 확인하세요
                </Box>
                <Box
                  component="ul"
                  sx={{
                    listStyle: "none",
                    m: 0,
                    p: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.75,
                    fontSize: 12,
                    color: "text.secondary",
                  }}
                >
                  <Box component="li">• 주변 환경이나 장비에 따라 피드백 정확도에 영향을 줄 수 있습니다.</Box>
                  <Box component="li">
                    • 면접 진행 중에는{" "}
                    <Box component="span" sx={{ color: "text.primary", fontWeight: 500 }}>
                      중단이 불가
                    </Box>
                    합니다.
                  </Box>
                  <Box component="li">• 중단할 경우 분석·피드백 결과에 영향을 줄 수 있습니다.</Box>
                  <Box component="li">• 조용한 환경에서 정면을 바라보며 진행해주세요.</Box>
                </Box>
              </Box>
            </Box>
          )}
        </Box>

        {bindError && (
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: "12px",
              bgcolor: "#FEF2F2",
              border: "1px solid #FECACA",
              color: "#DC2626",
              fontSize: 13,
              textAlign: "center",
            }}
          >
            {bindError}
          </Box>
        )}

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 2.5 }}>
          {step > 0 ? (
            <Box
              component="button"
              type="button"
              onClick={() => setStep(step - 1)}
              sx={{
                px: 2.5,
                py: 1.25,
                borderRadius: "12px",
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "transparent",
                color: "text.secondary",
                fontSize: 14,
                font: "inherit",
                cursor: "pointer",
                transition: "color .2s, background-color .2s",
                "&:hover": { color: "text.primary", bgcolor: "background.paper" },
              }}
            >
              이전
            </Box>
          ) : (
            <Box />
          )}
          <Box
            component="button"
            type="button"
            onClick={handleNext}
            disabled={!canNext}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 3,
              py: 1.25,
              borderRadius: "12px",
              bgcolor: "primary.main",
              color: "#fff",
              fontSize: 14,
              border: "none",
              font: "inherit",
              cursor: "pointer",
              transition: "background-color .2s, opacity .2s",
              "&:hover": { bgcolor: "primary.dark" },
              "&:disabled": { opacity: 0.4, cursor: "default" },
            }}
          >
            {step < STEPS.length - 1 ? "다음" : binding ? "연결 중…" : "면접 시작"}
            <ChevronRight sx={{ fontSize: 16 }} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
