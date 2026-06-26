package com.devready.backend_user.interview.service;

import com.devready.backend_user.interview.mapper.InterviewMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 면접 결과 영속화/조회. 종료 시 단일 트랜잭션으로
 *   interview_session + question[] + answer[] + answer_score[](5축) + interview_report 저장.
 * star_analysis/answer_voice/answer_video 는 v1 보류. 모든 작업 본인 member_id 범위.
 */
@Service
@RequiredArgsConstructor
public class InterviewStoreService {

    private final InterviewMapper interviewMapper;

    // ───── 저장 ─────
    @Transactional
    public Long save(Long memberId, Map<String, Object> body) {
        Long jobResumeId = toLong(firstNonNull(body.get("jobResumeId"), body.get("job_resume_id")));
        if (jobResumeId == null) {
            throw new IllegalArgumentException("jobResumeId 가 필요합니다.");
        }
        Long owner = interviewMapper.ownerOfJobResume(jobResumeId);
        if (owner == null || !owner.equals(memberId)) {
            throw new IllegalArgumentException("이력서(job_resume)를 찾을 수 없거나 권한이 없습니다.");
        }

        Map<String, Object> meta = asMap(body.get("meta"));
        if (meta == null) meta = Map.of();
        List<Object> entries = asList(body.get("entries"));

        // interview_session
        Map<String, Object> s = new HashMap<>();
        s.put("memberId", memberId);
        s.put("jobResumeId", jobResumeId);
        s.put("questionCount", entries.size());
        s.put("interviewType", mapType(str(meta.get("interviewType"))));
        s.put("interviewerType", mapInterviewer(str(meta.get("interviewerType"))));
        s.put("interviewerCount", 1);
        s.put("inputMode", mapInputMode(str(meta.get("inputMode"))));
        s.put("useVideo", Boolean.TRUE.equals(meta.get("videoEnabled")) ? 1 : 0);
        interviewMapper.insertSession(s);
        Long sessionId = ((Number) s.get("sessionId")).longValue();

        // question/answer/answer_score (+ 꼬리질문)
        int order = 0;
        long totalSum = 0;
        int scored = 0;
        for (Object o : entries) {
            Map<String, Object> e = asMap(o);
            if (e == null) continue;
            order++;

            Long questionId = insertQuestion(sessionId, str(e.get("question")), "MAIN", order, null);
            Long answerId = insertAnswer(questionId, orEmpty(str(e.get("answer"))));

            Map<String, Object> sc = asMap(e.get("scores"));
            int t = num(sc == null ? null : sc.get("technical"));
            int l = num(sc == null ? null : sc.get("logic"));
            int sp = num(sc == null ? null : sc.get("specificity"));
            int d = num(sc == null ? null : sc.get("depth"));
            int c = num(sc == null ? null : sc.get("communication"));
            int total = weighted(t, l, sp, d, c);
            Map<String, Object> asc = new HashMap<>();
            asc.put("answerId", answerId);
            asc.put("technical", t);
            asc.put("logic", l);
            asc.put("specificity", sp);
            asc.put("depth", d);
            asc.put("communication", c);
            asc.put("total", total);
            asc.put("feedback", orEmpty(str(e.get("feedback"))));
            interviewMapper.insertAnswerScore(asc);
            totalSum += total;
            scored++;

            // 꼬리질문(있으면) — 점수 없음
            String fq = str(e.get("followupQ"));
            if (fq != null && !fq.isBlank()) {
                Long fqId = insertQuestion(sessionId, fq, "FOLLOWUP", order, questionId);
                insertAnswer(fqId, orEmpty(str(e.get("followupA"))));
            }
        }

        // interview_report (AI 종합 결과 재사용; 실패/폴백 시 빈문자열 — 점수는 실제 계산값)
        Map<String, Object> report = asMap(body.get("report"));
        if (report == null) report = Map.of();
        int overall = scored > 0 ? (int) Math.round((double) totalSum / scored) : 0;
        Map<String, Object> r = new HashMap<>();
        r.put("sessionId", sessionId);
        r.put("itemScore", 0);
        r.put("totalScore", clamp(overall));
        r.put("overallComment", orEmpty(str(report.get("summary"))));
        r.put("strengths", joinList(report.get("strengths")));
        r.put("weaknesses", joinList(report.get("weaknesses")));
        r.put("goodAnswer", "");
        r.put("improvementNeeded", joinList(report.get("guide")));
        r.put("modelAnswer", "");
        interviewMapper.insertReport(r);

        return sessionId;
    }

    private Long insertQuestion(Long sessionId, String text, String type, int order, Long parentId) {
        Map<String, Object> q = new HashMap<>();
        q.put("sessionId", sessionId);
        q.put("questionText", orEmpty(text));
        q.put("questionType", type);
        q.put("source", "AI");
        q.put("difficulty", "중");
        q.put("displayOrder", order);
        q.put("parentQuestionId", parentId);
        interviewMapper.insertQuestion(q);
        return ((Number) q.get("questionId")).longValue();
    }

