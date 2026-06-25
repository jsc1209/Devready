import { Routes, Route } from 'react-router-dom'
import { Box, Typography } from '@mui/material'

const Home = () => (
  <Box sx={{ p: 4 }}>
    <Typography variant="h4">DevReady 데모</Typography>
    <Typography color="text.secondary">
      프론트 스캐폴딩 완료 — 기능 페이지는 다음 단계에서 추가
    </Typography>
  </Box>
)

const App = () => (
  <Routes>
    <Route path="/" element={<Home />} />
  </Routes>
)

export default App
