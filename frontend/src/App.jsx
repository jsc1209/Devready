import { Routes, Route, Link, Navigate } from 'react-router-dom'
import { Box, Typography, Button, Stack } from '@mui/material'
import ResumeAnalyzePage from './pages/ResumeAnalyzePage'
import SignupPage from "./pages/SignupPage";
import AuthPage from "./pages/AuthPage";
import MyPage from "./pages/MyPage";
import LandingPage from "./pages/LandingPage";
import HistoryPage from "./pages/HistoryPage";
import InterviewLanding from "./pages/InterviewLanding";
import JobsPage from "./pages/JobsPage";
import JobDetailPage from "./pages/JobDetailPage";
import EducationPage from "./pages/EducationPage";
import CodingTestPage from "./pages/CodingTestPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import CommunityPage from "./pages/CommunityPage";
import CalendarPage from "./pages/CalendarPage";
import MyPageFull from "./pages/MyPageFull";
import InterviewSetup from "./pages/InterviewSetup";
import InterviewPayment from "./pages/InterviewPayment";
import InterviewReport from "./pages/InterviewReport";
import InterviewSession from "./pages/InterviewSession";
import SessionDetail from "./pages/SessionDetail";
import AdminPage from "./pages/AdminPage";
import Layout from "./components/layout/Layout";

const Home = () => (
  <Box sx={{ p: 4 }}>
    <Typography variant="h4" gutterBottom>DevReady 데모</Typography>
    <Typography color="text.secondary" sx={{ mb: 3 }}>
      AI 서버 연동 데모 — 기능을 하나씩 추가하는 중
    </Typography>
    <Stack direction="row" spacing={2}>
      <Button component={Link} to="/resume" variant="contained">이력서 분석</Button>
    </Stack>
  </Box>
)

const App = () => (
  <Routes>
    <Route element={<Layout />}>
      <Route path="/" element={<LandingPage />} />
      <Route path="/demo" element={<Home />} />
      <Route path="/resume" element={<ResumeAnalyzePage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/login" element={<Navigate to="/auth" replace />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/me" element={<MyPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/history/:id" element={<SessionDetail />} />
      <Route path="/interview" element={<InterviewLanding />} />
      <Route path="/interview/setup" element={<InterviewSetup />} />
      <Route path="/interview/payment" element={<InterviewPayment />} />
      <Route path="/interview/report/:id" element={<InterviewReport />} />
      <Route path="/jobs" element={<JobsPage />} />
      <Route path="/jobs/:id" element={<JobDetailPage />} />
      <Route path="/education" element={<EducationPage />} />
      <Route path="/education/coding-test" element={<CodingTestPage />} />
      <Route path="/education/course/:id" element={<CourseDetailPage />} />
      <Route path="/community" element={<CommunityPage />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/mypage" element={<MyPageFull />} />
    </Route>
    {/* 면접 진행은 헤더/띠 없는 풀스크린 몰입형 (원본 Root: /interview/session 는 Layout 제외) */}
    <Route path="/interview/session" element={<InterviewSession />} />
    {/* 관리자 페이지도 자체 사이드바 풀스크린 (원본 Root: /admin 는 Layout 제외) */}
    <Route path="/admin" element={<AdminPage />} />
  </Routes>
)

export default App
