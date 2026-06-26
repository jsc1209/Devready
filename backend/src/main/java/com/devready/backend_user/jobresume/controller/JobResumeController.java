package com.devready.backend_user.jobresume.controller;

import com.devready.backend_user.common.jwt.LoginMember;
import com.devready.backend_user.common.vo.DataVO;
import com.devready.backend_user.jobresume.service.JobResumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * job_resume 바인딩 API(/api/job-resumes). 본인 이력서를 공고에 묶고 학력/자격/자소서 materialize.
 * 모든 작업 @LoginMember 기준, 비로그인 401. 소유/공고 검증 실패는 400(GlobalExceptionHandler).
 */
@RestController
@RequestMapping("/api/job-resumes")
@RequiredArgsConstructor
public class JobResumeController {

    private final JobResumeService jobResumeService;

    /** 바인딩: { resumeId(또는 resume_id), jobPostingId(또는 job_posting_id), versionId? } → { jobResumeId } */
    @PostMapping
    public ResponseEntity<DataVO> bind(@LoginMember Long memberId,
                                       @RequestBody Map<String, Object> body) {
        if (memberId == null) {
            return ResponseEntity.status(401).body(DataVO.fail("로그인이 필요합니다."));
        }
        Long resumeId = toLong(firstNonNull(body.get("resumeId"), body.get("resume_id")));
        Long jobPostingId = toLong(firstNonNull(body.get("jobPostingId"), body.get("job_posting_id")));
        Long versionId = toLong(firstNonNull(body.get("versionId"), body.get("version_id")));
        if (resumeId == null || jobPostingId == null) {
            return ResponseEntity.status(400).body(DataVO.fail("resumeId, jobPostingId 가 필요합니다."));
        }
        Long jobResumeId = jobResumeService.bind(memberId, resumeId, jobPostingId, versionId);
        return ResponseEntity.ok(DataVO.ok("바인딩되었습니다.", Map.of("jobResumeId", jobResumeId)));
    }

    /** 내 job_resume 목록(지원내역 후보). */
    @GetMapping
    public ResponseEntity<DataVO> myJobResumes(@LoginMember Long memberId) {
        if (memberId == null) {
            return ResponseEntity.status(401).body(DataVO.fail("로그인이 필요합니다."));
        }
        return ResponseEntity.ok(DataVO.ok(jobResumeService.findMyJobResumes(memberId)));
    }

    private Object firstNonNull(Object a, Object b) {
        return a != null ? a : b;
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
