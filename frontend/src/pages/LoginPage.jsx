import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Box, Button, TextField, Typography, Alert, Paper } from "@mui/material";
import { login } from "../api/authApi";
import useAuthStore from "../store/authStore";
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const handleSubmit = async () => {
    setErr(null); setLoading(true);
    try {
      const data = await login(email, password);
      if (data.success) {
        setAuth(data.data.accessToken, {
          memberId: data.data.memberId,
          email: data.data.email,
          nickname: data.data.nickname,
        });
        navigate("/me");
      } else {
        setErr(data.message || "로그인 실패");
      }
    } catch (e) {
      setErr(e.response?.data?.message || "서버 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
      <Paper sx={{ p: 4, width: 360 }} elevation={3}>
        <Typography variant="h5" gutterBottom>로그인</Typography>
        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
        <TextField label="이메일" fullWidth margin="normal" value={email}
          onChange={(e) => setEmail(e.target.value)} />
        <TextField label="비밀번호" type="password" fullWidth margin="normal" value={password}
          onChange={(e) => setPassword(e.target.value)} />
        <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={handleSubmit} disabled={loading}>
          {loading ? "처리 중..." : "로그인"}
        </Button>
        <Typography variant="body2" sx={{ mt: 2 }}>
          계정이 없으신가요? <Link to="/signup">회원가입</Link>
        </Typography>
      </Paper>
    </Box>
  );
}
