import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Typography, CircularProgress } from "@mui/material";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  ExpandMore,
  ExpandLess,
  Replay,
  Download,
  CheckCircle,
  ErrorOutlineOutlined,
  LightbulbOutlined,
  Mic,
  Visibility,
  ChatBubbleOutlineOutlined,
  Star,
  Close,
} from "@mui/icons-material";
import jsPDF from "jspdf";
import {
  MOCK_ENTRIES,
  MOCK_CONFIG,
  JOB_LABELS,
  LEVEL_LABELS,
  TYPE_LABELS,
  SURVEY_EVERY,
  starGuide,
} from "../data/interviewReportMock";
import { generateReport, saveSession } from "../api/interviewApi";

const mono = "'DM Mono', monospace";

// 5항목 점수의 가중 총점
function weightedScore(s) {
  return Math.round(s.technical * 0.3 + s.logic * 0.2 + s.specificity * 0.2 + s.depth * 0.2 + s.communication * 0.1);
}

function gradeLabel(score) {
  if (score >= 90) return "A+";
  if (score >= 85) return "A";
  if (score >= 80) return "B+";
  if (score >= 75) return "B";
  if (score >= 70) return "C+";
  return "C";
}

// 종합 점수 원형 게이지 (SVG)
function ScoreCircle({ score }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <Box sx={{ position: "relative", width: 144, height: 144 }}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 120 120"
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke="#6366F1" strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 8px rgba(99,102,241,0.6))" }}
        />
      </svg>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography
          component="span"
          sx={{ fontSize: 36, fontWeight: 700, color: "text.primary", fontFamily: mono }}
        >
          {score}
        </Typography>
        <Typography component="span" sx={{ fontSize: 12, color: "text.secondary" }}>
          / 100
        </Typography>
      </Box>
    </Box>
  );
}

// STAR 요소 막대 (얇은 바)
function StarBar({ label, value, color }) {
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: 12, mb: 0.5 }}>
        <Typography component="span" sx={{ fontSize: 12, color: "text.secondary" }}>
          {label}
        </Typography>
        <Typography component="span" sx={{ fontSize: 12, fontFamily: mono, color }}>
          {value}
        </Typography>
      </Box>
      <Box sx={{ height: 6, borderRadius: "999px", bgcolor: "#F8F9FF" }}>
        <Box
          sx={{
            height: 6,
            borderRadius: "999px",
            transition: "all .3s",
            width: `${value}%`,
            backgroundColor: color,
          }}
        />
      </Box>
    </Box>
  );
}

// 5항목 채점 행 (라벨 + 값/최대 + 막대)
function ScoreRow({ label, value, max, color }) {
  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
        <Typography component="span" sx={{ fontSize: 14, color: "text.primary" }}>
          {label}
        </Typography>
        <Typography component="span" sx={{ fontSize: 14, fontWeight: 500, fontFamily: mono, color }}>
          {value}
          <Box component="span" sx={{ color: "text.secondary", fontSize: 12 }}>/{max}</Box>
        </Typography>
      </Box>
      <Box sx={{ height: 8, borderRadius: "999px", bgcolor: "#F8F9FF" }}>
        <Box
          sx={{
            height: 8,
            borderRadius: "999px",
            width: `${(value / max) * 100}%`,
            backgroundColor: color,
          }}
        />
      </Box>
    </Box>
  );
}

