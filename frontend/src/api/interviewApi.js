import gatewayAxios from "./gatewayAxios";

/**
 * POST /api/interview/evaluate — Spring 게이트웨이가 Colab FastAPI(SSE)를 중계.
 * 응답: DataVO { success, message, data } 그대로 반환.
 *   data = { scores:{technical_accuracy,specificity,logic,communication},
 *            strengths[], improvements[], feedback, overall, display_scores:{logic,clarity,depth} }
 * (~140초 소요. 에러/실패 분기는 호출처에서 res.success 로 처리.)
 */
export async function evaluateAnswer({ question, answer, lang = "ko" }) {
  const res = await gatewayAxios.post("/api/interview/evaluate", { question, answer, lang });
  return res.data; // DataVO
}

/**
 * FastAPI 4축(+display_scores) → 프론트 5키(scoreAnswer 와 동일 구조)로 매핑.
 * technical/logic/specificity/communication 직접, depth 는 display_scores.depth 재사용
 * (없으면 (specificity+technical_accuracy)/2 — server mapping.py 와 동일 공식).
 */
export function mapScores(evaluation) {
  const s = evaluation?.scores ?? {};
  const ta = s.technical_accuracy ?? 0;
  const sp = s.specificity ?? 0;
  const depth = evaluation?.display_scores?.depth ?? Math.round((sp + ta) / 2);
  return {
    technical: ta,
    logic: s.logic ?? 0,
    specificity: sp,
    depth,
    communication: s.communication ?? 0,
  };
}
