package com.devready.backend_user.chat.controller;

import com.devready.backend_user.chat.dto.ChatRequest;
import com.devready.backend_user.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 챗봇 게이트웨이 컨트롤러.
 * 프론트 → Spring(/api/chat) → Colab FastAPI(/chat) 중계. 비로그인 허용·stateless(DB 저장 없음).
 * FastAPI 는 실패도 HTTP 200 + {ok:false} 이므로 프론트가 ok 로 분기(generate/report 와 동일 패스스루).
 */
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping
    public Map<String, Object> chat(@RequestBody ChatRequest req) {
        return chatService.chat(req);
    }
}
