import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Stack } from "@mui/material";
import {
  ErrorOutlineOutlined,
  ChevronRight,
  ExpandMore,
  ExpandLess,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";

const mono = "'DM Mono', monospace";

// ─── Data (co-located) ─────────────────────────────────────────────────────────

const INTERVIEW_HISTORY = [
  {
    id: "1",
    date: "2026.06.05",
    type: "기술 면접",
    score: 80,
    grade: "B+",
    scores: { technical: 78, logic: 82, specificity: 76, depth: 74, communication: 88 },
    wpm: 148,
    silenceCount: 2,
    gazeStability: 78,
  },
  {
    id: "2",
    date: "2026.06.01",
    type: "인성 면접",
    score: 76,
    grade: "B",
    scores: { technical: 72, logic: 78, specificity: 70, depth: 68, communication: 82 },
    wpm: 142,
    silenceCount: 3,
    gazeStability: 72,
  },
  {
    id: "3",
    date: "2026.05.25",
    type: "직무 면접",
    score: 72,
    grade: "C+",
    scores: { technical: 68, logic: 70, specificity: 65, depth: 62, communication: 78 },
    wpm: 135,
    silenceCount: 4,
    gazeStability: 65,
  },
  {
    id: "4",
    date: "2026.05.18",
    type: "기술 면접",
    score: 68,
    grade: "C+",
    scores: { technical: 60, logic: 65, specificity: 62, depth: 58, communication: 74 },
    wpm: 130,
    silenceCount: 5,
    gazeStability: 60,
  },
];

// ─── Component ──────────────────────────────────────────────────────────────────

export default function InterviewHistoryTab() {
  const navigate = useNavigate();
  const [openId, setOpenId] = useState(null);

  // Growth chart data
  const growthData = [...INTERVIEW_HISTORY].reverse().map((h, i) => ({
    회차: `${i + 1}회차`,
    날짜: h.date,
    종합: h.score,
    기술: h.scores.technical,
    소통: h.scores.communication,
  }));

  // Avg radar data
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

  // Weak item analysis
  const weakItems = Object.entries(avgScores)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 2)
    .map(([key, val]) => {
      let label;
      if (key === "technical") label = "기술정확성";
      else if (key === "logic") label = "논리구조";
      else if (key === "specificity") label = "구체성";
      else if (key === "depth") label = "심화이해";
      else label = "커뮤니케이션";

      let tip;
      if (key === "technical") tip = "기술 면접 문제 풀이 및 CS 개념 정리를 늘려보세요.";
      else if (key === "logic") tip = "답변 시 서론-본론-결론 구조로 논리적으로 정리하는 연습을 하세요.";
      else if (key === "specificity") tip = "추상적인 설명 대신 수치·코드 예시를 포함해 구체적으로 말하세요.";
      else if (key === "depth") tip = "질문의 배경 원리까지 설명하는 심화 학습을 진행해보세요.";
      else tip = "필러워드를 줄이고 명확한 단어 선택 연습을 해보세요.";

      return { key, val, label, tip };
    });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Growth line chart */}
      <Box
        sx={{
          borderRadius: "16px",
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          p: 3,
        }}
      >
        <Typography
          variant="h2"
          sx={{ fontWeight: 600, color: "text.primary", mb: 0.5 }}
        >
          성장 그래프
        </Typography>
        <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 2 }}>
          회차별 면접 점수 변화
        </Typography>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={growthData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="회차" tick={{ fill: "#8B9CB8", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[50, 100]} tick={{ fill: "#8B9CB8", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "#0F1529", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10 }}
              labelStyle={{ color: "#E8EAED", fontSize: 12 }}
              itemStyle={{ fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: "#8B9CB8" }} />
            <Line type="monotone" dataKey="종합" stroke="#6366F1" strokeWidth={2.5} dot={{ r: 4, fill: "#6366F1" }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="기술" stroke="#10B981" strokeWidth={1.5} dot={{ r: 3, fill: "#10B981" }} strokeDasharray="4 2" />
            <Line type="monotone" dataKey="소통" stroke="#F59E0B" strokeWidth={1.5} dot={{ r: 3, fill: "#F59E0B" }} strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
      </Box>

      {/* Radar + Weak analysis */}
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
          <Typography
            variant="h2"
            sx={{ fontWeight: 600, color: "text.primary", mb: 0.5 }}
          >
            역량 레이더
          </Typography>
          <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 1 }}>
            누적 평균 5항목
          </Typography>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#8B9CB8", fontSize: 9 }} />
              <Radar name="평균" dataKey="score" stroke="#6366F1" fill="#6366F1" fillOpacity={0.2} strokeWidth={2} />
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <ErrorOutlineOutlined sx={{ fontSize: 16, color: "#FACC15" }} />
            <Typography
              variant="h2"
              sx={{ fontWeight: 600, color: "text.primary" }}
            >
              취약 항목 분석
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 2 }}>
            누적 데이터 기반 자동 분석
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {weakItems.map(({ label, val, tip }) => (
              <Box
                key={label}
                sx={{
                  borderRadius: "12px",
                  bgcolor: "rgba(245,158,11,0.05)",
                  border: "1px solid rgba(245,158,11,0.2)",
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
                    sx={{ fontSize: 14, color: "#FACC15", fontFamily: mono }}
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
                <Box
                  component="button"
                  type="button"
                  onClick={() => navigate("/interview/setup")}
                  sx={{
                    mt: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.25,
                    fontSize: 12,
                    color: "primary.main",
                    border: "none",
                    bgcolor: "transparent",
                    p: 0,
                    font: "inherit",
                    cursor: "pointer",
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  집중 훈련 시작 <ChevronRight sx={{ fontSize: 12 }} />
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Session list */}
      <Box
        sx={{
          borderRadius: "16px",
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          p: 3,
        }}
      >
        <Typography
          variant="h2"
          sx={{ fontWeight: 600, color: "text.primary", mb: 2 }}
        >
          회차별 기록
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {INTERVIEW_HISTORY.map((s, i) => (
            <Box
              key={s.id}
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
                onClick={() => setOpenId(openId === s.id ? null : s.id)}
                sx={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 2,
                  py: 1.5,
                  border: "none",
                  bgcolor: "transparent",
                  font: "inherit",
                  cursor: "pointer",
                  transition: "background-color .2s",
                  "&:hover": { bgcolor: "#F8F9FF" },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Typography
                    component="span"
                    sx={{
                      fontSize: 12,
                      color: "text.secondary",
                      width: 32,
                      textAlign: "right",
                      flexShrink: 0,
                      fontFamily: mono,
                    }}
                  >
                    #{INTERVIEW_HISTORY.length - i}
                  </Typography>
                  <Box sx={{ textAlign: "left" }}>
                    <Typography
                      sx={{ fontSize: 14, fontWeight: 500, color: "text.primary" }}
                    >
                      {s.type}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                      {s.date}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography
                      sx={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: "text.primary",
                        fontFamily: mono,
                      }}
                    >
                      {s.score}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: "primary.main" }}>
                      {s.grade}
                    </Typography>
                  </Box>
                  {openId === s.id ? (
                    <ExpandLess sx={{ fontSize: 16, color: "text.secondary" }} />
                  ) : (
                    <ExpandMore sx={{ fontSize: 16, color: "text.secondary" }} />
                  )}
                </Box>
              </Box>
              {openId === s.id && (
                <Box
                  sx={{
                    px: 2,
                    pb: 2,
                    pt: 1.5,
                    borderTop: "1px solid",
                    borderColor: "divider",
                    bgcolor: "rgba(248,249,255,0.5)",
                  }}
                >
                  {/* 5-item scores */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(5, 1fr)",
                      gap: 1,
                      mb: 1.5,
                    }}
                  >
                    {[
                      { k: "technical", l: "기술", max: 30, v: Math.round(s.scores.technical * 0.3) },
                      { k: "logic", l: "논리", max: 20, v: Math.round(s.scores.logic * 0.2) },
                      { k: "specificity", l: "구체성", max: 20, v: Math.round(s.scores.specificity * 0.2) },
                      { k: "depth", l: "심화", max: 20, v: Math.round(s.scores.depth * 0.2) },
                      { k: "communication", l: "소통", max: 10, v: Math.round(s.scores.communication * 0.1) },
                    ].map(({ k, l, max, v }) => (
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
                        <Typography
                          sx={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "text.primary",
                            fontFamily: mono,
                          }}
                        >
                          {v}
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                          /{max}
                        </Typography>
                        <Typography
                          sx={{ fontSize: 12, color: "text.secondary", mt: 0.25 }}
                        >
                          {l}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                  {/* Voice & gaze */}
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 1.5,
                      fontSize: 12,
                      color: "text.secondary",
                      mb: 1.5,
                    }}
                  >
                    <Typography component="span" sx={{ fontSize: 12, color: "text.secondary" }}>
                      WPM{" "}
                      <Box component="b" sx={{ color: "text.primary" }}>
                        {s.wpm}
                      </Box>
                    </Typography>
                    <Typography component="span" sx={{ fontSize: 12, color: "text.secondary" }}>
                      침묵{" "}
                      <Box component="b" sx={{ color: "text.primary" }}>
                        {s.silenceCount}회
                      </Box>
                    </Typography>
                    <Typography component="span" sx={{ fontSize: 12, color: "text.secondary" }}>
                      시선 안정성{" "}
                      <Box component="b" sx={{ color: "text.primary" }}>
                        {s.gazeStability}%
                      </Box>
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Box
                      component="button"
                      type="button"
                      onClick={() => navigate(`/interview/report/${s.id}`)}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.25,
                        fontSize: 12,
                        color: "primary.main",
                        border: "none",
                        bgcolor: "transparent",
                        p: 0,
                        font: "inherit",
                        cursor: "pointer",
                        transition: "color .2s",
                        "&:hover": { color: "primary.dark" },
                      }}
                    >
                      리포트 보기 <ChevronRight sx={{ fontSize: 12 }} />
                    </Box>
                    <Box
                      component="button"
                      type="button"
                      onClick={() => navigate("/interview/setup")}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.25,
                        fontSize: 12,
                        color: "text.secondary",
                        border: "none",
                        bgcolor: "transparent",
                        p: 0,
                        font: "inherit",
                        cursor: "pointer",
                        transition: "color .2s",
                        "&:hover": { color: "text.primary" },
                      }}
                    >
                      다시 도전 <ChevronRight sx={{ fontSize: 12 }} />
                    </Box>
                  </Stack>
                </Box>
              )}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
