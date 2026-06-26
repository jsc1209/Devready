import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Typography, CircularProgress } from "@mui/material";
import {
  AutoAwesome,
  Mic,
  AccessTime,
  Videocam,
  VideocamOff,
  Close,
  ErrorOutlineOutlined,
  Send,
  ChevronRight,
  Stop,
  Visibility,
  SentimentSatisfiedAlt,
  Bolt,
  MonitorHeart,
} from "@mui/icons-material";
import { Q_BANK, PERSONALITY_QUESTIONS } from "../data/interviewSessionMock";
import { evaluateAnswer, mapScores } from "../api/interviewApi";

// Mock followup generation based on answer
function generateFollowup(question, answer) {
  if (answer.length < 30) return "답변을 좀 더 구체적으로 설명해주실 수 있나요?";
  if (question.includes("Virtual DOM")) return "그렇다면 Virtual DOM이 항상 성능상 이점을 가져다 준다고 할 수 있을까요?";
  if (question.includes("클로저")) return "클로저를 사용할 때 메모리 누수가 발생할 수 있는 상황을 설명해주실 수 있나요?";
  if (question.includes("인덱스")) return "복합 인덱스 설계 시 컬럼 순서가 왜 중요한가요?";
  if (question.includes("Docker")) return "Docker 컨테이너와 이미지의 차이를 설명해주세요.";
  if (question.includes("강점")) return "그 강점을 실제로 발휘한 구체적인 사례를 들어주실 수 있나요?";
  if (question.includes("충돌") || question.includes("갈등")) return "그 경험에서 배운 점을 현재 협업 방식에 어떻게 적용하고 계신가요?";
  const followups = [
    "방금 말씀하신 내용에서, 구체적인 수치나 성과가 있다면 공유해주실 수 있나요?",
    "그 방법을 선택하신 이유가 무엇인가요?",
    "반대 의견이나 다른 접근 방식도 고려해보셨나요?",
    "그 경험에서 아쉬웠던 점이나 개선하고 싶은 부분이 있으신가요?",
    "만약 지금 다시 한다면 어떻게 다르게 접근하시겠어요?",
  ];
  return followups[Math.floor(Math.random() * followups.length)];
}

// STAR analysis mock
function analyzeSTAR(answer) {
  const sitKeywords = ["상황", "당시", "그때", "환경", "배경", "context"];
  const taskKeywords = ["목표", "과제", "요구", "필요", "문제", "task"];
  const actionKeywords = ["했습니다", "구현", "진행", "적용", "방법", "방식", "접근"];
  const resultKeywords = ["결과", "성과", "개선", "향상", "달성", "완료", "효과"];
  const score = (kws) => Math.min(100, kws.filter((k) => answer.includes(k)).length * 30 + (answer.length > 100 ? 30 : 0));
  return { S: score(sitKeywords), T: score(taskKeywords), A: score(actionKeywords), R: score(resultKeywords) };
}

// 5-category scoring mock (question 인자는 시그니처 호환용 — 본문 미사용)
function scoreAnswer(answer, _question) {
  const len = answer.trim().length;
  const base = Math.min(85, 40 + len * 0.3);
  const techKeywords = ["구현", "설계", "코드", "알고리즘", "API", "DB", "스택", "최적화"];
  const techBonus = techKeywords.filter((k) => answer.includes(k)).length * 4;
  return {
    technical: Math.min(100, Math.round(base * 0.85 + techBonus)),
    logic: Math.min(100, Math.round(base * 0.9 + (answer.includes("왜냐하면") || answer.includes("이유") ? 10 : 0))),
    specificity: Math.min(100, Math.round(base * 0.8 + (len > 150 ? 15 : 0))),
    depth: Math.min(100, Math.round(base * 0.75 + techBonus * 0.5)),
    communication: Math.min(100, Math.round(base * 0.95)),
  };
}

const WARMUP_SECONDS = 5;
const VOICE_DB_THRESHOLD = 60; // 일반 성인 대화 수준(약 60dB) 이상이면 워밍업 즉시 종료

const mono = "'DM Mono', monospace";

