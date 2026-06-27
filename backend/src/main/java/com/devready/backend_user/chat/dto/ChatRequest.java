package com.devready.backend_user.chat.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 프론트 → Spring /api/chat 요청 바디.
 * FastAPI /chat 요청({message, lang})과 동일 필드. lang 미지정 시 서비스에서 "ko" 기본값 처리.
 */
@Getter
@Setter
public class ChatRequest {
    private String message;
    private String lang;
}
