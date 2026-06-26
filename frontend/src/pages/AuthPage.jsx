import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  ArrowBack,
  CenterFocusStrong,
  CheckCircle,
  Email,
  Refresh,
  Close,
  VpnKey,
  VerifiedUser,
  Person,
} from "@mui/icons-material";
import { login } from "../api/authApi";
import useAuthStore from "../store/authStore";

// SNS 로그인 버튼 정의 (로고는 원본 인라인 <svg> 그대로 유지)
const SNS_BUTTONS = [
  {
    id: "naver",
    label: "네이버로 시작하기",
    bg: "#03C75A",
    text: "#ffffff",
    logo: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M10.26 9.27 7.56 5.25H5.25v7.5h2.49V8.73l2.7 4.02h2.31V5.25H10.26v4.02Z" fill="white" />
      </svg>
    ),
  },
  {
    id: "kakao",
    label: "카카오로 시작하기",
    bg: "#FEE500",
    text: "#191919",
    logo: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 1.5C4.858 1.5 1.5 4.134 1.5 7.35c0 2.034 1.356 3.822 3.402 4.854l-.87 3.234a.225.225 0 0 0 .342.243L8.1 13.374a8.4 8.4 0 0 0 .9.048c4.142 0 7.5-2.634 7.5-5.85C16.5 4.134 13.142 1.5 9 1.5Z" fill="#191919" />
      </svg>
    ),
  },
];

// ── Mock 계정 데이터 + 본인확인 헬퍼 ──
const MOCK_ACCOUNTS = [
  { name: "김지수", birth: "000315", carrier: "SKT", phone: "01012345678", email: "jisu@example.com", provider: "email", joinedAt: "2026.03.15" },
  { name: "이영희", birth: "990820", carrier: "KT", phone: "01088887777", email: "younghee@naver.com", provider: "naver", joinedAt: "2026.02.10" },
];
const onlyDigits = (s) => s.replace(/\D/g, "");
function providerLabel(p) {
  if (p === "naver") return "네이버";
  if (p === "kakao") return "카카오";
  return "이메일";
}
function maskEmail(email) {
  const [id, domain] = email.split("@");
  if (!domain) return email;
  let mid;
  if (id.length <= 2) {
    mid = id[0] + "*";
  } else {
    mid = id.slice(0, 2) + "*".repeat(Math.max(1, id.length - 2));
  }
  const [host, ...rest] = domain.split(".");
  let mhost;
  if (host.length <= 1) {
    mhost = host;
  } else {
    mhost = host[0] + "*".repeat(Math.max(1, host.length - 1));
  }
  return `${mid}@${mhost}.${rest.join(".")}`;
}
// 본인확인(이름+휴대폰) 조회. 데모 편의상 매칭 없으면 첫 계정 반환.
function findAccountByIdentity(name, phone) {
  return MOCK_ACCOUNTS.find((a) => a.name === name.trim() && a.phone === onlyDigits(phone)) ?? MOCK_ACCOUNTS[0];
}
// 이메일로 가입경로 확인. 없으면 email 가입으로 간주(재설정 진행).
function findAccountByEmail(email) {
  const e = email.trim().toLowerCase();
  return MOCK_ACCOUNTS.find((a) => a.email === e) ?? { ...MOCK_ACCOUNTS[0], email: email.trim(), provider: "email" };
}
// TODO(실연동): 실제 PASS는 본인확인기관(NICE/KCB) 연동 필요. 프로토타입은 위 mock으로 화면만.

// 공유 입력 스타일 — 원본 focus:ring-2 ring-indigo-200/primary 재현
const inputSx = {
  width: "100%",
  px: 2,
  py: 1.25,
  borderRadius: "12px",
  bgcolor: "#F8F9FF",
  border: "1px solid",
  borderColor: "divider",
  color: "text.primary",
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
  "&::placeholder": { color: "text.secondary" },
  "&:focus": {
    borderColor: "primary.main",
    boxShadow: "0 0 0 2px rgba(108,99,255,0.2)",
  },
};

