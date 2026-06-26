import { useState } from "react";
import { Box, Typography, Stack } from "@mui/material";
import { CheckCircle, CreditCard, ErrorOutlineOutlined } from "@mui/icons-material";

// ─── Data (co-located) ────────────────────────────────────────────────────────

const PLANS = [
  { id: "free", label: "무료", price: "0원", features: ["월 3회 면접", "기본 피드백", "커뮤니티 이용"] },
  { id: "basic", label: "베이직", price: "9,900원/월", features: ["월 20회 면접", "항목별 상세 피드백", "음성 분석", "PDF 리포트"] },
  { id: "pro", label: "프로", price: "19,900원/월", features: ["무제한 면접", "영상 분석(표정·시선)", "AI 이력서 자동완성", "1:1 멘토링 연결"] },
];

const PAYMENT_RECORDS = [
  { date: "2026.06.01", desc: "프로 플랜 월정액", amount: "19,900원" },
  { date: "2026.05.01", desc: "프로 플랜 월정액", amount: "19,900원" },
  { date: "2026.04.01", desc: "베이직 → 프로 업그레이드", amount: "10,000원" },
];

const mono = "'DM Mono', monospace";

/**
 * 결제 정보 탭 — test-demo-UI/MyPage.tsx 의 PaymentTab → JS+MUI.
 * 구독 플랜(현재 플랜/플랜 비교) · 결제 정보(수단/내역) · 변경/해지 모달.
 * PLANS·결제내역 mock 은 이 파일에 co-locate. props 없음(자체 상태).
 */
