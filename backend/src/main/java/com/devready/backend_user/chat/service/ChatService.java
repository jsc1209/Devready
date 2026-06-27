package com.devready.backend_user.chat.service;

import com.devready.backend_user.chat.dto.ChatRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.Map;

/**
 * 챗봇 게이트웨이 — Colab FastAPI /chat 으로 중계(얇은 프록시, stateless).
 *
 * <p>비로그인 허용·DB 저장 없음. InterviewService.proxyPost(generate/report) 패스스루 패턴을
 * 그대로 따른다 — URL 미설정·연결 실패 시 graceful {ok:false,error}, 정상 시 원본 그대로 반환.
 * FastAPI 응답({ok, source, answer, score, category, matched_question, related_question})은 변형하지 않는다.
 */
@Slf4j
@Service
public class ChatService {

    private final RestClient aiRestClient;
    private final String aiServerUrl;

    public ChatService(RestClient aiRestClient,
                       @Value("${ai.server.url:}") String aiServerUrl) {
        this.aiRestClient = aiRestClient;
        this.aiServerUrl = aiServerUrl;
    }

    /**
     * 사용자 메시지 → FastAPI /chat 패스스루.
     * @return FastAPI 원본 Map. 입력 누락·URL 미설정·연결 실패·빈 응답 시 graceful {ok:false, error}.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> chat(ChatRequest req) {
        // 입력 검증 — message 누락 시 AI 서버 호출 없이 즉시 반환
        if (req == null || req.getMessage() == null || req.getMessage().isBlank()) {
            return Map.of("ok", false, "error", "메시지를 입력해주세요.");
        }
        // AI 서버 URL 미설정(Colab 미가동) → 연결 불가로 간주
        if (aiServerUrl == null || aiServerUrl.isBlank()) {
            return Map.of("ok", false, "error", "AI 서버에 연결할 수 없습니다.");
        }

        String lang = (req.getLang() != null && !req.getLang().isBlank()) ? req.getLang() : "ko";
        Map<String, Object> body = new HashMap<>();
        body.put("message", req.getMessage());
        body.put("lang", lang);

        try {
            Map<String, Object> resp = aiRestClient.post()
                    .uri("/chat")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);
            if (resp == null) {
                return Map.of("ok", false, "error", "AI 서버 응답이 비어 있습니다.");
            }
            return resp; // 원본 그대로 패스스루
        } catch (Exception e) {
            // 연결 거부·타임아웃·파싱 오류 등 → 연결 불가로 신호(메시지만 로깅)
            log.warn("AI 챗봇 호출 실패: {}", e.toString());
            return Map.of("ok", false, "error", "AI 서버에 연결할 수 없습니다.");
        }
    }
}
