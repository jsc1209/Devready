import { useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import {
  EmojiEvents,
  School,
  TrackChanges,
  ErrorOutlineOutlined,
  ChevronRight,
} from "@mui/icons-material";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";

const mono = "'DM Mono', monospace";

// ─── Data (co-located) ───────────────────────────────────────────────────────

// 교육센터 학습 진행도 mock (EducationPage / CalendarPage와 동일 값)
const LEARNING_COURSES = [
  { title: "알고리즘 기초 완성", done: 28, total: 42, accuracy: 82, color: "#6366F1" },
  { title: "React & TypeScript 심화", done: 29, total: 36, accuracy: 88, color: "#F59E0B" },
  { title: "네트워크 & HTTP", done: 11, total: 24, accuracy: 75, color: "#3B82F6" },
  { title: "Spring Boot & JPA", done: 5, total: 30, accuracy: 69, color: "#EC4899" },
];

const INTERVIEW_HISTORY = [
  {
    id: "1", date: "2026.06.05", type: "기술 면접", score: 80, grade: "B+",
    scores: { technical: 78, logic: 82, specificity: 76, depth: 74, communication: 88 },
    wpm: 148, silenceCount: 2, gazeStability: 78,
  },
  {
    id: "2", date: "2026.06.01", type: "인성 면접", score: 76, grade: "B",
    scores: { technical: 72, logic: 78, specificity: 70, depth: 68, communication: 82 },
    wpm: 142, silenceCount: 3, gazeStability: 72,
  },
  {
    id: "3", date: "2026.05.25", type: "직무 면접", score: 72, grade: "C+",
    scores: { technical: 68, logic: 70, specificity: 65, depth: 62, communication: 78 },
    wpm: 135, silenceCount: 4, gazeStability: 65,
  },
  {
    id: "4", date: "2026.05.18", type: "기술 면접", score: 68, grade: "C+",
    scores: { technical: 60, logic: 65, specificity: 62, depth: 58, communication: 74 },
    wpm: 130, silenceCount: 5, gazeStability: 60,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function weakLabel(key) {
  if (key === "technical") return "기술정확성";
  if (key === "logic") return "논리구조";
  if (key === "specificity") return "구체성";
  if (key === "depth") return "심화이해";
  return "커뮤니케이션";
}

function weakTip(key) {
  if (key === "technical") return "기술 면접 문제 풀이 및 CS 개념 정리를 늘려보세요.";
  if (key === "logic") return "답변 시 서론-본론-결론 구조로 정리하는 연습을 하세요.";
  if (key === "specificity") return "추상적 설명 대신 수치·코드 예시를 포함해 구체적으로 말하세요.";
  if (key === "depth") return "질문의 배경 원리까지 설명하는 심화 학습을 진행해보세요.";
  return "필러워드를 줄이고 명확한 단어 선택을 연습해보세요.";
}

function gradeOf(avgScore) {
  if (avgScore >= 85) return "A";
  if (avgScore >= 75) return "B+";
  if (avgScore >= 70) return "B";
  if (avgScore >= 60) return "C+";
  return "C";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EvaluationTab() {
  const navigate = useNavigate();

  const learnDone = LEARNING_COURSES.reduce((s, c) => s + c.done, 0);
  const learnTotal = LEARNING_COURSES.reduce((s, c) => s + c.total, 0);
  const learnOverall = Math.round((learnDone / learnTotal) * 100);

  const avgScore = Math.round(
    INTERVIEW_HISTORY.reduce((s, h) => s + h.score, 0) / INTERVIEW_HISTORY.length
  );
  const avgScores = {
    technical: Math.round(INTERVIEW_HISTORY.reduce((s, h) => s + h.scores.technical, 0) / INTERVIEW_HISTORY.length),
    logic: Math.round(INTERVIEW_HISTORY.reduce((s, h) => s + h.scores.logic, 0) / INTERVIEW_HISTORY.length),
    specificity: Math.round(INTERVIEW_HISTORY.reduce((s, h) => s + h.scores.specificity, 0) / INTERVIEW_HISTORY.length),
    depth: Math.round(INTERVIEW_HISTORY.reduce((s, h) => s + h.scores.depth, 0) / INTERVIEW_HISTORY.length),
    communication: Math.round(INTERVIEW_HISTORY.reduce((s, h) => s + h.scores.communication, 0) / INTERVIEW_HISTORY.length),
  };
  const radarData = [
    { subject: "기술정확성", score: avgScores.technical },
    { subject: "논리구조", score: avgScores.logic },
    { subject: "구체성", score: avgScores.specificity },
    { subject: "심화이해", score: avgScores.depth },
    { subject: "커뮤니케이션", score: avgScores.communication },
  ];
  const weakItems = Object.entries(avgScores)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 2)
    .map(([key, val]) => ({
      key,
      val,
      label: weakLabel(key),
      tip: weakTip(key),
    }));

  const grade = gradeOf(avgScore);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* 종합 평가 헤더 */}
      <Box
        sx={{
          borderRadius: "16px",
          border: "1px solid",
          borderColor: "divider",
          p: 3,
          background: "linear-gradient(135deg,#F4F3FF 0%,#EEF0FF 100%)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <EmojiEvents sx={{ fontSize: 20, color: "primary.main" }} />
          <Typography
            component="h2"
            sx={{ fontWeight: 600, color: "text.primary", fontSize: 16 }}
          >
            학습 종합 평가
          </Typography>
          <Typography
            component="span"
            sx={{ fontSize: 12, color: "text.secondary", ml: 0.5 }}
          >
            면접·학습 데이터를 종합한 현재 상태
          </Typography>
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)" },
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              borderRadius: "12px",
              bgcolor: "rgba(255,255,255,0.7)",
              border: "1px solid",
              borderColor: "divider",
              p: 2,
            }}
          >
            <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 0.5 }}>
              면접 종합 점수
            </Typography>
            <Box sx={{ display: "flex", alignItems: "flex-end", gap: 0.75 }}>
              <Typography
                component="span"
                sx={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "text.primary",
                  fontFamily: mono,
                }}
              >
                {avgScore}
              </Typography>
              <Typography
                component="span"
                sx={{ fontSize: 14, color: "primary.main", mb: 0.25, fontWeight: 500 }}
              >
                {grade}
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              borderRadius: "12px",
              bgcolor: "rgba(255,255,255,0.7)",
              border: "1px solid",
              borderColor: "divider",
              p: 2,
            }}
          >
            <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 0.5 }}>
              학습 진행률
            </Typography>
            <Typography
              sx={{
                fontSize: 24,
                fontWeight: 700,
                color: "text.primary",
                fontFamily: mono,
              }}
            >
              {learnOverall}%
            </Typography>
          </Box>
          <Box
            sx={{
              borderRadius: "12px",
              bgcolor: "rgba(255,255,255,0.7)",
              border: "1px solid",
              borderColor: "divider",
              p: 2,
              gridColumn: { xs: "span 2", sm: "span 1" },
            }}
          >
            <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 0.5 }}>
              완료 강의
            </Typography>
            <Typography
              sx={{
                fontSize: 24,
                fontWeight: 700,
                color: "text.primary",
                fontFamily: mono,
              }}
            >
              {learnDone}
              <Box
                component="span"
                sx={{ fontSize: 14, color: "text.secondary", fontWeight: 400 }}
              >
                /{learnTotal}강
              </Box>
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* 학습 진행도 + 역량 레이더 */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
          gap: 2,
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
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <School sx={{ fontSize: 16, color: "primary.main" }} />
              <Typography
                component="h3"
                sx={{ fontWeight: 600, color: "text.primary", fontSize: 14 }}
              >
                학습 진행도
              </Typography>
            </Box>
            <Box
              component="button"
              type="button"
              onClick={() => navigate("/education")}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.25,
                fontSize: 12,
                color: "primary.main",
                bgcolor: "transparent",
                border: "none",
                font: "inherit",
                cursor: "pointer",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              교육센터 <ChevronRight sx={{ fontSize: 12 }} />
            </Box>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {LEARNING_COURSES.map((c) => {
              const pct = Math.round((c.done / c.total) * 100);
              return (
                <Box key={c.title}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 0.5,
                    }}
                  >
                    <Typography
                      component="span"
                      sx={{
                        fontSize: 12,
                        color: "text.primary",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {c.title}
                    </Typography>
                    <Typography
                      component="span"
                      sx={{
                        fontSize: 11,
                        color: "text.secondary",
                        flexShrink: 0,
                        ml: 1,
                      }}
                    >
                      {c.done}/{c.total}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      height: 6,
                      borderRadius: "999px",
                      bgcolor: "#F8F9FF",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        height: "100%",
                        borderRadius: "999px",
                        width: `${pct}%`,
                        backgroundColor: c.color,
                      }}
                    />
                  </Box>
                </Box>
              );
            })}
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <TrackChanges sx={{ fontSize: 16, color: "primary.main" }} />
            <Typography
              component="h3"
              sx={{ fontWeight: 600, color: "text.primary", fontSize: 14 }}
            >
              역량 레이더
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 1 }}>
            누적 면접 평균 5항목
          </Typography>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(0,0,0,0.08)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#8B9CB8", fontSize: 9 }} />
              <Radar name="평균" dataKey="score" stroke="#6366F1" fill="#6366F1" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </Box>
      </Box>

      {/* 취약 항목 */}
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
          <ErrorOutlineOutlined sx={{ fontSize: 16, color: "#FACC15" }} />
          <Typography
            component="h3"
            sx={{ fontWeight: 600, color: "text.primary", fontSize: 16 }}
          >
            취약 항목 분석
          </Typography>
          <Typography
            component="span"
            sx={{ fontSize: 12, color: "text.secondary", ml: 0.5 }}
          >
            누적 데이터 기반 자동 분석
          </Typography>
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
            gap: 1.5,
          }}
        >
          {weakItems.map(({ label, val, tip }) => (
            <Box
              key={label}
              sx={{
                borderRadius: "12px",
                bgcolor: "rgba(234,179,8,0.05)",
                border: "1px solid rgba(234,179,8,0.2)",
                p: 1.5,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 0.5,
                }}
              >
                <Typography
                  component="span"
                  sx={{ fontSize: 14, fontWeight: 500, color: "text.primary" }}
                >
                  {label}
                </Typography>
                <Typography
                  component="span"
                  sx={{ fontSize: 14, color: "#EAB308", fontFamily: mono }}
                >
                  {val}점
                </Typography>
              </Box>
              <Box
                sx={{
                  height: 6,
                  borderRadius: "999px",
                  bgcolor: "#F8F9FF",
                  mb: 1,
                }}
              >
                <Box
                  sx={{
                    height: 6,
                    borderRadius: "999px",
                    bgcolor: "#FACC15",
                    width: `${val}%`,
                  }}
                />
              </Box>
              <Typography
                sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.7 }}
              >
                {tip}
              </Typography>
            </Box>
          ))}
        </Box>
        <Box
          component="button"
          type="button"
          onClick={() => navigate("/interview/setup")}
          sx={{
            mt: 2,
            display: "flex",
            alignItems: "center",
            gap: 0.25,
            fontSize: 12,
            color: "primary.main",
            bgcolor: "transparent",
            border: "none",
            font: "inherit",
            cursor: "pointer",
            "&:hover": { textDecoration: "underline" },
          }}
        >
          취약 항목 집중 훈련 시작 <ChevronRight sx={{ fontSize: 12 }} />
        </Box>
      </Box>
    </Box>
  );
}
