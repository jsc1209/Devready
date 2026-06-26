import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  CheckCircle,
  ChevronRight,
  ExpandMore,
  Email,
  Refresh,
  Check,
  Close,
} from "@mui/icons-material";
import { signup } from "../api/authApi";

const TERMS_LIST = [
  { id: "service", label: "서비스 이용약관", required: true, content: "제1조(목적) 이 약관은 DevReady가 제공하는 서비스의 이용 조건 및 절차, 회사와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.\n\n제2조(정의) '서비스'란 회사가 제공하는 AI 면접 시뮬레이션, 채용 정보, 교육 콘텐츠 등 일체의 서비스를 의미합니다.\n\n제3조(약관의 효력) 이 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다." },
  { id: "privacy", label: "개인정보 처리방침", required: true, content: "DevReady는 개인정보보호법에 따라 이용자의 개인정보 보호 및 권익을 보호합니다.\n\n1. 수집 항목: 이름, 이메일, 비밀번호, 휴대폰 번호\n2. 수집 목적: 회원 관리, 서비스 제공, 고객 지원\n3. 보유 기간: 회원 탈퇴 시까지" },
  { id: "age", label: "만 14세 이상 확인", required: true, content: "본 서비스는 만 14세 이상 이용 가능합니다. 만 14세 미만인 경우 법정대리인의 동의가 필요합니다." },
  { id: "marketing", label: "마케팅 정보 수신 동의 (이메일)", required: false, content: "DevReady의 새로운 서비스, 이벤트, 프로모션 등의 마케팅 정보를 이메일로 수신합니다. 마이페이지에서 언제든지 변경하실 수 있습니다." },
  { id: "sms", label: "마케팅 정보 수신 동의 (문자/앱푸시)", required: false, content: "DevReady의 마케팅 정보를 문자 및 앱 푸시로 수신합니다. 마이페이지에서 언제든지 변경하실 수 있습니다." },
];