function FaceIDPanel({ onSuccess }) {
  const [phase, setPhase] = useState("idle");
  const start = () => {
    setPhase("scanning");
    setTimeout(() => {
      setPhase("done");
      setTimeout(onSuccess, 800);
    }, 2200);
  };
  let panelBg = "#EEF0FF";
  let panelBorder = "#6366F1";
  if (phase === "done") {
    panelBg = "#dcfce7";
    panelBorder = "#16a34a";
  }
  let caption = "카메라에 얼굴을 위치시키고 탭하세요";
  if (phase === "scanning") caption = "얼굴을 인식하는 중...";
  if (phase === "done") caption = "인증 성공! 로그인 중...";
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, py: 2 }}>
      <Box
        onClick={phase === "idle" ? start : undefined}
        sx={{
          position: "relative",
          width: 160,
          height: 160,
          borderRadius: "16px",
          overflow: "hidden",
          cursor: "pointer",
          background: panelBg,
          border: "2px solid",
          borderColor: panelBorder,
        }}
      >
        {phase === "idle" && (
          <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
            <CenterFocusStrong sx={{ fontSize: 40, color: "primary.main" }} />
            <Typography sx={{ fontSize: 12, color: "text.secondary" }}>탭하여 스캔</Typography>
          </Box>
        )}
        {phase === "scanning" && (
          <>
            <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Box sx={{ width: 80, height: 80, borderRadius: "999px", border: "2px solid", borderColor: "primary.main", opacity: 0.5, animation: "faceIdPing 1s cubic-bezier(0,0,0.2,1) infinite" }} />
            </Box>
            <Box sx={{ position: "absolute", left: 0, right: 0, height: "2px", bgcolor: "rgba(108,99,255,0.7)", top: "50%", animation: "faceScan 2s linear infinite" }} />
            <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Box sx={{ width: 64, height: 64, borderRadius: "999px", border: "2px solid", borderColor: "primary.main" }} />
            </Box>
          </>
        )}
        {phase === "done" && (
          <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
            <CheckCircle sx={{ fontSize: 40, color: "#22C55E" }} />
            <Typography sx={{ fontSize: 12, color: "#16A34A" }}>인식 완료</Typography>
          </Box>
        )}
      </Box>
      <Typography sx={{ fontSize: 14, textAlign: "center", color: "text.secondary" }}>{caption}</Typography>
      <Box
        component="style"
        dangerouslySetInnerHTML={{
          __html: "@keyframes faceScan { 0%{top:10%} 50%{top:85%} 100%{top:10%} } @keyframes faceIdPing { 75%,100%{ transform:scale(2); opacity:0 } }",
        }}
      />
    </Box>
  );
}

function useCodeVerify() {
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [verified, setVerified] = useState(false);

  function sendCode() {
    const mock = String(Math.floor(100000 + Math.random() * 900000));
    setCode(mock);
    setCodeSent(true);
    setVerifyError("");
    setCooldown(60);
    const t = setInterval(() => setCooldown((c) => {
      if (c <= 1) {
        clearInterval(t);
        return 0;
      }
      return c - 1;
    }), 1000);
    window.alert("[개발 테스트] 인증코드: " + mock);
  }

  function verify() {
    if (codeInput === code) {
      setVerified(true);
      setVerifyError("");
    } else {
      setVerifyError("인증 코드가 올바르지 않습니다.");
    }
  }

  return { codeSent, code, codeInput, setCodeInput, verifyError, cooldown, verified, sendCode, verify };
}

