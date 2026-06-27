import gatewayAxios from "./gatewayAxios";

/**
 * POST /api/chat — Spring 게이트웨이(8080)가 Colab FastAPI(/chat)를 패스스루(stateless·비로그인 허용).
 * 응답(원본 그대로): { ok:true, source:"faq|interview|none", answer, score, category,
 *                     matched_question, related_question } / 실패 { ok:false, error }.
 * (interviewApi.generateReport 와 동일 패스스루 관례 — DataVO 미적용, res.data 그대로 반환.)
 */
export async function sendChat(message, lang = "ko") {
  const res = await gatewayAxios.post("/api/chat", { message, lang });
  return res.data;
}
