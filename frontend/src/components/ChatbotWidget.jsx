import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Paper, Typography, IconButton, TextField, Fab, CircularProgress } from "@mui/material";
import { SmartToy, Close, Send } from "@mui/icons-material";
import { sendChat } from "../api/chatbotApi";

/**
 * 전역 챗봇 위젯 — 우하단 FAB + 펼쳐지는 채팅 패널.
 * Layout 에 마운트되므로 Layout 자식 라우트(대부분 페이지)에만 노출되고
 * /interview/session·/admin(= Layout 밖)에서는 자동으로 안 뜬다.
 * 메시지 목록·열림·입력·로딩 모두 컴포넌트 로컬 useState(전역 스토어 미사용).
 */
const INITIAL_MESSAGES = [
  {
    role: "bot",
    text: "안녕하세요! DevReady 도우미예요. 서비스 이용 방법이 궁금하면 무엇이든 물어보세요 😊",
  },
];

// FAB·패널 공통 고정 위치(우하단, Header/토스트 위로)
const ANCHOR_SX = {
  position: "fixed",
  bottom: 24,
  right: 24,
  zIndex: (theme) => theme.zIndex.snackbar,
};

export default function ChatbotWidget() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  // 새 메시지/로딩 변화 시 맨 아래로 자동 스크롤(패널 열려 있을 때만)
  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      const res = await sendChat(text);
      if (res?.ok) {
        setMessages((prev) => [...prev, { role: "bot", text: res.answer, source: res.source }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "bot", text: res?.error || "죄송해요, 다시 시도해주세요." },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "연결에 문제가 생겼어요. 잠시 후 다시 시도해주세요." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 닫혀 있을 때 — FAB
  if (!open) {
    return (
      <Fab color="primary" aria-label="챗봇 열기" onClick={() => setOpen(true)} sx={ANCHOR_SX}>
        <SmartToy />
      </Fab>
    );
  }

  // 열려 있을 때 — 채팅 패널
  return (
    <Paper
      elevation={8}
      sx={{
        ...ANCHOR_SX,
        width: 360,
        maxWidth: "calc(100vw - 32px)",
        height: 520,
        maxHeight: "calc(100vh - 48px)",
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* 헤더 바 */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 2,
          py: 1.5,
          bgcolor: "primary.main",
          color: "#fff",
          flexShrink: 0,
        }}
      >
        <SmartToy sx={{ fontSize: 20 }} />
        <Typography sx={{ fontWeight: 600, flex: 1 }}>DevReady 도우미</Typography>
        <IconButton size="small" aria-label="닫기" onClick={() => setOpen(false)} sx={{ color: "#fff" }}>
          <Close sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* 메시지 영역 */}
      <Box sx={{ flex: 1, overflowY: "auto", p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
        {messages.map((m, i) => {
          const isUser = m.role === "user";
          return (
            <Box key={i} sx={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
              <Box
                sx={{
                  maxWidth: "80%",
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: isUser ? "rgba(108,99,255,0.12)" : "grey.100",
                  color: "text.primary",
                  fontSize: 14,
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {m.text}
                {!isUser && m.source === "interview" && (
                  <Typography
                    variant="caption"
                    onClick={() => navigate("/interview")}
                    sx={{
                      display: "block",
                      mt: 0.75,
                      color: "primary.main",
                      cursor: "pointer",
                      fontWeight: 600,
                      "&:hover": { textDecoration: "underline" },
                    }}
                  >
                    → 모의 면접 시작하기
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
            <Box
              sx={{
                maxWidth: "80%",
                p: 1.5,
                borderRadius: 2,
                bgcolor: "grey.100",
                display: "flex",
                alignItems: "center",
                gap: 1,
                fontSize: 14,
                color: "text.secondary",
              }}
            >
              <CircularProgress size={20} />
              답변 생각 중...
            </Box>
          </Box>
        )}
        <Box ref={endRef} />
      </Box>

      {/* 입력 바 */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          p: 1.5,
          borderTop: 1,
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
        <TextField
          size="small"
          fullWidth
          placeholder="메시지를 입력하세요"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <IconButton
          color="primary"
          aria-label="전송"
          onClick={handleSend}
          disabled={loading || !input.trim()}
        >
          <Send sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>
    </Paper>
  );
}
