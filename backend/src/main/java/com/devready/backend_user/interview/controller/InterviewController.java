package com.devready.backend_user.interview.controller;

import com.devready.backend_user.common.vo.DataVO;
import com.devready.backend_user.interview.dto.EvaluateRequest;
import com.devready.backend_user.interview.service.InterviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 면접 채점 게이트웨이 컨트롤러.
 * 프론트 → Spring(/api/interview/evaluate) → Colab FastAPI(/interview/evaluate) 중계.
 * FastAPI 는 실패도 HTTP 200 + {ok:false} 이므로 반드시 ok 로 분기.
 */
@RestController
@RequestMapping("/api/interview")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService interviewService;

    @PostMapping("/evaluate")
    public DataVO evaluate(@RequestBody EvaluateRequest req) {
        if (req == null || isBlank(req.getQuestion()) || isBlank(req.getAnswer())) {
            return DataVO.fail("question 과 answer 는 필수입니다.");
        }

        Map<String, Object> resp = interviewService.evaluate(req);

        // 연결 불가(URL 미설정·타임아웃·거부 등) → 프론트가 mock 으로 폴백
        if (resp == null) {
            return DataVO.fail("AI 서버에 연결할 수 없습니다.");
        }
        // FastAPI 성공: evaluation 그대로 전달
        if (Boolean.TRUE.equals(resp.get("ok"))) {
            return DataVO.ok(resp.get("evaluation"));
        }
        // FastAPI 평가 실패(ok=false)
        Object error = resp.get("error");
        return DataVO.fail(error != null ? error.toString() : "AI 평가에 실패했습니다.");
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
