import { useState, useRef } from "react";
import { Box, Typography, Stack } from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  CheckCircle,
  PhotoCamera,
} from "@mui/icons-material";
import useAuthStore from "../../store/authStore";

// 입력(raw input) 공통 스타일 — rounded-xl bg-secondary border focus:border-primary/60
const inputSx = {
  width: "100%",
  px: 2,
  py: 1.25,
  borderRadius: "12px",
  bgcolor: "#F8F9FF",
  border: "1px solid",
  borderColor: "divider",
  fontSize: 14,
  color: "text.primary",
  font: "inherit",
  boxSizing: "border-box",
  "&:focus": { outline: "none", borderColor: "rgba(108,99,255,0.6)" },
  "&::placeholder": { color: "text.secondary" },
};

/**
 * 마이페이지 - 기본 정보 탭 (원본 MyPage.tsx ProfileTab).
 * 프로필 사진(PhotoCamera) 변경, 이름/이메일/연락처 조회·수정,
 * 현재 비밀번호 검증 후 수정, 새 비밀번호 변경(Visibility 토글).
 */
export default function ProfileTab() {
  // 실제 로그인 사용자 연동(authStore.user). nickname/email 은 실제 값, 미로그인 시 mock fallback.
  // phone 은 백엔드가 "000-0000-..." 자동생성이라 표시 부적합 → mock 값 유지.
  const user = useAuthStore((s) => s.user);
  const [showPw, setShowPw] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [verifyPw, setVerifyPw] = useState("");
  const [verified, setVerified] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [profile, setProfile] = useState({
    nickname: user?.nickname ?? "김지수",
    email: user?.email ?? "jisu@example.com",
    phone: "010-1234-5678",
    newPw: "",
    confirmPw: "",
  });
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarUrl(url);
  };

  const saveProfile = (e) => {
    e.preventDefault();
    setSaved(true);
    setEditMode(false);
    setVerified(false);
    setVerifyPw("");
    setTimeout(() => setSaved(false), 2500);
  };

  const handleVerify = () => {
    if (verifyPw.length >= 6) setVerified(true);
  };

  const pwMismatch =
    profile.newPw && profile.confirmPw && profile.newPw !== profile.confirmPw;

  return (
    <Box
      sx={{
        borderRadius: "16px",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        p: 3,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Typography sx={{ fontWeight: 600, color: "text.primary" }}>
          회원정보 수정
        </Typography>
        {saved && (
          <Box
            component="span"
            sx={{
              fontSize: 12,
              color: "#22C55E",
              display: "flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <CheckCircle sx={{ fontSize: 14 }} />
            저장되었습니다
          </Box>
        )}
        {!editMode && (
          <Box
            component="button"
            type="button"
            onClick={() => setEditMode(true)}
            sx={{
              fontSize: 14,
              color: "primary.main",
              bgcolor: "transparent",
              border: "none",
              p: 0,
              font: "inherit",
              cursor: "pointer",
              transition: "color .2s",
              "&:hover": { color: "primary.dark" },
            }}
          >
            수정
          </Box>
        )}
      </Box>

      {/* Avatar */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Box sx={{ position: "relative" }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "16px",
              bgcolor: "rgba(108,99,255,0.15)",
              border: "2px solid rgba(108,99,255,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {avatarUrl ? (
              <Box
                component="img"
                src={avatarUrl}
                alt="프로필"
                sx={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <Typography
                component="span"
                sx={{ fontSize: 24, color: "primary.main", fontWeight: 700 }}
              >
                {profile.nickname[0]}
              </Typography>
            )}
          </Box>
          {editMode && (
            <Box
              component="button"
              type="button"
              onClick={() => fileRef.current?.click()}
              sx={{
                position: "absolute",
                bottom: -6,
                right: -6,
                width: 24,
                height: 24,
                borderRadius: "999px",
                bgcolor: "primary.main",
                color: "#fff",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: 3,
                cursor: "pointer",
                transition: "background-color .2s",
                "&:hover": { bgcolor: "primary.dark" },
              }}
            >
              <PhotoCamera sx={{ fontSize: 12 }} />
            </Box>
          )}
          <Box
            component="input"
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            sx={{ display: "none" }}
          />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 600, color: "text.primary" }}>
            {profile.nickname}
          </Typography>
          <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
            {profile.email}
          </Typography>
          <Typography sx={{ fontSize: 12, color: "primary.main", mt: 0.25 }}>
            프로 플랜 구독 중
          </Typography>
        </Box>
      </Box>

      {/* 조회 모드 */}
      {!editMode && (
        <Stack spacing={2}>
          {[
            ["닉네임", profile.nickname],
            ["이메일", profile.email],
            ["연락처", profile.phone],
          ].map(([label, value]) => (
            <Box key={label}>
              <Typography
                sx={{ fontSize: 12, color: "text.secondary", mb: 0.5 }}
              >
                {label}
              </Typography>
              <Typography sx={{ fontSize: 14, color: "text.primary" }}>
                {value}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}

      {/* 비밀번호 검증 모드 */}
      {editMode && !verified && (
        <Box>
          <Typography
            sx={{ fontSize: 14, color: "text.secondary", mb: 2 }}
          >
            정보 수정을 위해 현재 비밀번호를 입력해주세요.
          </Typography>
          <Box sx={{ position: "relative", mb: 2 }}>
            <Box
              component="input"
              type={showPw ? "text" : "password"}
              placeholder="현재 비밀번호"
              value={verifyPw}
              onChange={(e) => setVerifyPw(e.target.value)}
              sx={{ ...inputSx, pr: 5 }}
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
                color: "text.secondary",
                bgcolor: "transparent",
                border: "none",
                p: 0,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              {showPw ? (
                <VisibilityOff sx={{ fontSize: 16 }} />
              ) : (
                <Visibility sx={{ fontSize: 16 }} />
              )}
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Box
              component="button"
              type="button"
              onClick={() => setEditMode(false)}
              sx={{
                flex: 1,
                py: 1.25,
                borderRadius: "12px",
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "transparent",
                fontSize: 14,
                color: "text.primary",
                font: "inherit",
                cursor: "pointer",
                transition: "background-color .2s",
                "&:hover": { bgcolor: "#F8F9FF" },
              }}
            >
              취소
            </Box>
            <Box
              component="button"
              type="button"
              onClick={handleVerify}
              sx={{
                flex: 1,
                py: 1.25,
                borderRadius: "12px",
                bgcolor: "primary.main",
                color: "#fff",
                border: "none",
                fontSize: 14,
                font: "inherit",
                cursor: "pointer",
                transition: "background-color .2s",
                "&:hover": { bgcolor: "primary.dark" },
              }}
            >
              확인
            </Box>
          </Box>
        </Box>
      )}

      {/* 수정 폼 */}
      {editMode && verified && (
        <Box
          component="form"
          onSubmit={saveProfile}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          {[
            ["nickname", "닉네임", "text"],
            ["email", "이메일", "email"],
            ["phone", "연락처", "tel"],
          ].map(([key, label, type]) => (
            <Box key={key}>
              <Typography
                component="label"
                sx={{
                  fontSize: 12,
                  color: "text.secondary",
                  display: "block",
                  mb: 0.5,
                }}
              >
                {label}
              </Typography>
              <Box
                component="input"
                type={type}
                value={profile[key]}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, [key]: e.target.value }))
                }
                sx={inputSx}
              />
            </Box>
          ))}

          <Box sx={{ borderTop: "1px solid", borderColor: "divider", pt: 2 }}>
            <Typography
              sx={{ fontSize: 14, fontWeight: 500, color: "text.primary", mb: 1.5 }}
            >
              비밀번호 변경{" "}
              <Box
                component="span"
                sx={{ color: "text.secondary", fontSize: 12 }}
              >
                (선택)
              </Box>
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box
                component="input"
                type="password"
                placeholder="새 비밀번호 (6자 이상)"
                value={profile.newPw}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, newPw: e.target.value }))
                }
                sx={inputSx}
              />
              <Box
                component="input"
                type="password"
                placeholder="새 비밀번호 확인"
                value={profile.confirmPw}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, confirmPw: e.target.value }))
                }
                sx={inputSx}
              />
              {pwMismatch && (
                <Typography sx={{ fontSize: 12, color: "#F87171" }}>
                  비밀번호가 일치하지 않습니다.
                </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
            <Box
              component="button"
              type="button"
              onClick={() => {
                setEditMode(false);
                setVerified(false);
              }}
              sx={{
                flex: 1,
                py: 1.25,
                borderRadius: "12px",
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "transparent",
                fontSize: 14,
                color: "text.primary",
                font: "inherit",
                cursor: "pointer",
              }}
            >
              취소
            </Box>
            <Box
              component="button"
              type="submit"
              disabled={Boolean(pwMismatch)}
              sx={{
                flex: 1,
                py: 1.25,
                borderRadius: "12px",
                bgcolor: "primary.main",
                color: "#fff",
                border: "none",
                fontSize: 14,
                font: "inherit",
                cursor: "pointer",
                transition: "background-color .2s",
                "&:hover": { bgcolor: "primary.dark" },
                "&:disabled": { opacity: 0.4, cursor: "default" },
              }}
            >
              저장
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