// PASS mock 본인인증 (이름·생년월일·통신사·휴대폰 → 인증번호). useCodeVerify 재사용.
function PassVerifyPanel({ onSuccess, onBack }) {
  const [name, setName] = useState("");
  const [birth, setBirth] = useState("");
  const [carrier, setCarrier] = useState("SKT");
  const [phone, setPhone] = useState("");
  const sms = useCodeVerify();
  const canReq = name.trim() && birth.length >= 6 && phone.length >= 10;
  let reqLabel = "인증요청";
  if (sms.cooldown > 0) {
    reqLabel = `${sms.cooldown}s`;
  } else if (sms.codeSent) {
    reqLabel = "재요청";
  }
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box sx={{ borderRadius: "12px", bgcolor: "#EEF2FF", border: "1px solid #E0E7FF", p: 1.5, display: "flex", alignItems: "center", gap: 1, fontSize: 14, color: "#6C63FF" }}>
        <VerifiedUser sx={{ fontSize: 16 }} /> 통신사 PASS 본인확인
      </Box>
      <Box component="input" placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} sx={inputSx} />
      <Box component="input" placeholder="생년월일 6자리 (YYMMDD)" maxLength={6} value={birth} onChange={(e) => setBirth(onlyDigits(e.target.value))} sx={inputSx} />
      <Box component="select" value={carrier} onChange={(e) => setCarrier(e.target.value)} sx={inputSx}>
        {["SKT", "KT", "LG U+", "알뜰폰"].map((c) => (
          <option key={c}>{c}</option>
        ))}
      </Box>
      <Box sx={{ display: "flex", gap: 1 }}>
        <Box component="input" placeholder="휴대폰 번호" value={phone} onChange={(e) => setPhone(onlyDigits(e.target.value))} sx={{ ...inputSx, flex: 1 }} />
        <Box
          component="button"
          type="button"
          disabled={!canReq || sms.cooldown > 0}
          onClick={() => sms.sendCode()}
          sx={{
            flexShrink: 0,
            px: 1.5,
            py: 1.25,
            borderRadius: "12px",
            fontSize: 14,
            fontWeight: 500,
            color: "#fff",
            bgcolor: "#6C63FF",
            border: "none",
            cursor: "pointer",
            "&:disabled": { opacity: 0.4, cursor: "default" },
          }}
        >
          {reqLabel}
        </Box>
      </Box>
      {sms.codeSent && (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Box component="input" placeholder="인증번호 6자리" maxLength={6} value={sms.codeInput} onChange={(e) => sms.setCodeInput(onlyDigits(e.target.value))} sx={{ ...inputSx, flex: 1 }} />
          <Box
            component="button"
            type="button"
            onClick={() => {
              sms.verify();
              if (sms.codeInput === sms.code) onSuccess(findAccountByIdentity(name, phone));
            }}
            sx={{
              flexShrink: 0,
              px: 1.5,
              py: 1.25,
              borderRadius: "12px",
              fontSize: 14,
              fontWeight: 500,
              border: "2px solid #6C63FF",
              color: "#6C63FF",
              bgcolor: "transparent",
              cursor: "pointer",
            }}
          >
            확인
          </Box>
        </Box>
      )}
      {sms.verifyError && (
        <Typography sx={{ fontSize: 12, color: "#EF4444", display: "flex", alignItems: "center", gap: 0.5 }}>
          <Close sx={{ fontSize: 12 }} />
          {sms.verifyError}
        </Typography>
      )}
      <Box
        component="button"
        type="button"
        onClick={onBack}
        sx={{ display: "flex", alignItems: "center", gap: 0.75, fontSize: 14, color: "text.secondary", justifyContent: "center", bgcolor: "transparent", border: "none", cursor: "pointer", "&:hover": { color: "text.primary" } }}
      >
        <ArrowBack sx={{ fontSize: 16 }} /> 이전
      </Box>
    </Box>
  );
}

