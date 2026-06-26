package com.devready.backend_user.jobresume.mapper;

import com.devready.backend_user.jobresume.vo.JobResumeVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface JobResumeMapper {

    int countJobPosting(@Param("id") Long jobPostingId);
    int insertJobResume(JobResumeVO jobResume);     // keyProperty=jobResumeId

    // 활성 템플릿 1건(없으면 아무 템플릿). cover_letter_item.template_id(NOT NULL FK) 채우기용.
    Long findActiveTemplateId();

    // 스냅샷 → 정규화 materialize (Map 파라미터)
    int insertAcademic(Map<String, Object> param);
    int insertCertificate(Map<String, Object> param);
    int insertCoverLetterItem(Map<String, Object> param);

    // 조회(본인 것만) — 지원내역 후보
    List<Map<String, Object>> findJobResumesByMember(@Param("memberId") Long memberId);
}
