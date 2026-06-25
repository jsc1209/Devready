import { useNavigate } from "react-router-dom";
import { Box, Button, Typography, Paper } from "@mui/material";
import useAuthStore from "../store/authStore";
export default function MyPage() {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();
  if (!token) {
    return (
      <Box sx={{ textAlign: "center", mt: 8 }}>
        <Typography>로그인이 필요합니다.</Typography>
        <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate("/login")}>로그인하러 가기</Button>
      </Box>
    );
  }
  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
      <Paper sx={{ p: 4, width: 420 }} elevation={3}>
        <Typography variant="h5" gutterBottom>마이페이지</Typography>
        <Typography>회원번호: {user?.memberId}</Typography>
        <Typography>이메일: {user?.email}</Typography>
        <Typography>닉네임: {user?.nickname}</Typography>
        <Typography variant="caption" sx={{ display: "block", mt: 2, wordBreak: "break-all", color: "text.secondary" }}>
          JWT: {token}
        </Typography>
        <Button variant="outlined" color="error" sx={{ mt: 3 }} onClick={() => { logout(); navigate("/login"); }}>
          로그아웃
        </Button>
      </Paper>
    </Box>
  );
}