export default function AuthPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [mode, setMode] = useState("login");
  const [showPw, setShowPw] = useState(false);
  const [saveId, setSaveId] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // 아이디(이메일) 찾기 state
  const [findIdStep, setFindIdStep] = useState("verify");
  const [foundAccount, setFoundAccount] = useState(null);

  // 비밀번호 찾기 state
  const [resetStep, setResetStep] = useState("input");
  const [resetEmail, setResetEmail] = useState("");
  const [resetMethod, setResetMethod] = useState(null);
  const [resetAccount, setResetAccount] = useState(null);
  const [newPw, setNewPw] = useState("");
  const [newPwConfirm, setNewPwConfirm] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwError, setPwError] = useState("");
  const resetVerify = useCodeVerify();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      if (data.success) {
        setAuth(data.data.accessToken, { memberId: data.data.memberId, email: data.data.email, nickname: data.data.nickname });
        navigate("/");
      } else {
        setErr(data.message || "로그인 실패");
      }
    } catch (e2) {
      setErr(e2.response?.data?.message || "서버 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 데모 편의: 실제 JWT 아님. devready_authed 브리지 플래그로 가드 통과.
  function handleQuickLogin(role) {
    localStorage.setItem("devready_authed", "1");
    navigate(role === "admin" ? "/admin" : "/");
  }

  // SNS 소셜 로그인은 준비 중 — 안내만
  function handleSns() {
    window.alert("소셜 로그인은 준비 중입니다.");
  }

  function goBack() {
    setMode("login");
    setFindIdStep("verify");
    setFoundAccount(null);
    setResetStep("input");
    setResetEmail("");
    setResetMethod(null);
    setResetAccount(null);
    setNewPw("");
    setNewPwConfirm("");
    setPwError("");
  }

  // ── 아이디(이메일) 찾기 — PASS 본인확인 ──────────────────
  function renderFindId() {
    if (findIdStep === "verify") {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography sx={{ fontSize: 14, color: "text.secondary", textAlign: "center" }}>
            본인 명의 휴대폰으로 PASS 인증 후<br />가입하신 이메일을 확인할 수 있어요.
          </Typography>
          <PassVerifyPanel
            onBack={goBack}
            onSuccess={(acct) => {
              setFoundAccount(acct);
              setFindIdStep("result");
            }}
          />
        </Box>
      );
    }
    if (findIdStep === "result" && foundAccount) {
      const sns = SNS_BUTTONS.find((b) => b.id === foundAccount.provider);
      return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, textAlign: "center" }}>
          <Box sx={{ width: 56, height: 56, borderRadius: "16px", bgcolor: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto" }}>
            <VerifiedUser sx={{ fontSize: 28, color: "#6C63FF" }} />
          </Box>
          <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
            본인확인이 완료되었습니다.<br />가입하신 이메일은 다음과 같습니다.
          </Typography>
          <Box sx={{ bgcolor: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: "12px", py: 2, px: 3 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 18, color: "#111827" }}>{maskEmail(foundAccount.email)}</Typography>
            <Typography sx={{ fontSize: 12, color: "#9CA3AF", mt: 0.5 }}>
              가입경로: {providerLabel(foundAccount.provider)} · 가입일: {foundAccount.joinedAt}
            </Typography>
          </Box>
          {foundAccount.provider !== "email" && (
            <Box sx={{ borderRadius: "12px", bgcolor: "#FFFBEB", border: "1px solid #FDE68A", p: 1.5, fontSize: 12, color: "#B45309" }}>
              {providerLabel(foundAccount.provider)}(으)로 가입된 계정입니다. 소셜 로그인을 이용하세요.
            </Box>
          )}
          {foundAccount.provider !== "email" && sns && (
            <Box
              component="button"
              type="button"
              onClick={handleSns}
              sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.25, py: 1.25, borderRadius: "12px", fontSize: 14, fontWeight: 500, background: sns.bg, color: sns.text, border: "none", cursor: "pointer" }}
            >
              {sns.logo}
              {sns.label}
            </Box>
          )}
          <Box
            component="button"
            type="button"
            onClick={goBack}
            sx={{ width: "100%", py: 1.5, borderRadius: "12px", color: "#fff", fontWeight: 600, bgcolor: "#6C63FF", border: "none", cursor: "pointer", "&:hover": { opacity: 0.9 } }}
          >
            로그인하기
          </Box>
          {foundAccount.provider === "email" && (
            <Box
              component="button"
              type="button"
              onClick={() => {
                setMode("resetPw");
                setResetStep("input");
                setResetMethod(null);
              }}
              sx={{ fontSize: 14, color: "#6B7280", bgcolor: "transparent", border: "none", cursor: "pointer", "&:hover": { color: "#1F2937" } }}
            >
              비밀번호 찾기
            </Box>
          )}
        </Box>
      );
    }
    return null;
  }

  // ── 비밀번호 찾기 (이메일 → SNS분기 → PASS/이메일 → 재설정) ──
  function renderResetPw() {
    if (resetStep === "input") {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography sx={{ fontSize: 14, color: "text.secondary", textAlign: "center" }}>가입한 이메일(아이디)을 입력하세요.</Typography>
          <Box component="input" type="email" placeholder="가입한 이메일" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} sx={inputSx} />
          <Box
            component="button"
            type="button"
            disabled={!resetEmail.trim()}
            onClick={() => {
              if (!resetEmail.trim()) return;
              const acct = findAccountByEmail(resetEmail);
              setResetAccount(acct);
              if (acct.provider !== "email") {
                setResetStep("sns");
              } else {
                setResetStep("method");
                setResetMethod(null);
              }
            }}
            sx={{ width: "100%", py: 1.5, borderRadius: "12px", color: "#fff", fontWeight: 600, bgcolor: "#6C63FF", border: "none", cursor: "pointer", "&:hover": { opacity: 0.9 }, "&:disabled": { opacity: 0.4, cursor: "default" } }}
          >
            다음
          </Box>
          <Box
            component="button"
            type="button"
            onClick={goBack}
            sx={{ display: "flex", alignItems: "center", gap: 0.75, fontSize: 14, color: "text.secondary", justifyContent: "center", bgcolor: "transparent", border: "none", cursor: "pointer", "&:hover": { color: "text.primary" } }}
          >
            <ArrowBack sx={{ fontSize: 16 }} /> 로그인으로
          </Box>
        </Box>
      );
    }
    if (resetStep === "sns" && resetAccount) {
      const sns = SNS_BUTTONS.find((b) => b.id === resetAccount.provider);
      return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, textAlign: "center" }}>
          <Box sx={{ borderRadius: "12px", bgcolor: "#FFFBEB", border: "1px solid #FDE68A", p: 1.5, fontSize: 14, color: "#B45309" }}>
            이 계정은 {providerLabel(resetAccount.provider)}(으)로 가입되어 있어 비밀번호가 없습니다.<br />
            {providerLabel(resetAccount.provider)} 로그인을 이용하세요.
          </Box>
          {sns && (
            <Box
              component="button"
              type="button"
              onClick={handleSns}
              sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.25, py: 1.25, borderRadius: "12px", fontSize: 14, fontWeight: 500, background: sns.bg, color: sns.text, border: "none", cursor: "pointer" }}
            >
              {sns.logo}
              {sns.label}
            </Box>
          )}
          <Box
            component="button"
            type="button"
            onClick={() => setResetStep("input")}
            sx={{ fontSize: 14, color: "#6B7280", bgcolor: "transparent", border: "none", cursor: "pointer", "&:hover": { color: "#1F2937" } }}
          >
            다른 이메일로 다시 찾기
          </Box>
        </Box>
      );
    }
    if (resetStep === "method") {
      let methodReqLabel = "발송";
      if (resetVerify.cooldown > 0) {
        methodReqLabel = `${resetVerify.cooldown}s`;
      } else if (resetVerify.codeSent) {
        methodReqLabel = "재발송";
      }
      return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ borderRadius: "12px", bgcolor: "#F9FAFB", border: "1px solid #E5E7EB", px: 2, py: 1.25, fontSize: 14, color: "#4B5563" }}>{resetEmail}</Box>
          {resetMethod === null && (
            <>
              <Typography sx={{ fontSize: 14, color: "text.secondary", textAlign: "center" }}>본인확인 방법을 선택하세요.</Typography>
              <Box
                component="button"
                type="button"
                onClick={() => setResetMethod("pass")}
                sx={{ width: "100%", py: 1.5, borderRadius: "12px", color: "#fff", fontWeight: 600, bgcolor: "#6C63FF", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 1, "&:hover": { opacity: 0.9 } }}
              >
                <VerifiedUser sx={{ fontSize: 16 }} />
                PASS 본인인증
              </Box>
              <Box
                component="button"
                type="button"
                onClick={() => setResetMethod("email")}
                sx={{ width: "100%", py: 1.5, borderRadius: "12px", border: "2px solid #6C63FF", color: "#6C63FF", fontWeight: 600, bgcolor: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 1, "&:hover": { bgcolor: "#F9FAFB" } }}
              >
                <Email sx={{ fontSize: 16 }} />
                이메일로 인증
              </Box>
              <Box
                component="button"
                type="button"
                onClick={goBack}
                sx={{ display: "flex", alignItems: "center", gap: 0.75, fontSize: 14, color: "text.secondary", justifyContent: "center", bgcolor: "transparent", border: "none", cursor: "pointer", "&:hover": { color: "text.primary" } }}
              >
                <ArrowBack sx={{ fontSize: 16 }} /> 로그인으로
              </Box>
            </>
          )}
          {resetMethod === "pass" && <PassVerifyPanel onBack={() => setResetMethod(null)} onSuccess={() => setResetStep("newpw")} />}
          {resetMethod === "email" && (
            <>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Box component="input" type="email" value={resetEmail} readOnly sx={{ ...inputSx, flex: 1, opacity: 0.7 }} />
                <Box
                  component="button"
                  type="button"
                  onClick={() => resetVerify.sendCode()}
                  disabled={resetVerify.cooldown > 0}
                  sx={{ flexShrink: 0, px: 1.5, py: 1.25, borderRadius: "12px", fontSize: 14, fontWeight: 500, color: "#fff", bgcolor: "#6C63FF", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 0.5, "&:disabled": { opacity: 0.4, cursor: "default" } }}
                >
                  {resetVerify.cooldown > 0 && <Refresh sx={{ fontSize: 14 }} />}
                  {methodReqLabel}
                </Box>
              </Box>
              {resetVerify.codeSent && (
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Box
                    component="input"
                    type="text"
                    placeholder="인증 코드 6자리"
                    maxLength={6}
                    value={resetVerify.codeInput}
                    onChange={(e) => resetVerify.setCodeInput(e.target.value.replace(/\D/g, ""))}
                    sx={{ ...inputSx, flex: 1, ...(resetVerify.verifyError && { borderColor: "#F87171" }) }}
                  />
                  <Box
                    component="button"
                    type="button"
                    onClick={() => {
                      resetVerify.verify();
                      if (resetVerify.codeInput === resetVerify.code) setResetStep("newpw");
                    }}
                    sx={{ flexShrink: 0, px: 1.5, py: 1.25, borderRadius: "12px", fontSize: 14, fontWeight: 500, border: "2px solid #6C63FF", color: "#6C63FF", bgcolor: "transparent", cursor: "pointer", "&:hover": { bgcolor: "#F9FAFB" } }}
                  >
                    확인
                  </Box>
                </Box>
              )}
              {resetVerify.verifyError && (
                <Typography sx={{ fontSize: 12, color: "#EF4444", display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Close sx={{ fontSize: 12 }} />
                  {resetVerify.verifyError}
                </Typography>
              )}
              <Box
                component="button"
                type="button"
                onClick={() => setResetMethod(null)}
                sx={{ display: "flex", alignItems: "center", gap: 0.75, fontSize: 14, color: "text.secondary", justifyContent: "center", bgcolor: "transparent", border: "none", cursor: "pointer", "&:hover": { color: "text.primary" } }}
              >
                <ArrowBack sx={{ fontSize: 16 }} /> 이전
              </Box>
            </>
          )}
        </Box>
      );
    }
    if (resetStep === "newpw") {
      let strengthColor = "#EF4444";
      let strengthLabel = "약함";
      if (newPw.length >= 10) {
        strengthColor = "#10B981";
        strengthLabel = "강함";
      } else if (newPw.length >= 6) {
        strengthColor = "#F59E0B";
        strengthLabel = "보통";
      }
      return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, fontSize: 14, color: "#16A34A", bgcolor: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "12px", px: 2, py: 1.5 }}>
            <CheckCircle sx={{ fontSize: 16, flexShrink: 0 }} />
            본인확인 완료. 새 비밀번호를 설정해주세요.
          </Box>
          <Box sx={{ position: "relative" }}>
            <Box component="input" type={showNewPw ? "text" : "password"} placeholder="새 비밀번호 (8자 이상)" value={newPw} onChange={(e) => setNewPw(e.target.value)} sx={{ ...inputSx, pr: 5 }} />
            <Box
              component="button"
              type="button"
              onClick={() => setShowNewPw(!showNewPw)}
              sx={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "text.secondary", bgcolor: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}
            >
              {showNewPw ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
            </Box>
          </Box>
          <Box component="input" type="password" placeholder="새 비밀번호 확인" value={newPwConfirm} onChange={(e) => setNewPwConfirm(e.target.value)} sx={{ ...inputSx, ...(pwError && { borderColor: "#F87171" }) }} />
          {pwError && (
            <Typography sx={{ fontSize: 12, color: "#EF4444", display: "flex", alignItems: "center", gap: 0.5 }}>
              <Close sx={{ fontSize: 12 }} />
              {pwError}
            </Typography>
          )}
          {/* 비밀번호 강도 표시 */}
          {newPw && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Box sx={{ display: "flex", gap: 0.5 }}>
                {[1, 2, 3, 4].map((i) => (
                  <Box key={i} sx={{ flex: 1, height: "4px", borderRadius: "999px", transition: "background-color .2s", bgcolor: newPw.length >= i * 3 ? strengthColor : "#E5E7EB" }} />
                ))}
              </Box>
              <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>{strengthLabel}</Typography>
            </Box>
          )}
          <Box
            component="button"
            type="button"
            onClick={() => {
              if (newPw.length < 8) {
                setPwError("비밀번호는 8자 이상이어야 합니다.");
                return;
              }
              if (newPw !== newPwConfirm) {
                setPwError("비밀번호가 일치하지 않습니다.");
                return;
              }
              setPwError("");
              setResetStep("done");
            }}
            sx={{ width: "100%", py: 1.5, borderRadius: "12px", color: "#fff", fontWeight: 600, bgcolor: "#6C63FF", border: "none", cursor: "pointer", "&:hover": { opacity: 0.9 } }}
          >
            비밀번호 변경
          </Box>
        </Box>
      );
    }
    if (resetStep === "done") {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, textAlign: "center" }}>
          <Box sx={{ width: 56, height: 56, borderRadius: "16px", bgcolor: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto" }}>
            <VpnKey sx={{ fontSize: 28, color: "#22C55E" }} />
          </Box>
          <Typography sx={{ fontWeight: 700, color: "#111827" }}>비밀번호가 변경되었습니다</Typography>
          <Typography sx={{ fontSize: 14, color: "#6B7280" }}>새 비밀번호로 로그인해주세요.</Typography>
          <Box
            component="button"
            type="button"
            onClick={goBack}
            sx={{ width: "100%", py: 1.5, borderRadius: "12px", color: "#fff", fontWeight: 600, bgcolor: "#6C63FF", border: "none", cursor: "pointer", "&:hover": { opacity: 0.9 } }}
          >
            로그인하기
          </Box>
        </Box>
      );
    }
    return null;
  }

  const modeTitle = {
    login: "로그인",
    findId: "아이디 찾기",
    resetPw: "비밀번호 찾기",
    face: "Face ID 로그인",
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", px: 2, py: 6, background: "linear-gradient(135deg, #F8F9FF 0%, #EEF0FF 100%)" }}>
      <Box sx={{ width: "100%", maxWidth: 448 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 4 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: "16px", bgcolor: "primary.main", display: "flex", alignItems: "center", justifyContent: "center", mb: 2, boxShadow: "0 8px 24px rgba(99,102,241,0.3)" }}>
            <Typography sx={{ color: "#fff", fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 1, fontSize: 20 }}>DR</Typography>
          </Box>
          <Typography sx={{ fontSize: 24, fontWeight: 700, color: "text.primary" }}>{modeTitle[mode]}</Typography>
        </Box>

        <Box sx={{ borderRadius: "16px", border: "1px solid", borderColor: "divider", bgcolor: "#fff", boxShadow: 1, p: 4 }}>
          {/* Face ID */}
          {mode === "face" && (
            <>
              <Box
                component="button"
                type="button"
                onClick={goBack}
                sx={{ display: "flex", alignItems: "center", gap: 0.75, fontSize: 14, color: "text.secondary", mb: 2, bgcolor: "transparent", border: "none", cursor: "pointer", "&:hover": { color: "text.primary" } }}
              >
                <ArrowBack sx={{ fontSize: 16 }} /> 로그인으로
              </Box>
              <FaceIDPanel
                onSuccess={() => {
                  window.alert("Face ID는 준비 중입니다.");
                  setMode("login");
                }}
              />
            </>
          )}

          {/* 아이디 찾기 */}
          {mode === "findId" && renderFindId()}

          {/* 비밀번호 재설정 */}
          {mode === "resetPw" && renderResetPw()}

          {/* 로그인 */}
          {mode === "login" && (
            <>
              <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 1.75, mb: 2.5 }}>
                {err && <Box sx={{ color: "#EF4444", fontSize: 13 }}>{err}</Box>}
                <Box
                  component="input"
                  type="email"
                  placeholder="이메일"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                  sx={inputSx}
                />
                <Box sx={{ position: "relative" }}>
                  <Box
                    component="input"
                    type={showPw ? "text" : "password"}
                    placeholder="비밀번호"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    required
                    sx={{ ...inputSx, pr: 5 }}
                  />
                  <Box
                    component="button"
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    sx={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "text.secondary", bgcolor: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}
                  >
                    {showPw ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box component="label" sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer" }}>
                    <Box component="input" type="checkbox" checked={saveId} onChange={(e) => setSaveId(e.target.checked)} sx={{ width: 16, height: 16, accentColor: "#6C63FF" }} />
                    <Typography sx={{ fontSize: 14, color: "text.primary" }}>로그인 유지</Typography>
                  </Box>
                  <Box component="label" sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer" }}>
                    <Box component="input" type="checkbox" checked={autoLogin} onChange={(e) => setAutoLogin(e.target.checked)} sx={{ width: 16, height: 16, accentColor: "#6C63FF" }} />
                    <Typography sx={{ fontSize: 14, color: "text.primary" }}>아이디 저장</Typography>
                  </Box>
                </Box>
                <Box
                  component="button"
                  type="submit"
                  disabled={loading}
                  sx={{ width: "100%", py: 1.5, borderRadius: "12px", bgcolor: "primary.main", color: "#fff", mt: 0.5, fontWeight: 500, border: "none", cursor: "pointer", transition: "background-color .15s", "&:hover": { bgcolor: "#4F46E5" }, "&:disabled": { opacity: 0.6, cursor: "default" } }}
                >
                  {loading ? "처리 중..." : "로그인"}
                </Box>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5, fontSize: 14, mb: 2.5 }}>
                <Box
                  component="button"
                  type="button"
                  onClick={() => {
                    setMode("findId");
                    setFindIdStep("verify");
                    setFoundAccount(null);
                  }}
                  sx={{ color: "text.secondary", bgcolor: "transparent", border: "none", cursor: "pointer", "&:hover": { color: "text.primary" } }}
                >
                  아이디 찾기
                </Box>
                <Box component="span" sx={{ color: "divider" }}>|</Box>
                <Box
                  component="button"
                  type="button"
                  onClick={() => {
                    setMode("resetPw");
                    setResetStep("input");
                    setResetMethod(null);
                  }}
                  sx={{ color: "text.secondary", bgcolor: "transparent", border: "none", cursor: "pointer", "&:hover": { color: "text.primary" } }}
                >
                  비밀번호 찾기
                </Box>
                <Box component="span" sx={{ color: "divider" }}>|</Box>
                <Box
                  component="button"
                  type="button"
                  onClick={() => navigate("/signup")}
                  sx={{ color: "primary.main", fontWeight: 500, bgcolor: "transparent", border: "none", cursor: "pointer", "&:hover": { color: "#4F46E5" } }}
                >
                  회원가입
                </Box>
              </Box>

              <Typography sx={{ textAlign: "center", fontSize: 14, color: "text.secondary", mb: 2 }}>소셜 계정으로 간편 로그인</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, mb: 2.5 }}>
                {SNS_BUTTONS.map((s) => (
                  <Box
                    key={s.id}
                    component="button"
                    type="button"
                    onClick={handleSns}
                    sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.25, py: 1.25, borderRadius: "12px", fontSize: 14, fontWeight: 500, background: s.bg, color: s.text, border: "none", cursor: "pointer", transition: "all .15s", "&:hover": { opacity: 0.9 }, "&:active": { transform: "scale(0.98)" } }}
                  >
                    {s.logo}
                    {s.label}
                  </Box>
                ))}
              </Box>

              <Box
                component="button"
                type="button"
                onClick={() => setMode("face")}
                sx={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 1, py: 1.25, borderRadius: "12px", border: "1px solid", borderColor: "divider", bgcolor: "#F8F9FF", fontSize: 14, color: "text.primary", cursor: "pointer", transition: "background-color .15s", "&:hover": { bgcolor: "#F1F3FB" } }}
              >
                <CenterFocusStrong sx={{ fontSize: 16, color: "primary.main" }} />
                Face ID로 로그인
              </Box>
            </>
          )}
        </Box>

        {/* 회원 유형별 바로 입장 */}
        {mode === "login" && (
          <Box sx={{ mt: 3, pt: 3, borderTop: "1px solid", borderColor: "divider" }}>
            <Typography sx={{ fontSize: 12, color: "text.secondary", textAlign: "center", mb: 1.5 }}>바로 입장하기</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 1.25 }}>
              <Box
                component="button"
                type="button"
                onClick={() => handleQuickLogin("user")}
                sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.75, py: 1.5, px: 2, borderRadius: "12px", border: "1px solid", borderColor: "divider", bgcolor: "#F8F9FF", cursor: "pointer", transition: "all .15s", "&:hover": { borderColor: "rgba(108,99,255,0.5)", bgcolor: "#F1F3FB" } }}
              >
                <Person sx={{ fontSize: 20, color: "primary.main" }} />
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: "text.primary" }}>개인 회원</Typography>
              </Box>
              <Box
                component="button"
                type="button"
                onClick={() => handleQuickLogin("admin")}
                sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.75, py: 1.5, px: 2, borderRadius: "12px", border: "1px solid", borderColor: "divider", bgcolor: "#F8F9FF", cursor: "pointer", transition: "all .15s", "&:hover": { borderColor: "rgba(108,99,255,0.5)", bgcolor: "#F1F3FB" } }}
              >
                <VerifiedUser sx={{ fontSize: 20, color: "primary.main" }} />
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: "text.primary" }}>관리자</Typography>
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
