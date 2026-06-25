import { Box, Typography } from "@mui/material";
import { ChevronRight, TrendingUp, TrendingDown } from "@mui/icons-material";

// 표 헤더와 행이 같은 컬럼 폭을 쓰도록 공유
export const HISTORY_GRID = "1.5fr 1fr 1fr 80px 80px 40px";

// 등급별 색 (원본 text-green-400/text-primary/text-yellow-400 → MUI 토큰)
function gradeColor(grade) {
  if (grade.startsWith("A")) return "success.main";
  if (grade.startsWith("B")) return "primary.main";
  return "warning.main";
}

/**
 * 면접 기록 1행 (모바일=flex 간략, sm 이상=grid 전체 컬럼).
 * trend 는 부모에서 다음 행과의 점수차로 계산해 전달(null=마지막 행).
 */
export default function HistoryRow({ session, trend, onClick }) {
  return (
    <Box
      component="button"
      onClick={onClick}
      sx={{
        width: "100%",
        display: { xs: "flex", sm: "grid" },
        gridTemplateColumns: { sm: HISTORY_GRID },
        gap: 2,
        alignItems: "center",
        px: 2.5,
        py: 2,
        textAlign: "left",
        bgcolor: "transparent",
        border: 0,
        cursor: "pointer",
        color: "text.primary",
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {session.type}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {session.date}
        </Typography>
      </Box>

      <Typography variant="body2" sx={{ display: { xs: "none", sm: "block" } }}>
        {session.job}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>
        {session.level}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>
        {session.duration}
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: { xs: "auto", sm: 0 } }}>
        <Box>
          <Box component="span" sx={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700 }}>
            {session.score}
          </Box>
          <Box component="span" sx={{ fontSize: 12, ml: 0.5, color: gradeColor(session.grade) }}>
            {session.grade}
          </Box>
        </Box>
        {trend !== null && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.25,
              fontSize: 12,
              color: trend > 0 ? "success.main" : trend < 0 ? "error.main" : "text.secondary",
            }}
          >
            {trend > 0 ? (
              <TrendingUp sx={{ fontSize: 14 }} />
            ) : trend < 0 ? (
              <TrendingDown sx={{ fontSize: 14 }} />
            ) : null}
            {trend > 0 ? "+" : ""}
            {trend !== 0 ? trend : ""}
          </Box>
        )}
      </Box>

      <Box sx={{ display: { xs: "none", sm: "flex" }, justifyContent: "flex-end" }}>
        <ChevronRight sx={{ fontSize: 18, color: "text.secondary" }} />
      </Box>
    </Box>
  );
}