export default function PaymentTab() {
  const [currentPlan, setCurrentPlan] = useState("pro");
  const [changeTo, setChangeTo] = useState(null);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [changed, setChanged] = useState(null);

  const confirmChange = () => {
    if (!changeTo) return;
    setCurrentPlan(changeTo);
    const target = PLANS.find((p) => p.id === changeTo);
    setChanged(target ? target.label : "");
    setChangeTo(null);
    setTimeout(() => setChanged(null), 2500);
  };

  const confirmCancel = () => {
    setCancelled(true);
    setCurrentPlan("free");
    setShowCancel(false);
  };

  const current = PLANS.find((p) => p.id === currentPlan);
  const changeToPlan = PLANS.find((p) => p.id === changeTo);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* Subscription status */}
      <Box
        sx={{
          borderRadius: "16px",
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          p: 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2.5,
          }}
        >
          <Typography
            variant="h2"
            sx={{ fontSize: 16, fontWeight: 600, color: "text.primary" }}
          >
            구독 플랜
          </Typography>
          {changed && (
            <Box
              component="span"
              sx={{ fontSize: 12, color: "#22C55E", display: "flex", alignItems: "center", gap: 0.5 }}
            >
              <CheckCircle sx={{ fontSize: 14 }} />
              {changed} 플랜으로 변경됨
            </Box>
          )}
          {cancelled && (
            <Box component="span" sx={{ fontSize: 12, color: "#F87171" }}>
              구독이 해지되었습니다.
            </Box>
          )}
        </Box>

        {/* Current plan info */}
        {!cancelled && (
          <Box
            sx={{
              borderRadius: "12px",
              bgcolor: "rgba(108,99,255,0.05)",
              border: "1px solid",
              borderColor: "rgba(108,99,255,0.2)",
              p: 2,
              mb: 2.5,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: "text.primary" }}>
                  {current && current.label} 플랜
                </Typography>
                <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.25 }}>
                  다음 결제일:{" "}
                  <Box component="span" sx={{ color: "text.primary" }}>
                    2026.07.01
                  </Box>{" "}
                  · 잔여 21일
                </Typography>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography
                  sx={{ fontSize: 18, fontWeight: 700, color: "primary.main", fontFamily: mono }}
                >
                  {current && current.price}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
            gap: 1.5,
          }}
        >
          {PLANS.map((p) => {
            const isCurrent = p.id === currentPlan;
            return (
              <Box
                key={p.id}
                sx={{
                  borderRadius: "12px",
                  p: 2,
                  border: "2px solid",
                  transition: "all .2s",
                  ...(isCurrent
                    ? { borderColor: "primary.main", bgcolor: "rgba(108,99,255,0.05)" }
                    : { borderColor: "divider", bgcolor: "#F8F9FF" }),
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography
                    component="span"
                    sx={{ fontWeight: 600, fontSize: 14, color: "text.primary" }}
                  >
                    {p.label}
                  </Typography>
                  {isCurrent && (
                    <Box
                      component="span"
                      sx={{
                        fontSize: 12,
                        bgcolor: "primary.main",
                        color: "#fff",
                        px: 1,
                        py: 0.25,
                        borderRadius: "999px",
                      }}
                    >
                      현재
                    </Box>
                  )}
                </Box>
                <Typography
                  sx={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "text.primary",
                    mb: 1.5,
                    fontFamily: mono,
                  }}
                >
                  {p.price}
                </Typography>
                <Box
                  component="ul"
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.75,
                    mb: 1.5,
                    listStyle: "none",
                    p: 0,
                    m: 0,
                  }}
                >
                  {p.features.map((f) => (
                    <Box
                      key={f}
                      component="li"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.75,
                        fontSize: 12,
                        color: "text.secondary",
                      }}
                    >
                      <CheckCircle sx={{ fontSize: 12, color: "#22C55E", flexShrink: 0 }} />
                      {f}
                    </Box>
                  ))}
                </Box>
                {!isCurrent && !cancelled && (
                  <Box
                    component="button"
                    type="button"
                    onClick={() => setChangeTo(p.id)}
                    sx={{
                      width: "100%",
                      py: 1,
                      borderRadius: "8px",
                      bgcolor: "primary.main",
                      color: "#fff",
                      fontSize: 12,
                      border: "none",
                      font: "inherit",
                      cursor: "pointer",
                      transition: "background-color .2s",
                      "&:hover": { bgcolor: "primary.dark" },
                    }}
                  >
                    {PLANS.findIndex((x) => x.id === p.id) >
                    PLANS.findIndex((x) => x.id === currentPlan)
                      ? "업그레이드"
                      : "다운그레이드"}
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Payment info */}
      <Box
        sx={{
          borderRadius: "16px",
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          p: 3,
        }}
      >
        <Typography
          variant="h2"
          sx={{ fontSize: 16, fontWeight: 600, color: "text.primary", mb: 2 }}
        >
          결제 정보
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 1.5,
            borderRadius: "12px",
            bgcolor: "#F8F9FF",
            border: "1px solid",
            borderColor: "divider",
            mb: 2,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <CreditCard sx={{ fontSize: 20, color: "primary.main" }} />
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: "text.primary" }}>
                신한카드 **** 1234
              </Typography>
              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                다음 결제: 2026.07.01
              </Typography>
            </Box>
          </Stack>
          <Box
            component="button"
            type="button"
            sx={{
              fontSize: 12,
              color: "primary.main",
              bgcolor: "transparent",
              border: "none",
              font: "inherit",
              cursor: "pointer",
              "&:hover": { color: "primary.dark" },
            }}
          >
            변경
          </Box>
        </Box>

        <Box sx={{ borderTop: "1px solid", borderColor: "divider", pt: 2 }}>
          <Typography
            variant="h3"
            sx={{ fontSize: 14, fontWeight: 500, color: "text.primary", mb: 1.5 }}
          >
            결제 내역
          </Typography>
          {PAYMENT_RECORDS.map((r, i) => (
            <Box
              key={i}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                py: 1.25,
                fontSize: 14,
                borderBottom: "1px solid",
                borderColor: "divider",
                "&:last-of-type": { borderBottom: "none" },
              }}
            >
              <Box>
                <Typography sx={{ fontSize: 14, color: "text.primary" }}>{r.desc}</Typography>
                <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{r.date}</Typography>
              </Box>
              <Box
                component="span"
                sx={{ color: "text.primary", fontWeight: 500, fontFamily: mono }}
              >
                {r.amount}
              </Box>
            </Box>
          ))}
        </Box>

        {!cancelled && (
          <Box
            component="button"
            type="button"
            onClick={() => setShowCancel(true)}
            sx={{
              mt: 2,
              fontSize: 14,
              color: "#F87171",
              bgcolor: "transparent",
              border: "none",
              font: "inherit",
              cursor: "pointer",
              p: 0,
              transition: "color .2s",
              "&:hover": { color: "#DC2626" },
            }}
          >
            구독 해지
          </Box>
        )}
      </Box>

      {/* Change plan confirm modal */}
      {changeTo && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            bgcolor: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            p: 2,
          }}
        >
          <Box
            sx={{
              borderRadius: "16px",
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              p: 3,
              width: "100%",
              maxWidth: 384,
            }}
          >
            <Typography
              variant="h3"
              sx={{ fontSize: 16, fontWeight: 600, color: "text.primary", mb: 1.5 }}
            >
              플랜 변경
            </Typography>
            <Typography sx={{ fontSize: 14, color: "text.secondary", mb: 2.5 }}>
              <Box component="b" sx={{ color: "text.primary", fontWeight: 700 }}>
                {current && current.label}
              </Box>{" "}
              →{" "}
              <Box component="b" sx={{ color: "primary.main", fontWeight: 700 }}>
                {changeToPlan && changeToPlan.label}
              </Box>{" "}
              플랜으로 변경하시겠습니까?
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Box
                component="button"
                type="button"
                onClick={() => setChangeTo(null)}
                sx={{
                  flex: 1,
                  py: 1.25,
                  borderRadius: "12px",
                  border: "1px solid",
                  borderColor: "divider",
                  fontSize: 14,
                  bgcolor: "transparent",
                  color: "text.primary",
                  font: "inherit",
                  cursor: "pointer",
                }}
              >
                취소
              </Box>
              <Box
                component="button"
                type="button"
                onClick={confirmChange}
                sx={{
                  flex: 1,
                  py: 1.25,
                  borderRadius: "12px",
                  bgcolor: "primary.main",
                  color: "#fff",
                  fontSize: 14,
                  border: "none",
                  font: "inherit",
                  cursor: "pointer",
                  transition: "background-color .2s",
                  "&:hover": { bgcolor: "primary.dark" },
                }}
              >
                변경 확인
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {/* Cancel confirm modal */}
      {showCancel && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            bgcolor: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            p: 2,
          }}
        >
          <Box
            sx={{
              borderRadius: "16px",
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              p: 3,
              width: "100%",
              maxWidth: 384,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <ErrorOutlineOutlined sx={{ fontSize: 20, color: "#F87171" }} />
              <Typography
                variant="h3"
                sx={{ fontSize: 16, fontWeight: 600, color: "text.primary" }}
              >
                구독 해지
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 14, color: "text.secondary", mb: 1 }}>
              구독을 해지하면 다음 결제일(2026.07.01) 이후 무료 플랜으로 전환됩니다.
            </Typography>
            <Typography sx={{ fontSize: 12, color: "#F87171", mb: 2.5 }}>
              무제한 면접, 영상 분석 등 프리미엄 기능이 종료됩니다.
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Box
                component="button"
                type="button"
                onClick={() => setShowCancel(false)}
                sx={{
                  flex: 1,
                  py: 1.25,
                  borderRadius: "12px",
                  border: "1px solid",
                  borderColor: "divider",
                  fontSize: 14,
                  bgcolor: "transparent",
                  color: "text.primary",
                  font: "inherit",
                  cursor: "pointer",
                }}
              >
                유지하기
              </Box>
              <Box
                component="button"
                type="button"
                onClick={confirmCancel}
                sx={{
                  flex: 1,
                  py: 1.25,
                  borderRadius: "12px",
                  bgcolor: "#EF4444",
                  color: "#fff",
                  fontSize: 14,
                  border: "none",
                  font: "inherit",
                  cursor: "pointer",
                  transition: "background-color .2s",
                  "&:hover": { bgcolor: "#DC2626" },
                }}
              >
                해지 확인
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
