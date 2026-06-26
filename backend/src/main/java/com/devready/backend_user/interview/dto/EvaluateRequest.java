package com.devready.backend_user.interview.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 프론트 → Spring /api/interview/evaluate 요청 바디.
 * FastAPI EvaluateReq 와 동일 필드(snake_case 아님 — Spring 내부는 camelCase, 서비스에서 그대로 전달).
 * lang 미지정 시 서비스에서 "ko" 기본값 처리.
 */
@Getter
@Setter
public class EvaluateRequest {
    private String question;
    private String answer;
    private String lang;
}
