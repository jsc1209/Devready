import { Box, Paper, Typography, IconButton, Stack } from "@mui/material";
import {
  Favorite,
  FavoriteBorder,
  LocationOn,
  AccessTime,
  WorkOutlined,
} from "@mui/icons-material";
import { dDay } from "../../data/jobsMock";

/**
 * 공고 목록(/jobs)의 카드 1개. 클릭 시 상세로 이동(onClick 은 부모가 navigate 처리).
 * props: job, wished(bool), onToggleWish(id, e), onClick
 */
export default function JobCard({ job, wished, onToggleWish, onClick }) {
  const dd = dDay(job.deadline);
  const isClose =
    dd !== "마감" && dd !== "D-Day" && parseInt(dd.replace("D-", ""), 10) <= 7;
  const ddUrgent = isClose || dd === "D-Day";

  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        borderRadius: "16px",
        border: "1px solid",
        borderColor: "divider",
        p: 2.5,
        cursor: "pointer",
        transition: "all .2s",
        "&:hover": { boxShadow: 3, borderColor: "rgba(108,99,255,0.3)" },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          mb: 1.5,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
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
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: "text.primary" }}>
                {job.company}
              </Typography>
              {job.hot && (
                <Box
                  component="span"
                  sx={{
                    fontSize: 11,
                    bgcolor: "#FEF2F2",
                    color: "#EF4444",
                    border: "1px solid #FECACA",
                    px: 0.75,
                    py: 0.25,
                    borderRadius: "999px",
                  }}
                >
                  🔥 인기
                </Box>
              )}
              {job.new && (
                <Box
                  component="span"
                  sx={{
                    fontSize: 11,
                    bgcolor: "#EFF6FF",
                    color: "#3B82F6",
                    border: "1px solid #BFDBFE",
                    px: 0.75,
                    py: 0.25,
                    borderRadius: "999px",
                  }}
                >
                  NEW
                </Box>
              )}
            </Stack>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                mt: 0.25,
                fontSize: 12,
                color: "text.secondary",
              }}
            >
              <LocationOn sx={{ fontSize: 12 }} />
              {job.location} ·
              <WorkOutlined sx={{ fontSize: 12, ml: 0.25 }} />
              {job.type}
            </Box>
          </Box>
        </Stack>
        <IconButton
          size="small"
          aria-label="찜"
          onClick={(e) => onToggleWish(job.id, e)}
        >
          {wished ? (
            <Favorite sx={{ fontSize: 20, color: "#F87171" }} />
          ) : (
            <FavoriteBorder sx={{ fontSize: 20, color: "text.secondary" }} />
          )}
        </IconButton>
      </Box>

      <Typography sx={{ fontWeight: 600, color: "text.primary", mb: 1 }}>
        {job.title}
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.5 }}>
        {job.tags.map((t) => (
          <Box
            key={t}
            component="span"
            sx={{
              fontSize: 12,
              bgcolor: "grey.100",
              border: "1px solid",
              borderColor: "divider",
              px: 1,
              py: 0.25,
              borderRadius: "999px",
              color: "text.secondary",
            }}
          >
            {t}
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 12,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ color: "text.secondary" }}>
          <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <AccessTime sx={{ fontSize: 12 }} />
            {job.deadline}
          </Box>
          {job.salary !== "협의" && <Box component="span">{job.salary}</Box>}
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box component="span" sx={{ color: "text.secondary" }}>
            {job.applicants}명 지원
          </Box>
          <Box
            component="span"
            sx={{
              fontWeight: 500,
              px: 1,
              py: 0.25,
              borderRadius: "999px",
              bgcolor: ddUrgent ? "#FEF2F2" : "grey.100",
              color: ddUrgent ? "#EF4444" : "text.secondary",
            }}
          >
            {dd}
          </Box>
        </Stack>
      </Box>
    </Paper>
  );
}
