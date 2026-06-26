import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Stack,
} from "@mui/material";
import { Search, FilterList } from "@mui/icons-material";
import { TYPE_OPTIONS } from "../data/historyMock";
import { getSessions } from "../api/interviewApi";
import HistoryRow, { HISTORY_GRID } from "../components/history/HistoryRow";

/**
 * 면접 기록 페이지 (test-demo-UI/HistoryPage.tsx → JS+MUI).
 * 공통 레이아웃(헤더/띠)은 App.jsx 의 Layout 이 감싸므로 본문만 렌더.
 */
export default function HistoryPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("전체");
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSessions()
      .then((list) => setSessions(list))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  const totalSessions = sessions.length;
  const avgScore = totalSessions ? Math.round(sessions.reduce((a, x) => a + x.score, 0) / totalSessions) : 0;
  const maxScore = totalSessions ? Math.max(...sessions.map((x) => x.score)) : 0;
  const STATS = [
    { label: "총 세션", value: `${totalSessions}회` },
    { label: "평균 점수", value: totalSessions ? `${avgScore}점` : "-" },
    { label: "최고 점수", value: totalSessions ? `${maxScore}점` : "-" },
  ];

  const filtered = sessions.filter((s) => {
    const matchType = typeFilter === "전체" || s.type === typeFilter;
    const matchSearch =
      s.job.includes(search) || s.type.includes(search) || s.date.includes(search);
    return matchType && matchSearch;
  });

  return (
    <Box sx={{ maxWidth: 1024, mx: "auto", px: 2, py: 5 }}>
      {/* 헤더 */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: 2,
          mb: 4,
        }}
      >
        <Box>
          <Typography sx={{ fontSize: 30, fontWeight: 700 }}>
            면접 기록
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: 14, mt: 0.5 }}>
            총 {totalSessions}회 면접 시뮬레이션을 진행했습니다
          </Typography>
        </Box>
        <Button variant="contained" onClick={() => navigate("/interview/setup")}>
          새 면접 시작
        </Button>
      </Box>

      {/* 요약 통계 */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, mb: 4 }}>
        {STATS.map(({ label, value }) => (
          <Paper key={label} variant="outlined" sx={{ p: 2, textAlign: "center" }}>
            <Typography sx={{ fontFamily: "'DM Mono', monospace", fontSize: 24, fontWeight: 700 }}>
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
          </Paper>
        ))}
      </Box>

      {/* 검색 + 필터 */}
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5, mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="날짜, 직무, 유형으로 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ fontSize: 18 }} />
              </InputAdornment>
            ),
          }}
        />
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
          <FilterList sx={{ fontSize: 18, color: "text.secondary" }} />
          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
            {TYPE_OPTIONS.map((t) => {
              const active = typeFilter === t;
              return (
                <Chip
                  key={t}
                  label={t}
                  size="small"
                  clickable
                  onClick={() => setTypeFilter(t)}
                  color={active ? "primary" : "default"}
                  variant={active ? "filled" : "outlined"}
                />
              );
            })}
          </Box>
        </Stack>
      </Box>

      {/* 기록 표 */}
      <Paper variant="outlined" sx={{ overflow: "hidden" }}>
        {/* 헤더 행 (sm 이상) */}
        <Box
          sx={{
            display: { xs: "none", sm: "grid" },
            gridTemplateColumns: HISTORY_GRID,
            gap: 2,
            px: 2.5,
            py: 1.5,
            borderBottom: 1,
            borderColor: "divider",
            color: "text.secondary",
            fontSize: 12,
          }}
        >
          <span>날짜 / 유형</span>
          <span>직무</span>
          <span>경력</span>
          <span>시간</span>
          <span>점수</span>
          <span />
        </Box>

        <Box>
          {loading ? (
            <Box sx={{ py: 8, textAlign: "center", color: "text.secondary", fontSize: 14 }}>
              불러오는 중…
            </Box>
          ) : (
            <>
              {filtered.map((s, i) => {
                const prev = filtered[i + 1];
                const trend = prev ? s.score - prev.score : null;
                return (
                  <Box key={s.id} sx={{ borderTop: i === 0 ? 0 : 1, borderColor: "divider" }}>
                    <HistoryRow
                      session={s}
                      trend={trend}
                      onClick={() => navigate(`/history/${s.id}`)}
                    />
                  </Box>
                );
              })}
              {filtered.length === 0 && (
                <Box sx={{ py: 8, textAlign: "center", color: "text.secondary", fontSize: 14 }}>
                  {totalSessions === 0 ? "아직 면접 기록이 없습니다" : "검색 결과가 없습니다"}
                </Box>
              )}
            </>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
