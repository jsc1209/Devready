import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Box, Button, TextField, Typography, Alert, Paper } from "@mui/material";
import { signup } from "../api/authApi";
export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const handleSubmit = async () => {
    setMsg(null); setErr(null); setLoading(true);
    try {
      const data = await signup(email, password);
      if (data.success) {
        setMsg("회원가입 완료! 로그인 페이지로 이동합니다.");
        setTimeout(() => navigate("/login"), 1200);
      } else {
        setErr(data.message || "회원가입 실패");
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
        <Typography variant="h5" gutterBottom>회원가입</Typography>
        {msg && <Alert severity="success" sx={{ mb: 2 }}>{msg}</Alert>}
        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
        <TextField label="이메일" fullWidth margin="normal" value={email}
          onChange={(e) => setEmail(e.target.value)} />
        <TextField label="비밀번호 (4자 이상)" type="password" fullWidth margin="normal" value={password}
          onChange={(e) => setPassword(e.target.value)} />
        <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={handleSubmit} disabled={loading}>
          {loading ? "처리 중..." : "회원가입"}
        </Button>
        <Typography variant="body2" sx={{ mt: 2 }}>
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </Typography>
      </Paper>
    </Box>
  );
}
