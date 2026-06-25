import { Routes, Route, Link } from 'react-router-dom'
import { Box, Typography, Button, Stack } from '@mui/material'
import ResumeAnalyzePage from './pages/ResumeAnalyzePage'
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import MyPage from "./pages/MyPage";
import LandingPage from "./pages/LandingPage";
import HistoryPage from "./pages/HistoryPage";
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
      <Route path="/login" element={<LoginPage />} />
      <Route path="/me" element={<MyPage />} />
      <Route path="/history" element={<HistoryPage />} />
    </Route>
  </Routes>
)

export default App