    private Long insertAnswer(Long questionId, String text) {
        Map<String, Object> a = new HashMap<>();
        a.put("questionId", questionId);
        a.put("answerText", orEmpty(text));
        a.put("answerOrder", 1);
        interviewMapper.insertAnswer(a);
        return ((Number) a.get("answerId")).longValue();
    }

    // ───── 조회 ─────
    @Transactional(readOnly = true)
    public List<Map<String, Object>> findMySessions(Long memberId) {
        return interviewMapper.findSessionsByMember(memberId);
    }

    /** 세션 전체 트리. 본인 것 아니면 null. */
    @Transactional(readOnly = true)
    public Map<String, Object> getSession(Long memberId, Long sessionId) {
        Map<String, Object> meta = interviewMapper.findSessionForMember(sessionId, memberId);
        if (meta == null) return null;
        Map<String, Object> out = new LinkedHashMap<>(meta);
        out.put("questions", interviewMapper.findQuestionsWithAnswers(sessionId));
        out.put("report", interviewMapper.findReport(sessionId));
        return out;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStats(Long memberId) {
        Map<String, Object> axis = interviewMapper.statsAxisAverages(memberId);
        List<Map<String, Object>> growth = interviewMapper.statsGrowth(memberId);

        Map<String, Object> axisAvg = new LinkedHashMap<>();
        axisAvg.put("technical", numOrZero(axis == null ? null : axis.get("technical")));
        axisAvg.put("logic", numOrZero(axis == null ? null : axis.get("logic")));
        axisAvg.put("specificity", numOrZero(axis == null ? null : axis.get("specificity")));
        axisAvg.put("depth", numOrZero(axis == null ? null : axis.get("depth")));
        axisAvg.put("communication", numOrZero(axis == null ? null : axis.get("communication")));

        long sum = 0;
        int n = 0;
        for (Map<String, Object> g : growth) {
            Object ts = g.get("totalScore");
            if (ts != null) {
                sum += ((Number) ts).longValue();
                n++;
            }
        }
        int avgScore = n > 0 ? (int) Math.round((double) sum / n) : 0;

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("axisAverages", axisAvg);
        out.put("avgScore", avgScore);
        out.put("sessionCount", growth.size());
        out.put("growth", growth);
        return out;
    }

    // ───── helpers ─────
    private String mapType(String v) {
        if (v == null) return "종합";
        return switch (v) {
            case "tech" -> "기술";
            case "personality" -> "인성";
            default -> "종합";   // job/comprehensive/기타
        };
    }

    private String mapInterviewer(String v) {
        if (v == null) return "NORMAL";
        return switch (v) {
            case "pressure" -> "PRESSURE";
            case "friendly" -> "FRIENDLY";
            default -> "NORMAL";   // normal/followup/기타
        };
    }

    private String mapInputMode(String v) {
        return "voice".equals(v) ? "VOICE" : "TEXT";
    }

    private int weighted(int t, int l, int s, int d, int c) {
        return clamp((int) Math.round(t * 0.3 + l * 0.2 + s * 0.2 + d * 0.2 + c * 0.1));
    }

    private int clamp(int v) {
        return Math.max(0, Math.min(100, v));
    }

    private int num(Object o) {
        if (o == null) return 0;
        if (o instanceof Number) return clamp(((Number) o).intValue());
        try {
            return clamp((int) Math.round(Double.parseDouble(String.valueOf(o).trim())));
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private int numOrZero(Object o) {
        if (o == null) return 0;
        if (o instanceof Number) return ((Number) o).intValue();
        try {
            return (int) Math.round(Double.parseDouble(String.valueOf(o).trim()));
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private String joinList(Object o) {
        if (!(o instanceof List)) return "";
        StringBuilder sb = new StringBuilder();
        for (Object x : (List<?>) o) {
            if (x == null) continue;
            if (sb.length() > 0) sb.append("\n");
            sb.append(String.valueOf(x));
        }
        return sb.toString();
    }

    private Object firstNonNull(Object a, Object b) {
        return a != null ? a : b;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> asMap(Object o) {
        return (o instanceof Map) ? (Map<String, Object>) o : null;
    }

    @SuppressWarnings("unchecked")
    private List<Object> asList(Object o) {
        return (o instanceof List) ? (List<Object>) o : List.of();
    }

    private String str(Object o) {
        return o == null ? null : String.valueOf(o);
    }

    private String orEmpty(String s) {
        return s == null ? "" : s;
    }

    private Long toLong(Object o) {
        if (o == null) return null;
        if (o instanceof Number) return ((Number) o).longValue();
        try {
            return Long.parseLong(String.valueOf(o).trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
