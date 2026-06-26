import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Paper, Stack, Typography } from "@mui/material";
import {
  TrackChanges,
  ChevronRight,
  CheckCircle,
  School,
} from "@mui/icons-material";
import {
  EDUCATION_GOALS,
  CHECKLIST,
  getDoneMap,
  toggleDone,
  completionRate,
  goalProgress,
  achievementHistory,
} from "../../data/checklist";

const mono = "'DM Mono', monospace";

// 수강 강의 목록 mock — 이 탭 전용으로 co-locate(다른 파일과 공유 금지).
const LEARNING_COURSES = [
  { title: "알고리즘 기초 완성", done: 28, total: 42, accuracy: 82, color: "#6366F1" },
  { title: "React & TypeScript 심화", done: 29, total: 36, accuracy: 88, color: "#F59E0B" },
  { title: "네트워크 & HTTP", done: 11, total: 24, accuracy: 75, color: "#3B82F6" },
  { title: "Spring Boot & JPA", done: 5, total: 30, accuracy: 69, color: "#EC4899" },
];

const cardSx = {
  borderRadius: "16px",
  border: "1px solid",
  borderColor: "divider",
  bgcolor: "background.paper",
  p: 3,
};

export default function GoalsTab() {
  const navigate = useNavigate();
  const [doneMap, setDoneMap] = useState(getDoneMap);
  const handleToggle = (id) => {
    toggleDone(id);
    setDoneMap(getDoneMap());
  };

  const overall = completionRate();
  const history = achievementHistory();

  return (
    <Stack sx={{ gap: 3 }}>
      {/* 교육 목표 + 전체 달성률 */}
      <Paper elevation={0} sx={cardSx}>
        <Stack direction="row" sx={{ alignItems: "center", gap: 1, mb: 2 }}>
          <TrackChanges sx={{ width: 20, height: 20, color: "primary.main" }} />
          <Typography sx={{ fontWeight: 600, color: "text.primary" }}>교육 목표</Typography>
          <Typography sx={{ fontSize: 12, color: "text.secondary", ml: 0.5 }}>
            목표별 체크리스트 달성 현황
          </Typography>
        </Stack>

        <Box sx={{ borderRadius: "12px", bgcolor: "#F8F9FF", p: 2, mb: 2 }}>
          <Stack
            direction="row"
            sx={{ alignItems: "center", justifyContent: "space-between", mb: 1 }}
          >
            <Typography sx={{ fontSize: 14, color: "text.secondary" }}>전체 달성률</Typography>
            <Typography
              sx={{ fontSize: 18, fontWeight: 700, color: "primary.main", fontFamily: mono }}
            >
              {overall}%
            </Typography>
          </Stack>
          <Box
            sx={{
              height: 10,
              borderRadius: "999px",
              bgcolor: "background.paper",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                height: "100%",
                borderRadius: "999px",
                width: `${overall}%`,
                background: "linear-gradient(90deg,#6C63FF,#8B5CF6)",
              }}
            />
          </Box>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3,1fr)" },
            gap: 1.5,
          }}
        >
          {EDUCATION_GOALS.map((g) => {
            const p = goalProgress(g.id);
            return (
              <Box
                key={g.id}
                sx={{ borderRadius: "12px", border: "1px solid", borderColor: "divider", p: 2 }}
              >
                <Typography
                  sx={{ fontWeight: 500, fontSize: 14, color: "text.primary", mb: 0.25 }}
                >
                  {g.title}
                </Typography>
                {g.desc && (
                  <Typography
                    sx={{ fontSize: 12, color: "text.secondary", mb: 1, lineHeight: 1.625 }}
                  >
                    {g.desc}
                  </Typography>
                )}
                <Stack
                  direction="row"
                  sx={{ alignItems: "center", justifyContent: "space-between", mb: 0.5 }}
                >
                  <Typography sx={{ fontSize: 12, color: "text.secondary", fontFamily: mono }}>
                    {p.done}/{p.total}
                  </Typography>
                  <Typography
                    sx={{ fontSize: 12, fontWeight: 600, color: "text.primary", fontFamily: mono }}
                  >
                    {p.pct}%
                  </Typography>
                </Stack>
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
                      bgcolor: "primary.main",
                      width: `${p.pct}%`,
                    }}
                  />
                </Box>
              </Box>
            );
          })}
        </Box>
      </Paper>

      {/* 체크리스트 */}
      <Paper elevation={0} sx={cardSx}>
        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.5 }}
        >
          <Typography sx={{ fontWeight: 600, color: "text.primary" }}>체크리스트</Typography>
          <Box
            component="button"
            onClick={() => navigate("/calendar?type=edu")}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.25,
              p: 0,
              border: "none",
              bgcolor: "transparent",
              cursor: "pointer",
              fontSize: 12,
              color: "primary.main",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            교육 캘린더 <ChevronRight sx={{ width: 12, height: 12 }} />
          </Box>
        </Stack>
        <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 2 }}>
          체크한 항목은 교육 캘린더(교육 일정)의 완료일에 표시됩니다.
        </Typography>

        <Stack sx={{ gap: 2.5 }}>
          {EDUCATION_GOALS.map((g) => {
            const items = CHECKLIST.filter((c) => c.goalId === g.id);
            return (
              <Box key={g.id}>
                <Typography
                  sx={{ fontSize: 12, fontWeight: 600, color: "text.secondary", mb: 1 }}
                >
                  {g.title}
                </Typography>
                <Stack sx={{ gap: 0.75 }}>
                  {items.map((c) => {
                    const checked = c.id in doneMap;
                    return (
                      <Box
                        key={c.id}
                        component="button"
                        onClick={() => handleToggle(c.id)}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.25,
                          p: 1,
                          mx: -1,
                          borderRadius: "8px",
                          border: "none",
                          bgcolor: "transparent",
                          textAlign: "left",
                          cursor: "pointer",
                          transition: "background-color 0.15s",
                          "&:hover": { bgcolor: "#F8F9FF" },
                        }}
                      >
                        {checked ? (
                          <CheckCircle
                            sx={{ width: 20, height: 20, color: "primary.main", flexShrink: 0 }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              borderRadius: "999px",
                              border: "2px solid",
                              borderColor: "divider",
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <Typography
                          sx={{
                            fontSize: 14,
                            textDecoration: checked ? "line-through" : "none",
                            color: checked ? "text.secondary" : "text.primary",
                          }}
                        >
                          {c.title}
                        </Typography>
                        {checked && (
                          <Typography
                            sx={{
                              ml: "auto",
                              fontSize: 11,
                              color: "text.secondary",
                              flexShrink: 0,
                              fontFamily: mono,
                            }}
                          >
                            {doneMap[c.id]}
                          </Typography>
                        )}
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      </Paper>

      {/* 수강 강의 목록 (정확도) */}
      <Paper elevation={0} sx={cardSx}>
        <Stack direction="row" sx={{ alignItems: "center", gap: 1, mb: 2 }}>
          <School sx={{ width: 16, height: 16, color: "primary.main" }} />
          <Typography sx={{ fontWeight: 600, color: "text.primary" }}>수강 강의 목록</Typography>
          <Typography sx={{ fontSize: 12, color: "text.secondary", ml: 0.5 }}>
            지금까지 수강한 강의·정확도
          </Typography>
        </Stack>
        <Stack sx={{ gap: 2 }}>
          {LEARNING_COURSES.map((c) => {
            const pct = Math.round((c.done / c.total) * 100);
            return (
              <Stack key={c.title} direction="row" sx={{ alignItems: "center", gap: 1.5 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack
                    direction="row"
                    sx={{ alignItems: "center", justifyContent: "space-between", mb: 0.5 }}
                  >
                    <Typography
                      sx={{
                        fontSize: 14,
                        color: "text.primary",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {c.title}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 11,
                        color: "text.secondary",
                        flexShrink: 0,
                        ml: 1,
                        fontFamily: mono,
                      }}
                    >
                      {c.done}/{c.total} · {pct}%
                    </Typography>
                  </Stack>
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
                <Box
                  component="span"
                  sx={{
                    flexShrink: 0,
                    px: 1,
                    py: 0.5,
                    borderRadius: "999px",
                    fontSize: 12,
                    fontWeight: 500,
                    bgcolor: "#F8F9FF",
                    color: "text.primary",
                  }}
                >
                  정확도 {c.accuracy}%
                </Box>
              </Stack>
            );
          })}
        </Stack>
      </Paper>

      {/* 체크리스트 달성 히스토리 */}
      <Paper elevation={0} sx={cardSx}>
        <Typography sx={{ fontWeight: 600, color: "text.primary", mb: 2 }}>
          체크리스트 달성 히스토리
        </Typography>
        {history.length === 0 ? (
          <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
            아직 달성한 항목이 없습니다.
          </Typography>
        ) : (
          <Stack sx={{ gap: 1 }}>
            {history.map((h) => (
              <Stack
                key={h.id}
                direction="row"
                sx={{ alignItems: "center", gap: 1.25, fontSize: 14 }}
              >
                <CheckCircle sx={{ width: 16, height: 16, color: "#22C55E", flexShrink: 0 }} />
                <Typography sx={{ fontSize: 14, color: "text.primary", flex: 1 }}>
                  {h.title}
                </Typography>
                <Typography
                  sx={{ fontSize: 12, color: "text.secondary", flexShrink: 0, fontFamily: mono }}
                >
                  {h.date}
                </Typography>
              </Stack>
            ))}
          </Stack>
        )}
      </Paper>
    </Stack>
  );
}