export default function InterviewSession() {
  const navigate = useNavigate();
  const location = useLocation();
  const config = location.state ?? {};

  const job = config.job || "frontend";
  const level = config.level || "junior";
  const type = config.type || "tech";
  const interviewer = config.interviewer || "normal";
  const count = config.count || 5;
  const coverText = config.coverText || "";
  const videoEnabled = config.videoEnabled ?? false; // 영상 동의 여부 (기본: 음성 면접)

  // Build question list
  const questionList = (() => {
    let qs = [];
    if (type === "personality") {
      qs = [...PERSONALITY_QUESTIONS];
    } else {
      const bank = Q_BANK[job]?.[level] ?? Q_BANK["frontend"]["junior"];
      qs = [...bank];
    }
    // Inject cover-letter-based question if provided
    if (coverText.length > 50 && type !== "tech") {
      qs.splice(1, 0, "자기소개서에 작성하신 내용 중 가장 자신 있는 경험을 STAR 형식으로 설명해주세요.");
    }
    return qs.slice(0, count).map((q, i) => ({
      id: i + 1,
      main: q,
      followup: "",
      answer: "",
      followupAnswer: "",
      scores: { technical: 0, logic: 0, specificity: 0, depth: 0, communication: 0 },
      star: { S: 0, T: 0, A: 0, R: 0 },
      wpm: 0,
      silenceCount: 0,
      answerTime: 0,
    }));
  })();

  const TOTAL = questionList.length;
  const TIME_PER_Q = 120;

  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState("question");
  const [mode, setMode] = useState("text");
  const [answer, setAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q);
  const [recording, setRecording] = useState(false);
  const [wavePhase, setWavePhase] = useState(0);
  const [showExit, setShowExit] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [entries, setEntries] = useState(questionList);
  const [currentFollowup, setCurrentFollowup] = useState("");
  const [followupTarget] = useState(() => Math.min(TOTAL, 1 + Math.floor(Math.random() * 2))); // 꼬리질문 1~2개
  const [followupStep, setFollowupStep] = useState(0);
  const [sttTranscript, setSttTranscript] = useState("");
  const [sttActive, setSttActive] = useState(false);
  const [answerStartTime, setAnswerStartTime] = useState(0);
  const [warmup, setWarmup] = useState(true);
  const [warmupLeft, setWarmupLeft] = useState(WARMUP_SECONDS);
  const [micDb, setMicDb] = useState(0);
  const [scoring, setScoring] = useState(false); // AI 채점(EXAONE ~140s) 진행 중 — 로딩 오버레이 + 중복 제출 방지

  // Video/camera refs
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const waveRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioCtxRef = useRef(null);
  const micStreamRef = useRef(null);
  const rafRef = useRef(null);
  const warmupTimerRef = useRef(null);
  const warmupEndedRef = useRef(false);

  // Camera toggle
  const toggleCamera = useCallback(async () => {
    if (cameraOn) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setCameraOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setCameraOn(true);
      } catch {
        alert("카메라 접근 권한이 필요합니다.");
      }
    }
  }, [cameraOn]);

  // Timer
  useEffect(() => {
    if (phase === "answering" || phase === "followup-answering") {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            handleSubmit();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // handleSubmit 의존 추가 시 매 렌더 타이머가 리셋되므로 phase 만 의존(원본 의도 유지)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Waveform animation
  useEffect(() => {
    if (recording) {
      waveRef.current = setInterval(() => setWavePhase((p) => p + 1), 100);
    } else {
      if (waveRef.current) clearInterval(waveRef.current);
    }
    return () => {
      if (waveRef.current) clearInterval(waveRef.current);
    };
  }, [recording]);

  // Cleanup camera on unmount
  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      recognitionRef.current?.stop();
    },
    []
  );

  // ── 준비(워밍업) 5초: 음성·표정 점수 미반영, 음성이 기준 dB 이상이면 즉시 시작 ──
  const endWarmup = useCallback(() => {
    if (warmupEndedRef.current) return;
    warmupEndedRef.current = true;
    if (warmupTimerRef.current) clearInterval(warmupTimerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    setWarmup(false);
  }, []);

  useEffect(() => {
    // 5초 카운트다운
    warmupTimerRef.current = setInterval(() => {
      setWarmupLeft((s) => {
        if (s <= 1) {
          endWarmup();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    // 마이크 음량(데시벨) 감지 — 기준 이상이면 즉시 시작
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        micStreamRef.current = stream;
        const Ctx = window.AudioContext || window.webkitAudioContext;
        const ctx = new Ctx();
        audioCtxRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        ctx.createMediaStreamSource(stream).connect(analyser);
        const buf = new Uint8Array(analyser.fftSize);
        const tick = () => {
          analyser.getByteTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) {
            const v = (buf[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / buf.length);
          const db = Math.round(20 * Math.log10(Math.max(rms, 0.0001)) + 90);
          setMicDb(db);
          if (db >= VOICE_DB_THRESHOLD) {
            endWarmup();
            return;
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch {
        // 마이크 권한이 없으면 카운트다운(5초)만으로 진행
      }
    })();

    return () => {
      cancelled = true;
      if (warmupTimerRef.current) clearInterval(warmupTimerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close().catch(() => {});
    };
  }, [endWarmup]);

  const startSTT = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("이 브라우저는 음성 인식을 지원하지 않습니다.");
      return;
    }
    const rec = new SR();
    rec.lang = "ko-KR";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join("");
      setSttTranscript(transcript);
      setAnswer(transcript);
    };
    rec.onerror = () => setSttActive(false);
    rec.onend = () => setSttActive(false);
    rec.start();
    recognitionRef.current = rec;
    setSttActive(true);
  };

  const stopSTT = () => {
    recognitionRef.current?.stop();
    setSttActive(false);
  };

  const startAnswer = () => {
    setPhase("answering");
    setTimeLeft(TIME_PER_Q);
    setAnswerStartTime(Date.now());
    if (mode === "voice") {
      setRecording(true);
      startSTT();
    }
  };

  const startFollowupAnswer = () => {
    setPhase("followup-answering");
    setTimeLeft(TIME_PER_Q);
    if (mode === "voice") {
      setRecording(true);
      startSTT();
    }
  };

  const handleSubmit = async () => {
    if (scoring) return; // AI 채점 중 중복 제출 방지
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRecording(false);
    stopSTT();

    const answerText = answer; // 제출 시점 답변 고정(텍스트/음성 공통 출처)
    const elapsed = (Date.now() - answerStartTime) / 1000 / 60;
    const words = answerText.trim().split(/\s+/).length;
    const wpm = elapsed > 0 ? Math.round(words / elapsed) : 0;

    if (phase === "answering") {
      // ── 메인 질문 답변: AI 채점 실연동(Spring 게이트웨이). 실패/지연 시 mock 폴백 ──
      setScoring(true);
      let scores;
      let aiFeedback = null;
      try {
        const res = await evaluateAnswer({ question: entries[idx].main, answer: answerText, lang: "ko" });
        if (res?.success && res.data?.scores) {
          scores = mapScores(res.data); // 4축 → 5키
          aiFeedback = {
            feedback: res.data.feedback ?? "",
            strengths: res.data.strengths ?? [],
            improvements: res.data.improvements ?? [],
          };
        } else {
          throw new Error(res?.message || "AI 채점 응답 오류");
        }
      } catch {
        scores = scoreAnswer(answerText, entries[idx].main); // mock 폴백(연동 실패/미가동)
      } finally {
        setScoring(false);
      }
      const star = analyzeSTAR(answerText); // STAR 는 evaluate 응답에 없음 → mock 유지

      // 메인 질문 답변 저장 (aiFeedback 은 있을 때만 옵션 필드로 — Report 는 미사용, 향후 확장용)
      setEntries((prev) =>
        prev.map((e, i) =>
          i === idx
            ? { ...e, answer: answerText, scores, star, wpm, answerTime: Math.round(elapsed * 60), ...(aiFeedback ? { aiFeedback } : {}) }
            : e
        )
      );
      setAnswer("");
      setSttTranscript("");
      if (idx < TOTAL - 1) {
        // 다음 메인 질문 (꼬리질문은 모든 메인 질문 이후로 미룸)
        setIdx(idx + 1);
        setPhase("question");
        setTimeLeft(TIME_PER_Q);
      } else {
        // 메인 질문 종료 → 꼬리질문 단계 시작 (마지막 질문들 기준 1~2개)
        const fEntry = TOTAL - followupTarget;
        setFollowupStep(0);
        setCurrentFollowup(generateFollowup(entries[fEntry].main, entries[fEntry].answer || answerText));
        setPhase("followup");
      }
    } else {
      // ── 꼬리질문 답변 저장 (AI 채점 없음 — 기존 로직) ──
      const targetIdx = TOTAL - followupTarget + followupStep;
      setEntries((prev) => prev.map((e, i) => (i === targetIdx ? { ...e, followup: currentFollowup, followupAnswer: answerText } : e)));
      setAnswer("");
      setSttTranscript("");
      if (followupStep < followupTarget - 1) {
        // 다음 꼬리질문
        const nextStep = followupStep + 1;
        const nextEntry = TOTAL - followupTarget + nextStep;
        setFollowupStep(nextStep);
        setCurrentFollowup(generateFollowup(entries[nextEntry].main, entries[nextEntry].answer));
        setPhase("followup");
        setTimeLeft(TIME_PER_Q);
      } else {
        // 모든 꼬리질문 종료 → 리포트.
        // ★ 필드명 정합(발견2): Report 가 읽는 question/followupQ/followupA 로 매핑(내부 키는 유지).
        const finalEntries = entries
          .map((e, i) => (i === targetIdx ? { ...e, followup: currentFollowup, followupAnswer: answerText } : e))
          .map((e) => ({ ...e, question: e.main, followupQ: e.followup, followupA: e.followupAnswer }));
        navigate("/interview/report/demo", { state: { entries: finalEntries, config: { job, level, type, interviewer, companyType: config.companyType } } });
      }
    }
  };

  const q = entries[idx];
  const isTimeLow = timeLeft < 30;
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // Mock face analysis metrics (animated)
  const gazeStability = 72 + Math.sin(wavePhase * 0.05) * 8;
  const smileIndex = 60 + Math.cos(wavePhase * 0.07) * 12;
  const confidence = 68 + Math.sin(wavePhase * 0.04) * 10;

  const isFollowupQuestion = phase === "followup" || phase === "followup-answering";

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
      {/* 준비(워밍업) 오버레이 — 5초 경과 또는 음성 감지 시 종료 */}
      {warmup && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            px: 2,
            color: "#fff",
            background: "rgba(15,23,42,0.96)",
          }}
        >
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.75,
                px: 1.5,
                py: 0.5,
                borderRadius: "999px",
                bgcolor: "rgba(255,255,255,0.1)",
                fontSize: 12,
                color: "rgba(255,255,255,0.7)",
                mb: 2,
              }}
            >
              <AutoAwesome sx={{ fontSize: 12 }} />
              준비 시간 · 점수 미반영
            </Box>
            <Typography sx={{ fontSize: 24, fontWeight: 700, mb: 1 }}>잠시 후 면접이 시작됩니다</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 1.625 }}>
              이 시간 동안의 {videoEnabled ? "음성·표정은" : "음성은"}{" "}
              <Box component="span" sx={{ color: "#fff", fontWeight: 500 }}>
                점수에 반영되지 않습니다.
              </Box>
              <br />
              지금 말을 시작하면(약 {VOICE_DB_THRESHOLD}dB 이상) 바로 면접이 시작됩니다.
            </Typography>
          </Box>

          <Typography sx={{ fontSize: 72, fontWeight: 700, mb: 4, fontFamily: mono }}>{warmupLeft}</Typography>

          <Box sx={{ width: 256 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 12,
                color: "rgba(255,255,255,0.6)",
                mb: 0.75,
              }}
            >
              <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Mic sx={{ fontSize: 14 }} />
                입력 음량
              </Box>
              <Box
                component="span"
                sx={
                  micDb >= VOICE_DB_THRESHOLD
                    ? { color: "#4ADE80", fontWeight: 500 }
                    : {}
                }
              >
                {micDb} dB
              </Box>
            </Box>
            <Box sx={{ height: 10, borderRadius: "999px", bgcolor: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
              <Box
                sx={{
                  height: "100%",
                  borderRadius: "999px",
                  transition: "all .1s",
                  width: `${Math.min(100, Math.max(0, (micDb / 80) * 100))}%`,
                  backgroundColor: micDb >= VOICE_DB_THRESHOLD ? "#10B981" : "#6C63FF",
                }}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 11,
                color: "rgba(255,255,255,0.4)",
                mt: 0.75,
              }}
            >
              <Box component="span">기준 {VOICE_DB_THRESHOLD}dB · 일반 대화 수준</Box>
              <Box component="span">마이크 미허용 시 {WARMUP_SECONDS}초 후 시작</Box>
            </Box>
          </Box>

          <Box
            component="button"
            type="button"
            onClick={endWarmup}
            sx={{
              mt: 5,
              fontSize: 14,
              color: "rgba(255,255,255,0.6)",
              bgcolor: "transparent",
              border: "none",
              font: "inherit",
              cursor: "pointer",
              transition: "color .2s",
              "&:hover": { color: "#fff" },
            }}
          >
            바로 시작하기
          </Box>
        </Box>
      )}

      {/* AI 채점 로딩 — 메인 답변 제출 후 EXAONE 채점(최대 2~3분), 화면 잠금으로 멈춤 오해 방지 */}
      {scoring && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            px: 2,
            color: "#fff",
            background: "rgba(15,23,42,0.96)",
          }}
        >
          <CircularProgress sx={{ color: "#fff", mb: 3 }} />
          <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 1 }}>AI가 답변을 채점하고 있습니다</Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: 14, textAlign: "center", lineHeight: 1.625 }}>
            EXAONE 모델이 5축으로 평가 중입니다. 최대 2~3분 소요될 수 있어요.
            <br />
            창을 닫지 말고 잠시만 기다려 주세요.
          </Typography>
        </Box>
      )}

      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 3,
          py: 1.75,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography component="span" sx={{ fontSize: 14, color: "text.secondary" }}>
            {idx + 1} / {TOTAL}
          </Typography>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            {entries.map((_, i) => (
              <Box
                key={i}
                sx={{
                  height: 6,
                  borderRadius: "999px",
                  transition: "all .2s",
                  width: i < idx ? 24 : i === idx ? 32 : 16,
                  bgcolor: i < idx ? "primary.main" : i === idx ? "primary.main" : "divider",
                }}
              />
            ))}
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {(phase === "answering" || phase === "followup-answering") && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                fontSize: 14,
                fontFamily: "monospace",
                color: isTimeLow ? "#F87171" : "text.secondary",
              }}
            >
              <AccessTime sx={{ fontSize: 16 }} />
              {fmt(timeLeft)}
            </Box>
          )}

          {/* Camera toggle — 영상 면접일 때만 */}
          {videoEnabled && (
            <Box
              component="button"
              type="button"
              onClick={toggleCamera}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                px: 1.5,
                py: 0.75,
                borderRadius: "8px",
                fontSize: 12,
                font: "inherit",
                cursor: "pointer",
                transition: "color .2s, background-color .2s",
                border: "1px solid",
                ...(cameraOn
                  ? { borderColor: "rgba(108,99,255,0.4)", bgcolor: "rgba(108,99,255,0.1)", color: "primary.main" }
                  : {
                      borderColor: "divider",
                      bgcolor: "#F8F9FF",
                      color: "text.secondary",
                      "&:hover": { color: "text.primary" },
                    }),
              }}
            >
              {cameraOn ? <Videocam sx={{ fontSize: 14 }} /> : <VideocamOff sx={{ fontSize: 14 }} />}
              {cameraOn ? "카메라 ON" : "카메라 OFF"}
            </Box>
          )}

          {/* Mode toggle */}
          <Box sx={{ display: "flex", borderRadius: "8px", bgcolor: "#F8F9FF", p: 0.5, gap: 0.5 }}>
            {["text", "voice"].map((m) => (
              <Box
                key={m}
                component="button"
                type="button"
                onClick={() => {
                  setMode(m);
                  if (sttActive) stopSTT();
                }}
                sx={{
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "6px",
                  fontSize: 12,
                  font: "inherit",
                  cursor: "pointer",
                  border: "none",
                  transition: "all .2s",
                  ...(mode === m
                    ? { bgcolor: "background.paper", color: "text.primary", boxShadow: 1 }
                    : { bgcolor: "transparent", color: "text.secondary" }),
                }}
              >
                {m === "text" ? "텍스트" : "음성"}
              </Box>
            ))}
          </Box>

          <Box
            component="button"
            type="button"
            onClick={() => setShowExit(true)}
            sx={{
              display: "flex",
              p: 1,
              borderRadius: "8px",
              bgcolor: "transparent",
              border: "none",
              cursor: "pointer",
              color: "text.secondary",
              transition: "color .2s, background-color .2s",
              "&:hover": { bgcolor: "#F8F9FF", color: "text.primary" },
            }}
          >
            <Close sx={{ fontSize: 20 }} />
          </Box>
        </Box>
      </Box>

      {/* Main */}
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Question area */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            px: 3,
            py: 4,
            position: "relative",
            overflowY: "auto",
          }}
        >
          <Box sx={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 384,
                height: 384,
                borderRadius: "999px",
                opacity: 0.05,
                background: "radial-gradient(ellipse, #6366F1 0%, transparent 70%)",
              }}
            />
          </Box>

          <Box sx={{ position: "relative", width: "100%", maxWidth: 672 }}>
            {/* Phase badge */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
              {isFollowupQuestion ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: "999px",
                    bgcolor: "rgba(234,179,8,0.1)",
                    border: "1px solid rgba(234,179,8,0.3)",
                    color: "#EAB308",
                    fontSize: 12,
                  }}
                >
                  <ErrorOutlineOutlined sx={{ fontSize: 12 }} />
                  꼬리질문 (답변 기반 AI 생성)
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: "999px",
                    bgcolor: "rgba(108,99,255,0.1)",
                    border: "1px solid rgba(108,99,255,0.2)",
                    color: "primary.main",
                    fontSize: 12,
                  }}
                >
                  <AutoAwesome sx={{ fontSize: 12 }} />
                  질문 {idx + 1}
                </Box>
              )}
              {interviewer === "pressure" && (
                <Box
                  sx={{
                    px: 1,
                    py: 0.25,
                    borderRadius: "999px",
                    bgcolor: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    color: "#EF4444",
                    fontSize: 12,
                  }}
                >
                  압박형
                </Box>
              )}
              {interviewer === "followup" && (
                <Box
                  sx={{
                    px: 1,
                    py: 0.25,
                    borderRadius: "999px",
                    bgcolor: "rgba(234,179,8,0.1)",
                    border: "1px solid rgba(234,179,8,0.2)",
                    color: "#EAB308",
                    fontSize: 12,
                  }}
                >
                  꼬리질문형
                </Box>
              )}
            </Box>

            {/* Question card */}
            <Box
              sx={{
                borderRadius: "16px",
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                p: 3.5,
                mb: 3,
                boxShadow: 1,
              }}
            >
              <Typography sx={{ fontSize: 18, color: "text.primary", lineHeight: 1.625 }}>
                {isFollowupQuestion ? currentFollowup : q.main}
              </Typography>
            </Box>

            {/* Answering states */}
            {phase === "question" && (
              <Box sx={{ textAlign: "center" }}>
                <Typography sx={{ fontSize: 14, color: "text.secondary", mb: 2.5 }}>준비가 되면 답변을 시작하세요</Typography>
                <Box
                  component="button"
                  type="button"
                  onClick={startAnswer}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1,
                    px: 4,
                    py: 1.5,
                    borderRadius: "12px",
                    bgcolor: "primary.main",
                    color: "#fff",
                    border: "none",
                    font: "inherit",
                    cursor: "pointer",
                    transition: "background-color .2s",
                    boxShadow: "0 0 24px rgba(99,102,241,0.3)",
                    "&:hover": { bgcolor: "primary.dark" },
                  }}
                >
                  {mode === "voice" ? <Mic sx={{ fontSize: 20 }} /> : <Send sx={{ fontSize: 20 }} />}
                  답변 시작
                </Box>
              </Box>
            )}

            {phase === "followup" && (
              <Box sx={{ textAlign: "center" }}>
                <Box
                  sx={{
                    mb: 2,
                    p: 1.5,
                    borderRadius: "12px",
                    bgcolor: "rgba(234,179,8,0.05)",
                    border: "1px solid rgba(234,179,8,0.2)",
                    fontSize: 12,
                    color: "#CA8A04",
                    textAlign: "left",
                  }}
                >
                  <Box component="strong">이전 답변 요약:</Box> {q.answer.slice(0, 80)}
                  {q.answer.length > 80 ? "..." : ""}
                </Box>
                <Box
                  component="button"
                  type="button"
                  onClick={startFollowupAnswer}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1,
                    px: 4,
                    py: 1.5,
                    borderRadius: "12px",
                    border: "1px solid rgba(234,179,8,0.3)",
                    bgcolor: "rgba(234,179,8,0.1)",
                    color: "#CA8A04",
                    font: "inherit",
                    cursor: "pointer",
                    transition: "background-color .2s",
                    "&:hover": { bgcolor: "rgba(234,179,8,0.2)" },
                  }}
                >
                  {mode === "voice" ? <Mic sx={{ fontSize: 20 }} /> : <Send sx={{ fontSize: 20 }} />}
                  꼬리질문 답변
                </Box>
              </Box>
            )}

            {(phase === "answering" || phase === "followup-answering") && mode === "text" && (
              <Box>
                <Box
                  component="textarea"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="답변을 입력하세요..."
                  autoFocus
                  sx={{
                    width: "100%",
                    height: 144,
                    px: 2,
                    py: 1.5,
                    borderRadius: "12px",
                    bgcolor: "#F8F9FF",
                    border: "1px solid",
                    borderColor: "divider",
                    color: "text.primary",
                    fontSize: 14,
                    font: "inherit",
                    resize: "none",
                    boxSizing: "border-box",
                    transition: "border-color .2s",
                    "&:focus": { outline: "none", borderColor: "rgba(108,99,255,0.6)" },
                    "&::placeholder": { color: "text.secondary" },
                  }}
                />
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, fontSize: 12, color: "text.secondary" }}>
                    <Box component="span">{answer.length}자</Box>
                    {answer.trim().split(/\s+/).length > 0 && <Box component="span">{answer.trim().split(/\s+/).length}단어</Box>}
                  </Box>
                  <Box
                    component="button"
                    type="button"
                    onClick={handleSubmit}
                    disabled={answer.trim().length < 5 || scoring}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      px: 2.5,
                      py: 1,
                      borderRadius: "8px",
                      bgcolor: "primary.main",
                      color: "#fff",
                      fontSize: 14,
                      border: "none",
                      font: "inherit",
                      cursor: "pointer",
                      transition: "background-color .2s",
                      "&:hover": { bgcolor: "primary.dark" },
                      "&:disabled": { opacity: 0.4, cursor: "default" },
                    }}
                  >
                    <ChevronRight sx={{ fontSize: 16 }} />
                    {scoring ? "AI 채점 중..." : phase === "answering" ? "답변 완료" : followupStep < followupTarget - 1 ? "다음 질문" : "면접 완료"}
                  </Box>
                </Box>
              </Box>
            )}

            {(phase === "answering" || phase === "followup-answering") && mode === "voice" && (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2.5 }}>
                {/* STT transcript preview */}
                {sttTranscript && (
                  <Box
                    sx={{
                      width: "100%",
                      px: 2,
                      py: 1.5,
                      borderRadius: "12px",
                      bgcolor: "#F8F9FF",
                      border: "1px solid",
                      borderColor: "divider",
                      fontSize: 14,
                      color: "text.primary",
                      minHeight: 64,
                      lineHeight: 1.625,
                    }}
                  >
                    {sttTranscript}
                  </Box>
                )}
                {/* Waveform */}
                <Box sx={{ display: "flex", alignItems: "center", gap: "2px", height: 56 }}>
                  {Array.from({ length: 36 }).map((_, i) => {
                    const h = recording ? 6 + Math.abs(Math.sin((i + wavePhase * 0.3) * 0.8)) * 36 : 6;
                    return (
                      <Box
                        key={i}
                        sx={{
                          width: 6,
                          borderRadius: "999px",
                          bgcolor: "primary.main",
                          transition: "all .075s",
                          height: `${h}px`,
                          opacity: recording ? 0.5 + Math.abs(Math.sin((i + wavePhase * 0.3) * 0.8)) * 0.5 : 0.2,
                        }}
                      />
                    );
                  })}
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, fontSize: 14, color: "text.secondary" }}>
                  {sttActive ? (
                    <>
                      <Box
                        component="span"
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "999px",
                          bgcolor: "#EF4444",
                          animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
                        }}
                      />
                      실시간 변환 중...
                    </>
                  ) : recording ? (
                    "처리 중..."
                  ) : (
                    "대기 중"
                  )}
                </Box>
                <Box
                  component="button"
                  type="button"
                  onClick={handleSubmit}
                  disabled={scoring}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 3,
                    py: 1.5,
                    borderRadius: "12px",
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "#F8F9FF",
                    fontSize: 14,
                    color: "text.primary",
                    font: "inherit",
                    cursor: "pointer",
                    transition: "background-color .2s",
                    "&:hover": { bgcolor: "#F1F3FB" },
                    "&:disabled": { opacity: 0.4, cursor: "default" },
                  }}
                >
                  <Stop sx={{ fontSize: 16, color: "#F87171" }} />
                  {scoring ? "AI 채점 중..." : "답변 완료"}
                </Box>
              </Box>
            )}
          </Box>
        </Box>

        {/* Camera / Analysis panel */}
        <Box
          sx={{
            display: { xs: "none", lg: "flex" },
            flexDirection: "column",
            gap: 1.5,
            width: 224,
            p: 2,
            borderLeft: "1px solid",
            borderColor: "divider",
            flexShrink: 0,
          }}
        >
          {videoEnabled ? (
            <>
              {/* Camera */}
              <Box
                sx={{
                  borderRadius: "12px",
                  overflow: "hidden",
                  aspectRatio: "16 / 9",
                  bgcolor: "#F8F9FF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid",
                  borderColor: "divider",
                  position: "relative",
                }}
              >
                {cameraOn ? (
                  <Box component="video" ref={videoRef} muted playsInline sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, color: "text.secondary" }}>
                    <VideocamOff sx={{ fontSize: 24 }} />
                    <Box component="span" sx={{ fontSize: 12 }}>
                      카메라 꺼짐
                    </Box>
                  </Box>
                )}
                {cameraOn && (
                  <Box sx={{ position: "absolute", top: 6, right: 6 }}>
                    <Box
                      component="span"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        fontSize: 10,
                        color: "#fff",
                        bgcolor: "#EF4444",
                        borderRadius: "4px",
                        px: 0.75,
                        py: 0.25,
                      }}
                    >
                      <Box
                        component="span"
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: "999px",
                          bgcolor: "#fff",
                          animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
                        }}
                      />
                      REC
                    </Box>
                  </Box>
                )}
              </Box>

              {cameraOn && (
                <>
                  <Box sx={{ fontSize: 12, color: "text.secondary", textAlign: "center" }}>face-api.js 분석 활성화</Box>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                    {[
                      { label: "시선 안정", value: gazeStability, icon: Visibility, color: "#6366F1" },
                      { label: "미소 지수", value: smileIndex, icon: SentimentSatisfiedAlt, color: "#10B981" },
                      { label: "자신감", value: confidence, icon: Bolt, color: "#F59E0B" },
                    ].map(({ label, value, icon: Icon, color }) => (
                      <Box key={label}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "text.secondary", mb: 0.5 }}>
                          <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <Icon sx={{ fontSize: 12 }} />
                            {label}
                          </Box>
                          <Box component="span" sx={{ fontFamily: "monospace" }}>
                            {Math.round(value)}%
                          </Box>
                        </Box>
                        <Box sx={{ height: 6, borderRadius: "999px", bgcolor: "#F8F9FF", overflow: "hidden" }}>
                          <Box
                            sx={{
                              height: 6,
                              borderRadius: "999px",
                              transition: "all .5s",
                              width: `${value}%`,
                              backgroundColor: color,
                            }}
                          />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </>
          ) : (
            /* 음성 면접 — 영상 분석 미사용 플레이스홀더 */
            <Box
              sx={{
                borderRadius: "12px",
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "#F8F9FF",
                aspectRatio: "16 / 9",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                textAlign: "center",
                px: 1.5,
              }}
            >
              <Mic sx={{ fontSize: 24, color: "primary.main" }} />
              <Box component="span" sx={{ fontSize: 12, fontWeight: 500, color: "text.primary" }}>
                음성 면접
              </Box>
              <Box component="span" sx={{ fontSize: 11, lineHeight: 1.25, color: "text.secondary" }}>
                영상 분석 미사용
                <br />
                음성으로만 진행됩니다
              </Box>
            </Box>
          )}

          {/* WPM tracker during answering */}
          {(phase === "answering" || phase === "followup-answering") && answer.trim() && (
            <Box sx={{ mt: 0.5, borderRadius: "8px", bgcolor: "#F8F9FF", border: "1px solid", borderColor: "divider", p: 1.25 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, fontSize: 12, color: "text.secondary", mb: 0.5 }}>
                <MonitorHeart sx={{ fontSize: 12 }} />
                말하기 속도
              </Box>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: "text.primary", fontFamily: "monospace" }}>
                {(() => {
                  const elapsed = (Date.now() - answerStartTime) / 1000 / 60;
                  const words = answer.trim().split(/\s+/).length;
                  return elapsed > 0.01 ? Math.round(words / elapsed) : 0;
                })()}
                <Box component="span" sx={{ fontSize: 12, fontWeight: 400, color: "text.secondary", ml: 0.5 }}>
                  WPM
                </Box>
              </Typography>
              <Box sx={{ fontSize: 12, color: "text.secondary" }}>적정: 120~180 WPM</Box>
            </Box>
          )}

          <Box sx={{ mt: "auto", borderRadius: "8px", bgcolor: "#F8F9FF", p: 1.25, fontSize: 12, textAlign: "left" }}>
            <Box sx={{ color: "text.primary", fontWeight: 500, mb: 0.5 }}>면접 팁</Box>
            <Typography sx={{ color: "text.secondary", fontSize: 12, lineHeight: 1.625 }}>
              {interviewer === "pressure"
                ? "압박형 면접관은 침착함을 유지하는 것이 핵심입니다. 모르면 솔직히 말하세요."
                : interviewer === "followup"
                ? "꼬리질문은 깊이를 봅니다. 구체적 사례와 수치를 준비하세요."
                : "카메라를 바라보며 자신 있게 말하세요. 평상시보다 10% 느리게."}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Exit modal */}
      {showExit && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            bgcolor: "rgba(0,0,0,0.6)",
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
              p: 4,
              maxWidth: 384,
              width: "100%",
              textAlign: "center",
            }}
          >
            <Typography sx={{ fontWeight: 600, color: "text.primary", mb: 1 }}>면접을 종료하시겠어요?</Typography>
            <Typography sx={{ fontSize: 14, color: "text.secondary", mb: 3 }}>지금까지의 답변은 저장되지 않습니다.</Typography>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Box
                component="button"
                type="button"
                onClick={() => setShowExit(false)}
                sx={{
                  flex: 1,
                  py: 1.25,
                  borderRadius: "8px",
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
                계속하기
              </Box>
              <Box
                component="button"
                type="button"
                onClick={() => {
                  streamRef.current?.getTracks().forEach((t) => t.stop());
                  navigate("/");
                }}
                sx={{
                  flex: 1,
                  py: 1.25,
                  borderRadius: "8px",
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
                종료
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
