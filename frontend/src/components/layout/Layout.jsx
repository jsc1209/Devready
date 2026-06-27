import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import AnnouncementBanner from "./AnnouncementBanner";
import Header from "./Header";
import ChatbotWidget from "../ChatbotWidget";

/**
 * 공통 레이아웃: 상단 띠 + 헤더 + <Outlet/>(페이지 자리).
 * App.jsx 의 모든 라우트가 이 Layout 의 자식으로 들어가 헤더/띠를 공유한다.
 */
export default function Layout() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
      }}
    >
      <AnnouncementBanner />
      <Header />
      <Box component="main" sx={{ flex: 1 }}>
        <Outlet />
      </Box>
      <ChatbotWidget />
    </Box>
  );
}