export default function InterviewReport({ data } = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  // data prop(과거 세션 조회) 우선, 없으면 navigate state(방금 끝낸 면접). 둘 다 없으면 mock.
  const state = data ?? location.state;
  // '방금 완료한 실면접'인지 — AI 리포트 호출/저장/설문은 이때만.
  const isFresh = !data && !!(location.state?.entries && location.state.entries.length > 0);

  const entries = (state?.entries && state.entries.length > 0) ? state.entries : MOCK_ENTRIES;
  const config = state?.config ?? MOCK_CONFIG;

  const [openQA, setOpenQA] = useState(null);

  // ── 면접 만족도 설문 (10회마다) ──
  const [interviewCount, setInterviewCount] = useState(0);
  const [showSurveyPrompt, setShowSurveyPrompt] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [surveyDone, setSurveyDone] = useState(false);
  const [survey, setSurvey] = useState({ overall: 0, quality: 0, usability: 0, recommend: 0, comment: "" });

  // AI 종합 리포트(/interview/report) — 실제 면접 완료 시에만 호출, 실패/524 시 클라이언트 계산으로 폴백
  const [aiReport, setAiReport] = useState(data?.aiReport ?? null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    // 실제 면접 완료(fresh)만 카운트. 과거 조회(data)·mock·딥링크 제외.
    if (!isFresh) return;
    let count = 0;
    try { count = parseInt(localStorage.getItem("devready_interview_count") ?? "0", 10) || 0; } catch { count = 0; }
    count += 1;
    try { localStorage.setItem("devready_interview_count", String(count)); } catch { /* ignore */ }
    setInterviewCount(count);
    if (count % SURVEY_EVERY === 0) setShowSurveyPrompt(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 면접 종료 후 entries → results 로 AI 종합 리포트 호출 + 그 결과를 DB 저장(실제 완료 시에만).
  useEffect(() => {
    if (!isFresh) return; // 과거 조회(data)·mock·딥링크 → 호출/저장 안 함
    const ls = location.state;
    let cancelled = false;
    // FastAPI 4축으로 변환(우리 5키 중 depth 제외, 나머지 1:1). question·feedback 동봉.
    const results = ls.entries.map((e) => ({
      question: e.question ?? e.main ?? "",
      evaluation: {
        scores: {
          technical_accuracy: e.scores?.technical ?? 0,
          specificity: e.scores?.specificity ?? 0,
          logic: e.scores?.logic ?? 0,
          communication: e.scores?.communication ?? 0,
        },
        feedback: e.aiFeedback?.feedback ?? "",
      },
    }));
    setReportLoading(true);
    (async () => {
      let res = null;
      try {
        res = await generateReport({ results, lang: "ko" });
        const rep = res?.ok ? res.report : null;
        if (!cancelled && rep && (rep.summary || rep.strengths?.length || rep.weaknesses?.length || rep.guide?.length)) {
          setAiReport(res);
        }
      } catch {
        // 실패/524 → aiReport null 유지(클라이언트 계산 폴백)
      } finally {
        if (!cancelled) setReportLoading(false);
      }
      // 결과 저장 — 로그인+바인딩(jobResumeId) 있을 때만. AI 리포트 결과 재사용(중복 호출 회피).
      // 실패/폴백 시 빈 리포트로 저장(점수는 실제 계산값 — 위조 아님). 저장 실패는 화면에 영향 없음.
      if (!cancelled && ls.jobResumeId) {
        const rep = res?.ok ? res.report : null;
        const payload = {
          jobResumeId: ls.jobResumeId,
          meta: ls.sessionMeta ?? {},
          entries: ls.entries.map((e) => ({
            question: e.question ?? e.main ?? "",
            answer: e.answer ?? "",
            scores: e.scores,
            feedback: e.aiFeedback?.feedback ?? "",
            followupQ: e.followupQ ?? e.followup ?? "",
            followupA: e.followupA ?? e.followupAnswer ?? "",
          })),
          report: rep
            ? {
                summary: rep.summary ?? "",
                strengths: rep.strengths ?? [],
                weaknesses: rep.weaknesses ?? [],
                guide: rep.guide ?? [],
              }
            : { summary: "", strengths: [], weaknesses: [], guide: [] },
        };
        try {
          await saveSession(payload);
        } catch {
          /* 저장 실패 무시(리포트 표시는 유지) */
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitSurvey = () => {
    const resp = {
      date: new Date().toISOString().slice(0, 10),
      overall: survey.overall, quality: survey.quality, usability: survey.usability, recommend: survey.recommend, comment: survey.comment,
    };
    try {
      const raw = localStorage.getItem("devready_surveys");
      const arr = raw ? JSON.parse(raw) : [];
      arr.push(resp);
      localStorage.setItem("devready_surveys", JSON.stringify(arr));
    } catch { /* ignore */ }
    setShowSurvey(false);
    setSurveyDone(true);
    setTimeout(() => setSurveyDone(false), 3000);
  };
  const surveyReady = survey.overall > 0 && survey.quality > 0 && survey.usability > 0 && survey.recommend > 0;

  const avgScore = entries.length > 0
    ? Math.round(entries.reduce((s, e) => s + weightedScore(e.scores), 0) / entries.length)
    : 0;

  const avgTechnical = Math.round(entries.reduce((s, e) => s + e.scores.technical, 0) / entries.length);
  const avgLogic = Math.round(entries.reduce((s, e) => s + e.scores.logic, 0) / entries.length);
  const avgSpecificity = Math.round(entries.reduce((s, e) => s + e.scores.specificity, 0) / entries.length);
  const avgDepth = Math.round(entries.reduce((s, e) => s + e.scores.depth, 0) / entries.length);
  const avgCommunication = Math.round(entries.reduce((s, e) => s + e.scores.communication, 0) / entries.length);

  const avgWpm = Math.round(entries.reduce((s, e) => s + e.wpm, 0) / entries.length);

  const radarData = [
    { subject: "기술정확성", score: avgTechnical },
    { subject: "논리구조", score: avgLogic },
    { subject: "구체성", score: avgSpecificity },
    { subject: "심화이해", score: avgDepth },
    { subject: "커뮤니케이션", score: avgCommunication },
  ];

  const barData = [
    { name: "기술", score: avgTechnical },
    { name: "논리", score: avgLogic },
    { name: "구체성", score: avgSpecificity },
    { name: "심화", score: avgDepth },
    { name: "소통", score: avgCommunication },
  ];

  const topEntry = entries.reduce((best, e) => weightedScore(e.scores) > weightedScore(best.scores) ? e : best, entries[0]);
  const worstEntry = entries.reduce((worst, e) => weightedScore(e.scores) < weightedScore(worst.scores) ? e : worst, entries[0]);

  // STAR averages
  const avgStar = {
    S: Math.round(entries.reduce((s, e) => s + e.star.S, 0) / entries.length),
    T: Math.round(entries.reduce((s, e) => s + e.star.T, 0) / entries.length),
    A: Math.round(entries.reduce((s, e) => s + e.star.A, 0) / entries.length),
    R: Math.round(entries.reduce((s, e) => s + e.star.R, 0) / entries.length),
  };

  const weakStarElement = Object.entries(avgStar).sort((a, b) => a[1] - b[1])[0];

  function downloadPDF() {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pw = doc.internal.pageSize.getWidth();
    let y = 40;

    doc.setFontSize(18);
    doc.setTextColor(108, 99, 255);
    doc.text("DevReady — 면접 결과 리포트", pw / 2, y, { align: "center" });
    y += 24;

    doc.setFontSize(10);
    doc.setTextColor(120, 120, 140);
    const dateStr = new Date().toLocaleDateString("ko-KR");
    const configStr = `${dateStr} · ${TYPE_LABELS[config.type] ?? config.type} · ${JOB_LABELS[config.job] ?? config.job} · ${LEVEL_LABELS[config.level] ?? config.level}`;
    doc.text(configStr, pw / 2, y, { align: "center" });
    y += 32;

    doc.setFontSize(13);
    doc.setTextColor(50, 50, 70);
    doc.text(`종합 점수: ${avgScore}점  (${gradeLabel(avgScore)}등급)`, 40, y);
    y += 22;

    doc.setFontSize(11);
    doc.text(`기술정확성: ${avgTechnical}/100   논리구조: ${avgLogic}/100   구체성: ${avgSpecificity}/100`, 40, y);
    y += 16;
    doc.text(`심화이해: ${avgDepth}/100   커뮤니케이션: ${avgCommunication}/100`, 40, y);
    y += 28;

    doc.setFontSize(12);
    doc.setTextColor(80, 80, 100);
    doc.text("STAR 구조 분석", 40, y);
    y += 16;
    doc.setFontSize(10);
    doc.text(`S(상황): ${avgStar.S}   T(과제): ${avgStar.T}   A(행동): ${avgStar.A}   R(결과): ${avgStar.R}`, 40, y);
    y += 28;

    entries.forEach((e, i) => {
      if (y > 700) { doc.addPage(); y = 40; }
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 80);
      doc.text(`Q${i + 1}. ${e.question}`, 40, y, { maxWidth: pw - 80 });
      y += 18;
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 120);
      const answerLines = doc.splitTextToSize(e.answer || "(답변 없음)", pw - 80);
      doc.text(answerLines, 40, y);
      y += answerLines.length * 13 + 8;
      doc.setTextColor(108, 99, 255);
      doc.text(`점수: ${weightedScore(e.scores)}점  WPM: ${e.wpm}`, 40, y);
      y += 20;
    });

    doc.save("interview_report.pdf");
  }

  const today = new Date().toLocaleDateString("ko-KR");

  // 모달 오버레이 공통 (position fixed inset0 bg black/40)
  const overlaySx = {
    position: "fixed",
    inset: 0,
    zIndex: 80,
    bgcolor: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    px: 2,
  };

  return (
    <Box sx={{ maxWidth: 1024, mx: "auto", px: 2, py: 6 }}>
      {/* 설문 감사 토스트 */}
      {surveyDone && (
        <Box
          sx={{
            position: "fixed",
            top: 24,
            right: 24,
            zIndex: 100,
            bgcolor: "background.paper",
            border: "1px solid #BBF7D0",
            borderRadius: "12px",
            boxShadow: 6,
            px: 2,
            py: 1.5,
            display: "flex",
            alignItems: "center",
            gap: 1,
            fontSize: 14,
            color: "#15803D",
          }}
        >
          <CheckCircle sx={{ fontSize: 16 }} />
          설문에 참여해 주셔서 감사합니다.
        </Box>
      )}

      {/* 설문 참여 프롬프트 */}
      {showSurveyPrompt && (
        <Box sx={overlaySx}>
          <Box
            sx={{
              bgcolor: "background.paper",
              borderRadius: "16px",
              width: "100%",
              maxWidth: 384,
              boxShadow: 24,
              border: "1px solid",
              borderColor: "divider",
              p: 3,
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "16px",
                bgcolor: "rgba(108,99,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 2,
              }}
            >
              <ChatBubbleOutlineOutlined sx={{ fontSize: 24, color: "primary.main" }} />
            </Box>
            <Typography sx={{ fontWeight: 600, color: "text.primary", mb: 1 }}>
              면접을 {interviewCount}회 이용하셨어요!
            </Typography>
            <Typography sx={{ fontSize: 14, color: "text.secondary", mb: 3 }}>
              잠깐 설문에 참여해 주시겠어요? 더 나은 서비스를 만드는 데 큰 도움이 됩니다.
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Box
                component="button"
                type="button"
                onClick={() => setShowSurveyPrompt(false)}
                sx={{
                  flex: 1,
                  py: 1.25,
                  borderRadius: "12px",
                  border: "1px solid",
                  borderColor: "divider",
                  fontSize: 14,
                  color: "text.primary",
                  bgcolor: "transparent",
                  font: "inherit",
                  cursor: "pointer",
                  transition: "background-color .2s",
                  "&:hover": { bgcolor: "#F8F9FF" },
                }}
              >
                아니오
              </Box>
              <Box
                component="button"
                type="button"
                onClick={() => { setShowSurveyPrompt(false); setShowSurvey(true); }}
                sx={{
                  flex: 1,
                  py: 1.25,
                  borderRadius: "12px",
                  bgcolor: "primary.main",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  border: "none",
                  font: "inherit",
                  cursor: "pointer",
                  transition: "background-color .2s",
                  "&:hover": { bgcolor: "primary.dark" },
                }}
              >
                예, 참여할게요
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {/* 설문 모달 */}
      {showSurvey && (
        <Box sx={overlaySx}>
          <Box
            sx={{
              bgcolor: "background.paper",
              borderRadius: "16px",
              width: "100%",
              maxWidth: 448,
              boxShadow: 24,
              border: "1px solid",
              borderColor: "divider",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 3,
                py: 2,
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
                면접 만족도 설문
              </Typography>
              <Box
                component="button"
                type="button"
                onClick={() => setShowSurvey(false)}
                sx={{
                  p: 0.5,
                  borderRadius: "8px",
                  border: "none",
                  bgcolor: "transparent",
                  cursor: "pointer",
                  display: "inline-flex",
                  "&:hover": { bgcolor: "#F8F9FF" },
                }}
              >
                <Close sx={{ fontSize: 16, color: "text.secondary" }} />
              </Box>
            </Box>
            <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2, maxHeight: "70vh", overflowY: "auto" }}>
              {[
                ["overall", "전반 만족도"],
                ["quality", "질문 품질"],
                ["usability", "UI 편의성"],
                ["recommend", "추천 의향"],
              ].map(([key, label]) => (
                <Box key={key} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Typography component="span" sx={{ fontSize: 14, color: "text.primary" }}>
                    {label}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    {[1, 2, 3, 4, 5].map((i) => {
                      const active = i <= survey[key];
                      return (
                        <Box
                          key={i}
                          component="button"
                          type="button"
                          onClick={() => setSurvey((s) => ({ ...s, [key]: i }))}
                          aria-label={`${label} ${i}점`}
                          sx={{
                            p: 0.25,
                            border: "none",
                            bgcolor: "transparent",
                            cursor: "pointer",
                            display: "inline-flex",
                          }}
                        >
                          <Star
                            sx={{
                              fontSize: 24,
                              transition: "color .2s",
                              color: active ? "#FACC15" : "#E5E7EB",
                            }}
                          />
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              ))}
              <Box>
                <Typography
                  component="label"
                  sx={{ display: "block", fontSize: 12, fontWeight: 500, color: "text.secondary", mb: 0.5 }}
                >
                  자유 의견 (선택)
                </Typography>
                <Box
                  component="textarea"
                  value={survey.comment}
                  onChange={(e) => setSurvey((s) => ({ ...s, comment: e.target.value }))}
                  rows={3}
                  placeholder="개선했으면 하는 점이나 좋았던 점을 남겨주세요."
                  sx={{
                    width: "100%",
                    px: 1.5,
                    py: 1.25,
                    borderRadius: "12px",
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                    fontSize: 14,
                    color: "text.primary",
                    font: "inherit",
                    resize: "none",
                    boxSizing: "border-box",
                    "&:focus": { outline: "none", borderColor: "rgba(108,99,255,0.6)" },
                    "&::placeholder": { color: "text.secondary" },
                  }}
                />
              </Box>
              <Box sx={{ display: "flex", gap: 1, pt: 0.5 }}>
                <Box
                  component="button"
                  type="button"
                  onClick={() => setShowSurvey(false)}
                  sx={{
                    flex: 1,
                    py: 1.25,
                    borderRadius: "12px",
                    border: "1px solid",
                    borderColor: "divider",
                    fontSize: 14,
                    color: "text.primary",
                    bgcolor: "transparent",
                    font: "inherit",
                    cursor: "pointer",
                    transition: "background-color .2s",
                    "&:hover": { bgcolor: "#F8F9FF" },
                  }}
                >
                  취소
                </Box>
                <Box
                  component="button"
                  type="button"
                  onClick={submitSurvey}
                  disabled={!surveyReady}
                  sx={{
                    flex: 1,
                    py: 1.25,
                    borderRadius: "12px",
                    bgcolor: "primary.main",
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 600,
                    border: "none",
                    font: "inherit",
                    cursor: "pointer",
                    transition: "background-color .2s",
                    "&:hover": { bgcolor: "primary.dark" },
                    "&:disabled": { opacity: 0.4, cursor: "default" },
                  }}
                >
                  제출
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {/* Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: 2,
          mb: 5,
        }}
      >
        <Box>
          <Typography sx={{ fontSize: 14, color: "text.secondary", mb: 0.5 }}>
            {today} · {TYPE_LABELS[config.type] ?? config.type} · {JOB_LABELS[config.job] ?? config.job} · {LEVEL_LABELS[config.level] ?? config.level}
          </Typography>
          <Typography sx={{ fontSize: 30, fontWeight: 700, color: "text.primary" }}>
            면접 결과 리포트
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Box
            component="button"
            type="button"
            onClick={downloadPDF}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              px: 2,
              py: 1,
              borderRadius: "8px",
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "#F8F9FF",
              fontSize: 14,
              color: "text.primary",
              font: "inherit",
              cursor: "pointer",
              transition: "background-color .2s",
              "&:hover": { bgcolor: "#F1F3FB" },
            }}
          >
            <Download sx={{ fontSize: 16 }} />
            PDF 저장
          </Box>
          <Box
            component="button"
            type="button"
            onClick={() => navigate("/interview/setup")}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              px: 2,
              py: 1,
              borderRadius: "8px",
              bgcolor: "primary.main",
              color: "#fff",
              fontSize: 14,
              border: "none",
              font: "inherit",
              cursor: "pointer",
              transition: "background-color .2s",
              "&:hover": { bgcolor: "#EEF0FF", color: "primary.main" },
            }}
          >
            <Replay sx={{ fontSize: 16 }} />
            다시 도전
          </Box>
        </Box>
      </Box>

      {/* AI 종합 리포트 — 실제 면접 완료 시. 로딩: 스피너 / 성공: 표시 / 실패·미가동: 미표시(아래 클라이언트 계산이 폴백) */}
      {(reportLoading || aiReport?.report) && (
        <Box sx={{ borderRadius: "16px", border: "1px solid", borderColor: "divider", bgcolor: "background.paper", p: 4, mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <LightbulbOutlined sx={{ fontSize: 20, color: "primary.main" }} />
            <Typography sx={{ fontWeight: 700, fontSize: 18, color: "text.primary" }}>AI 종합 리포트</Typography>
          </Box>
          {reportLoading ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, color: "text.secondary", py: 1 }}>
              <CircularProgress size={18} />
              <Typography sx={{ fontSize: 14 }}>AI가 면접 전체를 분석해 리포트를 생성하고 있습니다... (최대 1~2분)</Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {aiReport.report.summary && (
                <Typography sx={{ fontSize: 14, color: "text.primary", lineHeight: 1.7 }}>{aiReport.report.summary}</Typography>
              )}
              {[
                ["강점", aiReport.report.strengths, "#16A34A"],
                ["보완점", aiReport.report.weaknesses, "#EA580C"],
                ["준비 가이드", aiReport.report.guide, "#6366F1"],
              ].map(([label, items, color]) =>
                Array.isArray(items) && items.length > 0 ? (
                  <Box key={label}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color, mb: 0.5 }}>{label}</Typography>
                    <Box component="ul" sx={{ m: 0, pl: 2.5, display: "flex", flexDirection: "column", gap: 0.5 }}>
                      {items.map((it, i) => (
                        <Box component="li" key={i} sx={{ fontSize: 13, color: "text.secondary", lineHeight: 1.6 }}>
                          {it}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ) : null
              )}
            </Box>
          )}
        </Box>
      )}

      {/* Overview row */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "repeat(3, 1fr)" },
          gap: 3,
          mb: 4,
        }}
      >
        <Box
          sx={{
            borderRadius: "16px",
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <ScoreCircle score={avgScore} />
          <Box sx={{ mt: 2 }}>
            <Typography sx={{ fontSize: 24, fontWeight: 700, color: "text.primary" }}>
              {gradeLabel(avgScore)}
            </Typography>
            <Typography sx={{ fontSize: 14, color: "text.secondary", mt: 0.5 }}>
              종합 등급
            </Typography>
          </Box>
          <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 0.75, fontSize: 14, color: "#4ADE80" }}>
            <TrendingUp sx={{ fontSize: 16 }} />
            총 {entries.length}문항 완료
          </Box>
        </Box>

        <Box
          sx={{
            borderRadius: "16px",
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            p: 3,
          }}
        >
          <Typography sx={{ fontSize: 14, fontWeight: 500, color: "text.secondary", mb: 2 }}>
            역량 레이더
          </Typography>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#8B9CB8", fontSize: 9 }} />
              <Radar name="점수" dataKey="score" stroke="#6366F1" fill="#6366F1" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </Box>

        <Box
          sx={{
            borderRadius: "16px",
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            p: 3,
          }}
        >
          <Typography sx={{ fontSize: 14, fontWeight: 500, color: "text.secondary", mb: 2 }}>
            항목별 점수
          </Typography>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: "#8B9CB8", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: "#8B9CB8", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#0F1529", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8 }}
                labelStyle={{ color: "#E8EAED" }}
                itemStyle={{ color: "#818CF8" }}
              />
              <Bar dataKey="score" fill="#6366F1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Box>

      {/* 5-item scoring breakdown */}
      <Box
        sx={{
          borderRadius: "16px",
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          p: 3,
          mb: 4,
        }}
      >
        <Typography sx={{ fontWeight: 600, color: "text.primary", mb: 3 }}>
          AI 5항목 채점 상세
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <ScoreRow label="기술정확성" value={avgTechnical} max={100} color={avgTechnical >= 80 ? "#34D399" : avgTechnical >= 65 ? "#6366F1" : "#F59E0B"} />
          <ScoreRow label="논리구조" value={avgLogic} max={100} color={avgLogic >= 80 ? "#34D399" : avgLogic >= 65 ? "#6366F1" : "#F59E0B"} />
          <ScoreRow label="구체성" value={avgSpecificity} max={100} color={avgSpecificity >= 80 ? "#34D399" : avgSpecificity >= 65 ? "#6366F1" : "#F59E0B"} />
          <ScoreRow label="심화이해" value={avgDepth} max={100} color={avgDepth >= 80 ? "#34D399" : avgDepth >= 65 ? "#6366F1" : "#F59E0B"} />
          <ScoreRow label="커뮤니케이션" value={avgCommunication} max={100} color={avgCommunication >= 80 ? "#34D399" : avgCommunication >= 65 ? "#6366F1" : "#F59E0B"} />
        </Box>
        <Typography sx={{ mt: 2, fontSize: 12, color: "text.secondary" }}>
          가중치: 기술정확성 30% · 논리구조 20% · 구체성 20% · 심화이해 20% · 커뮤니케이션 10%
        </Typography>
      </Box>

      {/* STAR Analysis */}
      <Box
        sx={{
          borderRadius: "16px",
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          p: 3,
          mb: 4,
        }}
      >
        <Typography sx={{ fontWeight: 600, color: "text.primary", mb: 1 }}>
          STAR 구조 분석
        </Typography>
        <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 3 }}>
          답변을 S·T·A·R 4요소로 자동 분류한 결과입니다.
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
            gap: 3,
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <StarBar label="S — Situation (상황)" value={avgStar.S} color="#6366F1" />
            <StarBar label="T — Task (과제)" value={avgStar.T} color="#3B82F6" />
            <StarBar label="A — Action (행동)" value={avgStar.A} color="#10B981" />
            <StarBar label="R — Result (결과)" value={avgStar.R} color="#F59E0B" />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <Box
              sx={{
                borderRadius: "12px",
                bgcolor: "rgba(245,158,11,0.05)",
                border: "1px solid rgba(245,158,11,0.2)",
                p: 2,
              }}
            >
              <Typography sx={{ fontSize: 12, color: "#FACC15", mb: 1 }}>
                개선이 필요한 STAR 요소
              </Typography>
              <Typography sx={{ fontWeight: 600, color: "text.primary", mb: 1 }}>
                {weakStarElement[0]} — {weakStarElement[1]}점
              </Typography>
              <Typography sx={{ fontSize: 12, color: "text.primary", lineHeight: 1.7 }}>
                {starGuide[weakStarElement[0]]}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Strengths & Improvements */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
          gap: 2,
          mb: 4,
        }}
      >
        <Box
          sx={{
            borderRadius: "16px",
            border: "1px solid rgba(16,185,129,0.2)",
            bgcolor: "rgba(16,185,129,0.05)",
            p: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <CheckCircle sx={{ fontSize: 20, color: "#4ADE80" }} />
            <Typography sx={{ fontWeight: 600, color: "text.primary" }}>
              가장 잘한 답변
            </Typography>
          </Box>
          {topEntry && (
            <Box>
              <Typography
                sx={{
                  fontSize: 12,
                  color: "text.secondary",
                  mb: 1,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {topEntry.question}
              </Typography>
              <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#4ADE80", mb: 0.5, fontFamily: mono }}>
                {weightedScore(topEntry.scores)}점
              </Typography>
              <Typography
                sx={{
                  fontSize: 12,
                  color: "text.primary",
                  lineHeight: 1.7,
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {topEntry.answer || "(답변 없음)"}
              </Typography>
            </Box>
          )}
        </Box>
        <Box
          sx={{
            borderRadius: "16px",
            border: "1px solid rgba(245,158,11,0.2)",
            bgcolor: "rgba(245,158,11,0.05)",
            p: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <ErrorOutlineOutlined sx={{ fontSize: 20, color: "#FACC15" }} />
            <Typography sx={{ fontWeight: 600, color: "text.primary" }}>
              개선이 필요한 답변
            </Typography>
          </Box>
          {worstEntry && (
            <Box>
              <Typography
                sx={{
                  fontSize: 12,
                  color: "text.secondary",
                  mb: 1,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {worstEntry.question}
              </Typography>
              <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#FACC15", mb: 0.5, fontFamily: mono }}>
                {weightedScore(worstEntry.scores)}점
              </Typography>
              <Box component="ul" sx={{ fontSize: 12, color: "text.primary", m: 0, pl: 0, listStyle: "none", "& li": { mb: 0.5 } }}>
                {worstEntry.scores.specificity < 60 && <li>• 구체적인 예시나 수치를 더 활용해보세요</li>}
                {worstEntry.scores.logic < 60 && <li>• 논리적 흐름을 단계별로 구조화해보세요</li>}
                {worstEntry.scores.technical < 60 && <li>• 핵심 기술 개념을 정확하게 정리해보세요</li>}
                {worstEntry.scores.depth < 60 && <li>• 심층적인 이해를 보여주는 내용을 추가해보세요</li>}
                {worstEntry.scores.communication < 60 && <li>• 더 명확하고 간결하게 전달하세요</li>}
                {weightedScore(worstEntry.scores) >= 60 && <li>• STAR 기법으로 답변을 구조화해보세요</li>}
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Per-question accordion */}
      <Box
        sx={{
          borderRadius: "16px",
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          p: 3,
          mb: 4,
        }}
      >
        <Typography sx={{ fontWeight: 600, color: "text.primary", mb: 3 }}>
          질문별 상세 피드백
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {entries.map((item, i) => {
            const qScore = weightedScore(item.scores);
            const open = openQA === i;
            return (
              <Box
                key={i}
                sx={{
                  borderRadius: "12px",
                  border: "1px solid",
                  borderColor: "divider",
                  overflow: "hidden",
                }}
              >
                <Box
                  component="button"
                  type="button"
                  onClick={() => setOpenQA(open ? null : i)}
                  sx={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 2.5,
                    py: 2,
                    textAlign: "left",
                    bgcolor: "transparent",
                    border: "none",
                    font: "inherit",
                    cursor: "pointer",
                    transition: "background-color .2s",
                    "&:hover": { bgcolor: "#F8F9FF" },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1, minWidth: 0 }}>
                    <Typography
                      component="span"
                      sx={{ fontSize: 12, color: "text.secondary", flexShrink: 0, fontFamily: mono }}
                    >
                      Q{i + 1}
                    </Typography>
                    {item.isPersonality && (
                      <Box
                        component="span"
                        sx={{
                          flexShrink: 0,
                          fontSize: 12,
                          px: 0.75,
                          py: 0.25,
                          borderRadius: "6px",
                          bgcolor: "rgba(168,85,247,0.2)",
                          color: "#C084FC",
                        }}
                      >
                        인성
                      </Box>
                    )}
                    <Typography
                      component="span"
                      sx={{
                        fontSize: 14,
                        color: "text.primary",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.question}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, ml: 2, flexShrink: 0 }}>
                    <Typography
                      component="span"
                      sx={{
                        fontSize: 14,
                        fontWeight: 500,
                        fontFamily: mono,
                        color: qScore >= 80 ? "#34D399" : qScore >= 65 ? "#6366F1" : "#F59E0B",
                      }}
                    >
                      {qScore}
                    </Typography>
                    {open
                      ? <ExpandLess sx={{ fontSize: 16, color: "text.secondary" }} />
                      : <ExpandMore sx={{ fontSize: 16, color: "text.secondary" }} />}
                  </Box>
                </Box>

                {open && (
                  <Box
                    sx={{
                      px: 2.5,
                      pb: 2.5,
                      borderTop: "1px solid",
                      borderColor: "divider",
                      bgcolor: "rgba(248,249,255,0.5)",
                    }}
                  >
                    <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                      {/* Answer */}
                      <Box>
                        <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 0.75 }}>
                          내 답변
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 14,
                            color: "text.primary",
                            lineHeight: 1.7,
                            bgcolor: "#F8F9FF",
                            borderRadius: "8px",
                            p: 1.5,
                          }}
                        >
                          {item.answer || "(답변 없음)"}
                        </Typography>
                      </Box>

                      {/* 5-item scores */}
                      <Box>
                        <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 1 }}>
                          AI 채점 (5항목)
                        </Typography>
                        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 1 }}>
                          {[
                            { key: "technical", label: "기술", max: 30, val: Math.round(item.scores.technical * 0.3) },
                            { key: "logic", label: "논리", max: 20, val: Math.round(item.scores.logic * 0.2) },
                            { key: "specificity", label: "구체성", max: 20, val: Math.round(item.scores.specificity * 0.2) },
                            { key: "depth", label: "심화", max: 20, val: Math.round(item.scores.depth * 0.2) },
                            { key: "communication", label: "소통", max: 10, val: Math.round(item.scores.communication * 0.1) },
                          ].map(({ key, label, max, val }) => (
                            <Box
                              key={key}
                              sx={{
                                borderRadius: "8px",
                                bgcolor: "background.paper",
                                border: "1px solid",
                                borderColor: "divider",
                                p: 1,
                                textAlign: "center",
                              }}
                            >
                              <Typography sx={{ fontSize: 16, fontWeight: 700, color: "text.primary", fontFamily: mono }}>
                                {val}
                              </Typography>
                              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>/{max}</Typography>
                              <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.25 }}>{label}</Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>

                      {/* STAR per question */}
                      {item.isPersonality && (
                        <Box>
                          <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 1 }}>
                            STAR 구조 분석
                          </Typography>
                          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1 }}>
                            {[
                              { k: "S", label: "상황", color: "#6366F1" },
                              { k: "T", label: "과제", color: "#3B82F6" },
                              { k: "A", label: "행동", color: "#10B981" },
                              { k: "R", label: "결과", color: "#F59E0B" },
                            ].map(({ k, label, color }) => (
                              <Box
                                key={k}
                                sx={{
                                  borderRadius: "8px",
                                  bgcolor: "background.paper",
                                  border: "1px solid",
                                  borderColor: "divider",
                                  p: 1,
                                  textAlign: "center",
                                }}
                              >
                                <Typography sx={{ fontSize: 16, fontWeight: 700, fontFamily: mono, color }}>
                                  {item.star[k]}
                                </Typography>
                                <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                                  {k} · {label}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      )}

                      {/* WPM */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2, fontSize: 12, color: "text.secondary" }}>
                        <Box component="span">
                          말하기 속도:{" "}
                          <Box component="span" sx={{ color: "text.primary", fontFamily: mono }}>
                            {item.wpm} wpm
                          </Box>
                        </Box>
                        <Box component="span">
                          침묵 구간:{" "}
                          <Box component="span" sx={{ color: "text.primary" }}>
                            {item.silenceCount}회
                          </Box>
                        </Box>
                      </Box>

                      {/* Followup */}
                      {item.followupQ && (
                        <Box sx={{ borderTop: "1px solid", borderColor: "divider", pt: 2 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, fontSize: 12, color: "text.secondary", mb: 1 }}>
                            <ChatBubbleOutlineOutlined sx={{ fontSize: 12 }} />
                            꼬리질문
                          </Box>
                          <Typography sx={{ fontSize: 14, color: "#FDE047", mb: 1.5 }}>
                            {item.followupQ}
                          </Typography>
                          {item.followupA && (
                            <Typography
                              sx={{
                                fontSize: 14,
                                color: "text.primary",
                                bgcolor: "#F8F9FF",
                                borderRadius: "8px",
                                p: 1.5,
                                lineHeight: 1.7,
                              }}
                            >
                              {item.followupA}
                            </Typography>
                          )}
                        </Box>
                      )}

                      {/* AI Feedback */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 1,
                          p: 1.5,
                          borderRadius: "8px",
                          bgcolor: "rgba(108,99,255,0.05)",
                          border: "1px solid rgba(108,99,255,0.2)",
                        }}
                      >
                        <LightbulbOutlined sx={{ fontSize: 16, color: "primary.main", flexShrink: 0, mt: 0.25 }} />
                        <Typography sx={{ fontSize: 14, color: "text.primary", lineHeight: 1.7 }}>
                          {qScore >= 80
                            ? "전반적으로 훌륭한 답변입니다. 핵심 개념을 정확히 파악하고 논리적으로 전달했습니다."
                            : qScore >= 65
                            ? "기본적인 내용은 잘 전달했습니다. 더 구체적인 예시나 심층적인 설명을 추가해보세요."
                            : "핵심 개념에 대한 보강이 필요합니다. 관련 문서나 예제를 통해 학습을 강화해보세요."}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Voice metrics */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
          gap: 2,
          mb: 4,
        }}
      >
        <Box
          sx={{
            borderRadius: "16px",
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            p: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Mic sx={{ fontSize: 20, color: "primary.main" }} />
            <Typography sx={{ fontWeight: 600, color: "text.primary" }}>
              음성 전달력 분석
            </Typography>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1.5 }}>
            {[
              { label: "평균 말하기 속도", value: `${avgWpm} wpm`, status: avgWpm >= 120 && avgWpm <= 180 ? "양호" : "조정 필요", color: avgWpm >= 120 && avgWpm <= 180 ? "#34D399" : "#F59E0B" },
              { label: "총 침묵 구간", value: `${entries.reduce((s, e) => s + e.silenceCount, 0)}회`, status: entries.reduce((s, e) => s + e.silenceCount, 0) <= 5 ? "양호" : "개선 필요", color: entries.reduce((s, e) => s + e.silenceCount, 0) <= 5 ? "#34D399" : "#F59E0B" },
              { label: "답변 완성도", value: `${entries.filter((e) => e.answer.length > 50).length}/${entries.length}`, status: "문항", color: "#6366F1" },
              { label: "꼬리질문 응답", value: `${entries.filter((e) => e.followupA).length}/${entries.filter((e) => e.followupQ).length}`, status: "완료", color: "#6366F1" },
            ].map(({ label, value, status, color }) => (
              <Box key={label} sx={{ borderRadius: "12px", bgcolor: "#F8F9FF", p: 1.5 }}>
                <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 0.5 }}>{label}</Typography>
                <Typography sx={{ fontSize: 16, fontWeight: 500, color: "text.primary", mb: 0.5, fontFamily: mono }}>
                  {value}
                </Typography>
                <Typography sx={{ fontSize: 12, color }}>{status}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Box
          sx={{
            borderRadius: "16px",
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            p: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Visibility sx={{ fontSize: 20, color: "primary.main" }} />
            <Typography sx={{ fontWeight: 600, color: "text.primary" }}>
              표정·태도 분석
            </Typography>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {[
              { label: "시선 안정성", value: 78, color: "#34D399" },
              { label: "자신감 표정", value: 72, color: "#6366F1" },
              { label: "고개 움직임", value: 84, color: "#34D399" },
              { label: "집중도", value: 80, color: "#34D399" },
            ].map(({ label, value, color }) => (
              <Box key={label}>
                <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: 12, mb: 0.5 }}>
                  <Typography component="span" sx={{ fontSize: 12, color: "text.secondary" }}>
                    {label}
                  </Typography>
                  <Typography component="span" sx={{ fontSize: 12, fontFamily: mono, color }}>
                    {value}%
                  </Typography>
                </Box>
                <Box sx={{ height: 6, borderRadius: "999px", bgcolor: "#F8F9FF" }}>
                  <Box sx={{ height: 6, borderRadius: "999px", width: `${value}%`, backgroundColor: color }} />
                </Box>
              </Box>
            ))}
          </Box>
          <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 2 }}>
            * 합격 예측이 아닌 전달력 개선을 위한 참고 지표입니다
          </Typography>
        </Box>
      </Box>

      {/* AI Recommendation */}
      <Box
        sx={{
          borderRadius: "16px",
          border: "1px solid rgba(108,99,255,0.2)",
          bgcolor: "rgba(108,99,255,0.05)",
          p: 3,
          mb: 4,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
          <LightbulbOutlined sx={{ fontSize: 20, color: "primary.main", flexShrink: 0, mt: 0.25 }} />
          <Box>
            <Typography sx={{ fontWeight: 600, color: "text.primary", mb: 1 }}>
              AI 종합 추천
            </Typography>
            <Typography sx={{ fontSize: 14, color: "text.primary", lineHeight: 1.7 }}>
              {avgScore >= 80
                ? `전반적으로 우수한 면접 수행 능력을 보여주셨습니다. 특히 `
                : `기초적인 역량은 갖추고 있으나 보강이 필요합니다. 특히 `}
              <Box component="span" sx={{ color: "primary.main" }}>
                {[
                  { label: "기술정확성", val: avgTechnical },
                  { label: "논리구조", val: avgLogic },
                  { label: "구체성", val: avgSpecificity },
                  { label: "심화이해", val: avgDepth },
                ].sort((a, b) => a.val - b.val)[0].label}
              </Box>
              {" "}분야를 집중 보강하세요.
              STAR 기법(Situation, Task, Action, Result)을 활용해 경험 기반 답변을 구조화하고,
              핵심 답변에는 수치나 코드 예시를 포함하면 전달력이 크게 향상됩니다.
              다음 세션에서 취약 영역 문제를 집중적으로 연습해보세요.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* CTA */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <Box
          component="button"
          type="button"
          onClick={() => navigate("/interview/setup")}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 4,
            py: 1.5,
            borderRadius: "12px",
            bgcolor: "primary.main",
            color: "#fff",
            border: "none",
            font: "inherit",
            fontSize: 14,
            cursor: "pointer",
            transition: "background-color .2s",
            "&:hover": { bgcolor: "#EEF0FF", color: "primary.main" },
          }}
        >
          <Replay sx={{ fontSize: 16 }} />
          다시 도전하기
        </Box>
        <Box
          component="button"
          type="button"
          onClick={() => navigate("/history")}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 4,
            py: 1.5,
            borderRadius: "12px",
            border: "1px solid",
            borderColor: "divider",
            color: "text.primary",
            bgcolor: "transparent",
            font: "inherit",
            fontSize: 14,
            cursor: "pointer",
            transition: "background-color .2s",
            "&:hover": { bgcolor: "#F8F9FF" },
          }}
        >
          면접 기록 보기
        </Box>
      </Box>
    </Box>
  );
}
