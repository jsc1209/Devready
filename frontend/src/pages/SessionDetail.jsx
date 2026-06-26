import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Typography, CircularProgress } from "@mui/material";
import { ArrowBack, Replay } from "@mui/icons-material";
import InterviewReport from "./InterviewReport";
import { getSession } from "../api/interviewApi";

/**
 * 면접 세션 상세 (/history/:id) — test-demo-UI/SessionDetail.tsx → JS+MUI.
 * 상단 바(기록으로 / 다시 도전) + InterviewReport 본문 재사용.
 * state 없이 진입하므로 InterviewReport 가 MOCK 데이터로 렌더된다.
 * 원본 useParams id 는 미사용이라 생략, Download import 도 미사용이라 생략.
 */
export default function SessionDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(false);
    getSession(id)
      .then((d) => {
        if (!alive) return;
        if (d) setData(d);
        else setError(true);
        setLoading(false);
      })
      .catch(() => {
        if (alive) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <Box>
      <Box sx={{ maxWidth: 1024, mx: "auto", px: 2, pt: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Box
            component="button"
            type="button"
            onClick={() => navigate("/history")}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              fontSize: 14,
              color: "text.secondary",
              bgcolor: "transparent",
              border: "none",
              font: "inherit",
              cursor: "pointer",
              transition: "color .2s",
              "&:hover": { color: "text.primary" },
            }}
          >
            <ArrowBack sx={{ fontSize: 16 }} />
            면접 기록으로
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
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
      </Box>
      {loading ? (
        <Box sx={{ maxWidth: 1024, mx: "auto", px: 2, py: 10, display: "flex", justifyContent: "center" }}>
          <CircularProgress />
        </Box>
      ) : error || !data ? (
        <Box sx={{ maxWidth: 1024, mx: "auto", px: 2, py: 10, textAlign: "center" }}>
          <Typography sx={{ color: "text.secondary" }}>면접 기록을 불러오지 못했습니다.</Typography>
        </Box>
      ) : (
        <InterviewReport data={data} />
      )}
    </Box>
  );
}
