package com.devready.backend_user.interview.controller;

import com.devready.backend_user.common.jwt.LoginMember;
import com.devready.backend_user.common.vo.DataVO;
import com.devready.backend_user.interview.service.InterviewStoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 면접 결과 영속화/조회 API(/api/interview-sessions). AI 프록시(/api/interview/*)와 경로·클래스 분리.
 * 모든 작업 @LoginMember 기준, 비로그인 401. 저장 소유 검증 실패는 400(GlobalExceptionHandler).
 */
@RestController
@RequestMapping("/api/interview-sessions")
@RequiredArgsConstructor
public class InterviewStoreController {

    private final InterviewStoreService interviewStoreService;

    /** 면접 종료 저장: { jobResumeId, meta, entries[], report } → { sessionId } */
    @PostMapping
    public ResponseEntity<DataVO> save(@LoginMember Long memberId,
                                       @RequestBody Map<String, Object> body) {
        if (memberId == null) {
            return ResponseEntity.status(401).body(DataVO.fail("로그인이 필요합니다."));
        }
        Long sessionId = interviewStoreService.save(memberId, body);
        return ResponseEntity.ok(DataVO.ok("저장되었습니다.", Map.of("sessionId", sessionId)));
    }

    /** 내 면접 목록(HistoryPage / 마이페이지 탭). */
    @GetMapping
    public ResponseEntity<DataVO> list(@LoginMember Long memberId) {
        if (memberId == null) {
            return ResponseEntity.status(401).body(DataVO.fail("로그인이 필요합니다."));
        }
        return ResponseEntity.ok(DataVO.ok(interviewStoreService.findMySessions(memberId)));
    }

    /** 마이페이지 집계(레이더 5축 평균 + 회차별 추이). */
    @GetMapping("/stats")
    public ResponseEntity<DataVO> stats(@LoginMember Long memberId) {
        if (memberId == null) {
            return ResponseEntity.status(401).body(DataVO.fail("로그인이 필요합니다."));
        }
        return ResponseEntity.ok(DataVO.ok(interviewStoreService.getStats(memberId)));
    }

    /** 세션 상세(SessionDetail). 본인 것 아니면 404. */
    @GetMapping("/{id}")
    public ResponseEntity<DataVO> detail(@LoginMember Long memberId, @PathVariable Long id) {
        if (memberId == null) {
            return ResponseEntity.status(401).body(DataVO.fail("로그인이 필요합니다."));
        }
        Map<String, Object> res = interviewStoreService.getSession(memberId, id);
        if (res == null) {
            return ResponseEntity.status(404).body(DataVO.fail("면접 기록을 찾을 수 없거나 권한이 없습니다."));
        }
        return ResponseEntity.ok(DataVO.ok(res));
    }
}