const SNS_BUTTONS = [
  { id: "kakao", label: "카카오로 시작하기", bg: "#FEE500", text: "#191919",
    logo: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1.5C4.858 1.5 1.5 4.134 1.5 7.35c0 2.034 1.356 3.822 3.402 4.854l-.87 3.234a.225.225 0 0 0 .342.243L8.1 13.374a8.4 8.4 0 0 0 .9.048c4.142 0 7.5-2.634 7.5-5.85C16.5 4.134 13.142 1.5 9 1.5Z" fill="#191919"/></svg> },
  { id: "naver", label: "네이버로 시작하기", bg: "#03C75A", text: "#ffffff",
    logo: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M10.26 9.27 7.56 5.25H5.25v7.5h2.49V8.73l2.7 4.02h2.31V5.25H10.26v4.02Z" fill="white"/></svg> },
];

const STEPS = [
  { id: "info", label: "기본 정보" },
  { id: "terms", label: "약관 동의" },
  { id: "verify", label: "이메일 인증" },
  { id: "done", label: "가입 완료" },
];

function StepIndicator({ current }) {
  const idx = STEPS.findIndex((s) => s.id === current);
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 4 }}>
      {STEPS.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <Box key={s.id} sx={{ display: "flex", alignItems: "center" }}>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "999px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  transition: "background-color .2s, color .2s",
                  ...(done || active
                    ? { backgroundColor: "#6C63FF", color: "#fff" }
                    : { backgroundColor: "#F3F4F6", color: "#9CA3AF" }),
                }}
              >
                {done ? <Check sx={{ fontSize: 16 }} /> : i + 1}
              </Box>
              <Typography
                component="span"
                sx={{
                  fontSize: 12,
                  whiteSpace: "nowrap",
                  ...(active
                    ? { fontWeight: 500, color: "#1F2937" }
                    : { color: "#9CA3AF" }),
                }}
              >
                {s.label}
              </Typography>
            </Box>
            {i < STEPS.length - 1 && (
              <Box
                sx={{
                  width: 40,
                  height: "2px",
                  mx: 0.5,
                  mb: 2,
                  transition: "background-color .2s",
                  backgroundColor: i < idx ? "#6C63FF" : "#E5E7EB",
                }}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
}

const inputBaseSx = {
  width: "100%",
  px: 2,
  py: 1.25,
  borderRadius: "12px",
  bgcolor: "#F9FAFB",
  border: "1px solid",
  fontSize: 14,
  font: "inherit",
  color: "#111827",
  outline: "none",
  transition: "border-color .2s, box-shadow .2s",
  boxSizing: "border-box",
  "&::placeholder": { color: "#9CA3AF" },
};

export default function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState("info");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", phone: "", companyName: "", businessNumber: "", department: "" });

  const [agreed, setAgreed] = useState({});
  const [expanded, setExpanded] = useState(null);
  const allRequired = TERMS_LIST.filter((t) => t.required).every((t) => agreed[t.id]);
  const allChecked = TERMS_LIST.every((t) => agreed[t.id]);
  function toggleAll(val) {
    const next = {};
    TERMS_LIST.forEach((t) => { next[t.id] = val; });
    setAgreed(next);
  }

  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verified, setVerified] = useState(false);

  const [submitErr, setSubmitErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function sendCode() {
    const mock = String(Math.floor(100000 + Math.random() * 900000));
    setCode(mock);
    setCodeSent(true);
    setVerifyError("");
    setResendCooldown(60);
    const timer = setInterval(() => {
      setResendCooldown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    window.alert("[개발 테스트] 인증코드: " + mock);
  }

  function verifyCode() {
    if (codeInput === code) {
      setVerified(true);
      setVerifyError("");
    } else {
      setVerifyError("인증 코드가 올바르지 않습니다.");
    }
  }

  function validateInfo() {
    const e = {};
    if (!form.name.trim()) e.name = "이름을 입력해주세요.";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "올바른 이메일을 입력해주세요.";
    if (form.password.length < 8) e.password = "비밀번호는 8자 이상이어야 합니다.";
    if (form.password !== form.confirm) e.confirm = "비밀번호가 일치하지 않습니다.";
    if (!form.phone.trim()) e.phone = "휴대폰 번호를 입력해주세요.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const finishSignup = async () => {
    if (!verified) return;
    setSubmitErr("");
    setSubmitting(true);
    try {
      const data = await signup(form.email, form.password);
      if (data.success) {
        setStep("done");
      } else {
        setSubmitErr(data.message || "회원가입 실패");
      }
    } catch (e) {
      setSubmitErr(e.response?.data?.message || "서버 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputBorder = (field) =>
    errors[field]
      ? { borderColor: "#F87171" }
      : { borderColor: "#E5E7EB", "&:focus": { borderColor: "#818CF8", boxShadow: "0 0 0 2px rgba(108,99,255,0.2)" } };

  if (step === "done") {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
          py: 6,
          background: "linear-gradient(135deg, #F8F9FF 0%, #EEF0FF 100%)",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 448, textAlign: "center" }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: "999px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 3,
              backgroundColor: "#EEF2FF",
            }}
          >
            <CheckCircle sx={{ fontSize: 40, color: "#6C63FF" }} />
          </Box>
          <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#111827", mb: 1 }}>
            가입이 완료됐습니다!
          </Typography>
          <Typography sx={{ color: "#6B7280", mb: 4 }}>
            DevReady와 함께 합격의 여정을 시작하세요.
          </Typography>
          <Box
            component="button"
            type="button"
            onClick={() => navigate("/auth")}
            sx={{
              width: "100%",
              py: 1.5,
              borderRadius: "12px",
              color: "#fff",
              fontWeight: 600,
              border: "none",
              font: "inherit",
              cursor: "pointer",
              backgroundColor: "#6C63FF",
              transition: "opacity .2s",
              "&:hover": { opacity: 0.9 },
            }}
          >
            서비스 시작하기
          </Box>
          <Box
            component="button"
            type="button"
            onClick={() => navigate("/auth")}
            sx={{
              width: "100%",
              mt: 1.5,
              py: 1.5,
              borderRadius: "12px",
              border: "1px solid",
              borderColor: "#E5E7EB",
              color: "#4B5563",
              fontSize: 14,
              bgcolor: "transparent",
              font: "inherit",
              cursor: "pointer",
              transition: "background-color .2s",
              "&:hover": { bgcolor: "#F9FAFB" },
            }}
          >
            로그인 페이지로
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 6,
        background: "linear-gradient(135deg, #F8F9FF 0%, #EEF0FF 100%)",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 448 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
              backgroundColor: "#6C63FF",
              boxShadow: "0 8px 24px rgba(99,102,241,0.3)",
            }}
          >
            <Typography
              component="span"
              sx={{ color: "#fff", fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 1, fontSize: 20 }}
            >
              DR
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#111827" }}>회원가입</Typography>
          <Typography sx={{ fontSize: 14, color: "#6B7280", mt: 0.5 }}>
            DevReady에 오신 것을 환영합니다
          </Typography>
        </Box>

        <StepIndicator current={step} />

        <Box
          sx={{
            borderRadius: "16px",
            border: "1px solid",
            borderColor: "#E5E7EB",
            bgcolor: "#fff",
            boxShadow: 1,
            p: 3.5,
          }}
        >
          {/* STEP 1: 기본 정보 */}
          {step === "info" && (
            <>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
                {SNS_BUTTONS.map((s) => (
                  <Box
                    key={s.id}
                    component="button"
                    type="button"
                    onClick={() => window.alert("소셜 로그인은 준비 중입니다.")}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1.25,
                      py: 1.25,
                      borderRadius: "12px",
                      fontSize: 14,
                      fontWeight: 500,
                      font: "inherit",
                      cursor: "pointer",
                      background: s.bg,
                      color: s.text,
                      border: "none",
                      transition: "opacity .2s",
                      "&:hover": { opacity: 0.9 },
                    }}
                  >
                    {s.logo}{s.label}
                  </Box>
                ))}
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <Box sx={{ flex: 1, height: "1px", bgcolor: "#E5E7EB" }} />
                <Typography component="span" sx={{ fontSize: 12, color: "#9CA3AF" }}>
                  또는 이메일로 가입
                </Typography>
                <Box sx={{ flex: 1, height: "1px", bgcolor: "#E5E7EB" }} />
              </Box>
              <Box
                component="form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (validateInfo()) setStep("terms");
                }}
                sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
              >
                <Box>
                  <Box
                    component="input"
                    type="text"
                    placeholder="이름 *"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    sx={{ ...inputBaseSx, ...inputBorder("name") }}
                  />
                  {errors.name && (
                    <Typography sx={{ fontSize: 12, color: "#EF4444", mt: 0.5 }}>{errors.name}</Typography>
                  )}
                </Box>
                <Box>
                  <Box
                    component="input"
                    type="email"
                    placeholder="이메일 *"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    sx={{ ...inputBaseSx, ...inputBorder("email") }}
                  />
                  {errors.email && (
                    <Typography sx={{ fontSize: 12, color: "#EF4444", mt: 0.5 }}>{errors.email}</Typography>
                  )}
                </Box>
                <Box>
                  <Box
                    component="input"
                    type="tel"
                    placeholder="휴대폰 번호 * (010-0000-0000)"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    sx={{ ...inputBaseSx, ...inputBorder("phone") }}
                  />
                  {errors.phone && (
                    <Typography sx={{ fontSize: 12, color: "#EF4444", mt: 0.5 }}>{errors.phone}</Typography>
                  )}
                </Box>
                <Box sx={{ position: "relative" }}>
                  <Box
                    component="input"
                    type={showPw ? "text" : "password"}
                    placeholder="비밀번호 * (8자 이상)"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    sx={{ ...inputBaseSx, ...inputBorder("password") }}
                  />
                  <Box
                    component="button"
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    sx={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#9CA3AF",
                      bgcolor: "transparent",
                      border: "none",
                      p: 0,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {showPw ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                  </Box>
                  {errors.password && (
                    <Typography sx={{ fontSize: 12, color: "#EF4444", mt: 0.5 }}>{errors.password}</Typography>
                  )}
                </Box>
                <Box sx={{ position: "relative" }}>
                  <Box
                    component="input"
                    type={showConfirmPw ? "text" : "password"}
                    placeholder="비밀번호 확인 *"
                    value={form.confirm}
                    onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                    sx={{ ...inputBaseSx, ...inputBorder("confirm") }}
                  />
                  <Box
                    component="button"
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    sx={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#9CA3AF",
                      bgcolor: "transparent",
                      border: "none",
                      p: 0,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {showConfirmPw ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                  </Box>
                  {errors.confirm && (
                    <Typography sx={{ fontSize: 12, color: "#EF4444", mt: 0.5 }}>{errors.confirm}</Typography>
                  )}
                </Box>
                <Box
                  component="button"
                  type="submit"
                  sx={{
                    width: "100%",
                    py: 1.5,
                    borderRadius: "12px",
                    color: "#fff",
                    fontWeight: 600,
                    mt: 0.5,
                    border: "none",
                    font: "inherit",
                    cursor: "pointer",
                    backgroundColor: "#6C63FF",
                    transition: "opacity .2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 0.75,
                    "&:hover": { opacity: 0.9 },
                  }}
                >
                  다음 <ChevronRight sx={{ fontSize: 16 }} />
                </Box>
              </Box>
              <Typography sx={{ textAlign: "center", fontSize: 14, color: "#6B7280", mt: 2 }}>
                이미 계정이 있으신가요?{" "}
                <Box
                  component="button"
                  type="button"
                  onClick={() => navigate("/auth")}
                  sx={{
                    fontWeight: 500,
                    color: "#6C63FF",
                    bgcolor: "transparent",
                    border: "none",
                    p: 0,
                    font: "inherit",
                    cursor: "pointer",
                    "&:hover": { opacity: 0.8 },
                  }}
                >
                  로그인
                </Box>
              </Typography>
            </>
          )}

          {/* STEP 2: 약관 동의 */}
          {step === "terms" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Typography sx={{ fontSize: 14, color: "#6B7280", mb: 0.5 }}>
                서비스 이용을 위해 아래 약관에 동의해주세요.
              </Typography>
              <Box
                component="label"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 1.75,
                  borderRadius: "12px",
                  border: "2px solid",
                  cursor: "pointer",
                  transition: "border-color .2s, background-color .2s",
                  borderColor: allChecked ? "#6C63FF" : "#E5E7EB",
                  backgroundColor: allChecked ? "#EEF2FF" : "#F9FAFB",
                }}
              >
                <Box
                  onClick={() => toggleAll(!allChecked)}
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid",
                    flexShrink: 0,
                    cursor: "pointer",
                    transition: "border-color .2s, background-color .2s",
                    borderColor: allChecked ? "#6C63FF" : "#D1D5DB",
                    backgroundColor: allChecked ? "#6C63FF" : "transparent",
                  }}
                >
                  {allChecked && <Check sx={{ fontSize: 14, color: "#fff" }} />}
                </Box>
                <Typography component="span" sx={{ fontWeight: 600, color: "#1F2937" }}>
                  전체 동의
                </Typography>
                <Typography component="span" sx={{ fontSize: 12, color: "#9CA3AF", ml: "auto" }}>
                  필수 및 선택 포함
                </Typography>
              </Box>
              <Box sx={{ height: "1px", bgcolor: "#F3F4F6" }} />
              {TERMS_LIST.map((term) => (
                <Box key={term.id} sx={{ border: "1px solid", borderColor: "#E5E7EB", borderRadius: "12px", overflow: "hidden" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.75 }}>
                    <Box
                      onClick={() => setAgreed((a) => ({ ...a, [term.id]: !a[term.id] }))}
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "2px solid",
                        flexShrink: 0,
                        cursor: "pointer",
                        transition: "border-color .2s, background-color .2s",
                        borderColor: agreed[term.id] ? "#6C63FF" : "#D1D5DB",
                        backgroundColor: agreed[term.id] ? "#6C63FF" : "transparent",
                      }}
                    >
                      {agreed[term.id] && <Check sx={{ fontSize: 14, color: "#fff" }} />}
                    </Box>
                    <Typography component="span" sx={{ fontSize: 14, color: "#1F2937", flex: 1 }}>
                      {term.label}
                      <Box
                        component="span"
                        sx={{ ml: 0.75, fontSize: 12, fontWeight: 500, color: term.required ? "#EF4444" : "#9CA3AF" }}
                      >
                        ({term.required ? "필수" : "선택"})
                      </Box>
                    </Typography>
                    <Box
                      component="button"
                      type="button"
                      onClick={() => setExpanded(expanded === term.id ? null : term.id)}
                      sx={{
                        p: 0.5,
                        color: "#9CA3AF",
                        bgcolor: "transparent",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        "&:hover": { color: "#4B5563" },
                      }}
                    >
                      <ExpandMore
                        sx={{
                          fontSize: 16,
                          transition: "transform .2s",
                          transform: expanded === term.id ? "rotate(180deg)" : "none",
                        }}
                      />
                    </Box>
                  </Box>
                  {expanded === term.id && (
                    <Box sx={{ px: 2, pb: 1.5, pt: 0.5, bgcolor: "#F9FAFB", borderTop: "1px solid", borderColor: "#F3F4F6" }}>
                      <Typography sx={{ fontSize: 12, color: "#6B7280", lineHeight: 1.625, whiteSpace: "pre-line" }}>
                        {term.content}
                      </Typography>
                    </Box>
                  )}
                </Box>
              ))}
              {!allRequired && (
                <Typography sx={{ fontSize: 12, color: "#EF4444", textAlign: "center" }}>
                  필수 약관에 모두 동의해주세요.
                </Typography>
              )}
              <Box
                component="button"
                type="button"
                onClick={() => {
                  if (allRequired) setStep("verify");
                }}
                disabled={!allRequired}
                sx={{
                  width: "100%",
                  py: 1.5,
                  borderRadius: "12px",
                  color: "#fff",
                  fontWeight: 600,
                  mt: 0.5,
                  border: "none",
                  font: "inherit",
                  cursor: "pointer",
                  backgroundColor: "#6C63FF",
                  transition: "opacity .2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.75,
                  "&:hover": { opacity: 0.9 },
                  "&:disabled": { opacity: 0.4, cursor: "default" },
                }}
              >
                다음 <ChevronRight sx={{ fontSize: 16 }} />
              </Box>
              <Box
                component="button"
                type="button"
                onClick={() => setStep("info")}
                sx={{
                  width: "100%",
                  py: 1,
                  fontSize: 14,
                  color: "#6B7280",
                  bgcolor: "transparent",
                  border: "none",
                  font: "inherit",
                  cursor: "pointer",
                  transition: "color .2s",
                  "&:hover": { color: "#1F2937" },
                }}
              >
                이전으로
              </Box>
            </Box>
          )}

          {/* STEP 3: 이메일 인증 */}
          {step === "verify" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ textAlign: "center", mb: 1 }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: "16px",
                    bgcolor: "#EEF2FF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 1.5,
                  }}
                >
                  <Email sx={{ fontSize: 28, color: "#6C63FF" }} />
                </Box>
                <Typography sx={{ fontSize: 14, color: "#4B5563" }}>
                  <Box component="span" sx={{ fontWeight: 500, color: "#1F2937" }}>{form.email}</Box>으로
                  <br />
                  인증 코드를 발송합니다.
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Box
                  component="input"
                  type="email"
                  value={form.email}
                  readOnly
                  sx={{
                    flex: 1,
                    px: 2,
                    py: 1.25,
                    borderRadius: "12px",
                    bgcolor: "#F9FAFB",
                    border: "1px solid",
                    borderColor: "#E5E7EB",
                    fontSize: 14,
                    color: "#6B7280",
                    font: "inherit",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <Box
                  component="button"
                  type="button"
                  onClick={sendCode}
                  disabled={resendCooldown > 0 || verified}
                  sx={{
                    flexShrink: 0,
                    px: 2,
                    py: 1.25,
                    borderRadius: "12px",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#fff",
                    border: "none",
                    font: "inherit",
                    cursor: "pointer",
                    backgroundColor: "#6C63FF",
                    transition: "opacity .2s",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    "&:hover": { opacity: 0.9 },
                    "&:disabled": { opacity: 0.4, cursor: "default" },
                  }}
                >
                  {resendCooldown > 0 ? (
                    <>
                      <Refresh sx={{ fontSize: 14 }} />
                      {resendCooldown}s
                    </>
                  ) : codeSent ? (
                    "재발송"
                  ) : (
                    "발송"
                  )}
                </Box>
              </Box>
              {codeSent && !verified && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Box
                      component="input"
                      type="text"
                      placeholder="인증 코드 6자리"
                      maxLength={6}
                      value={codeInput}
                      onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, ""))}
                      sx={{
                        flex: 1,
                        px: 2,
                        py: 1.25,
                        borderRadius: "12px",
                        border: "1px solid",
                        fontSize: 14,
                        font: "inherit",
                        color: "#111827",
                        outline: "none",
                        bgcolor: "#fff",
                        boxSizing: "border-box",
                        transition: "border-color .2s, box-shadow .2s",
                        ...(verifyError
                          ? { borderColor: "#F87171" }
                          : { borderColor: "#E5E7EB", "&:focus": { borderColor: "#818CF8", boxShadow: "0 0 0 2px rgba(108,99,255,0.2)" } }),
                      }}
                    />
                    <Box
                      component="button"
                      type="button"
                      onClick={verifyCode}
                      sx={{
                        flexShrink: 0,
                        px: 2,
                        py: 1.25,
                        borderRadius: "12px",
                        fontSize: 14,
                        fontWeight: 500,
                        border: "2px solid",
                        borderColor: "#6C63FF",
                        color: "#6C63FF",
                        bgcolor: "transparent",
                        font: "inherit",
                        cursor: "pointer",
                        transition: "background-color .2s",
                        "&:hover": { bgcolor: "#F9FAFB" },
                      }}
                    >
                      확인
                    </Box>
                  </Box>
                  {verifyError && (
                    <Typography sx={{ fontSize: 12, color: "#EF4444", display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Close sx={{ fontSize: 12 }} />
                      {verifyError}
                    </Typography>
                  )}
                </Box>
              )}
              {verified && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    fontSize: 14,
                    color: "#16A34A",
                    bgcolor: "#F0FDF4",
                    border: "1px solid",
                    borderColor: "#BBF7D0",
                    borderRadius: "12px",
                    px: 2,
                    py: 1.5,
                  }}
                >
                  <CheckCircle sx={{ fontSize: 16, flexShrink: 0 }} />
                  이메일 인증이 완료되었습니다.
                </Box>
              )}
              {!codeSent && (
                <Typography sx={{ fontSize: 12, color: "#9CA3AF", textAlign: "center" }}>
                  이메일을 받지 못하셨나요? 스팸함을 확인해주세요.
                </Typography>
              )}
              <Box
                component="button"
                type="button"
                onClick={finishSignup}
                disabled={!verified || submitting}
                sx={{
                  width: "100%",
                  py: 1.5,
                  borderRadius: "12px",
                  color: "#fff",
                  fontWeight: 600,
                  mt: 0.5,
                  border: "none",
                  font: "inherit",
                  cursor: "pointer",
                  backgroundColor: "#6C63FF",
                  transition: "opacity .2s",
                  "&:hover": { opacity: 0.9 },
                  "&:disabled": { opacity: 0.4, cursor: "default" },
                }}
              >
                {submitting ? "처리 중..." : "가입 완료"}
              </Box>
              {submitErr && (
                <Typography sx={{ fontSize: 12, color: "#EF4444", textAlign: "center" }}>
                  {submitErr}
                </Typography>
              )}
              <Box
                component="button"
                type="button"
                onClick={() => setStep("terms")}
                sx={{
                  width: "100%",
                  py: 1,
                  fontSize: 14,
                  color: "#6B7280",
                  bgcolor: "transparent",
                  border: "none",
                  font: "inherit",
                  cursor: "pointer",
                  transition: "color .2s",
                  "&:hover": { color: "#1F2937" },
                }}
              >
                이전으로
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
