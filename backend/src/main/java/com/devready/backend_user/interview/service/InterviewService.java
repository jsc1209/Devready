package com.devready.backend_user.interview.service;

import com.devready.backend_user.interview.dto.EvaluateRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.HashMap;
import java.util.Map;

/**
 * 면접 채점 게이트웨이 — Colab FastAPI /interview/evaluate 로 중계(얇은 프록시).
 * 응답 가공/매핑은 하지 않고 FastAPI 원본을 그대로 넘긴다(4축→프론트 키 매핑은 프론트 담당).
 */
@Service
public class InterviewService {

    private final RestClient aiRestClient;
    private final String aiServerUrl;

    public InterviewService(RestClient aiRestClient,
                            @Value("${ai.server.url:}") String aiServerUrl) {
        this.aiRestClient = aiRestClient;
        this.aiServerUrl = aiServerUrl;
    }

    /**
     * FastAPI /interview/evaluate 호출.
     * @return FastAPI 원본 응답 Map({ok, evaluation|error, ...}).
     *         URL 미설정·연결 실패·타임아웃·4xx/5xx 시 null (점수 위조하지 않음 — 호출자가 실패로 처리).
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> evaluate(EvaluateRequest req) {
        // AI 서버 URL 미설정(Colab 미가동) → 연결 불가로 간주
        if (aiServerUrl == null || aiServerUrl.isBlank()) {
            return null;
        }

        Map<String, Object> body = new HashMap<>();
        body.put("question", req.getQuestion());
        body.put("answer", req.getAnswer());
        body.put("lang", (req.getLang() != null && !req.getLang().isBlank()) ? req.getLang() : "ko");

        try {
            return aiRestClient.post()
                    .uri("/interview/evaluate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);
        } catch (RestClientException e) {
            // 연결 거부·타임아웃·HTTP 에러 등 → 연결 불가로 신호
            return null;
        }
    }
}
