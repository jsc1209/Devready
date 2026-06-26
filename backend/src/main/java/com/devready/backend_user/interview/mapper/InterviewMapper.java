package com.devready.backend_user.interview.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

/**
 * 면접 결과 영속화/조회 매퍼. (AI 프록시 InterviewService 와 무관한 신규.)
 * 모든 INSERT 는 useGeneratedKeys 로 생성 PK 를 파라미터 맵에 돌려준다.
 */
@Mapper
public interface InterviewMapper {

    // 소유 검증: job_resume → resume.member_id
    Long ownerOfJobResume(@Param("id") Long jobResumeId);

    // 저장 (keyProperty 로 생성 PK 회수)
    int insertSession(Map<String, Object> p);       // → sessionId
    int insertQuestion(Map<String, Object> p);      // → questionId
    int insertAnswer(Map<String, Object> p);        // → answerId
    int insertAnswerScore(Map<String, Object> p);
    int insertReport(Map<String, Object> p);

    // 조회 (전부 본인 member 범위)
    List<Map<String, Object>> findSessionsByMember(@Param("memberId") Long memberId);
    Map<String, Object> findSessionForMember(@Param("sessionId") Long sessionId,
                                             @Param("memberId") Long memberId);
    List<Map<String, Object>> findQuestionsWithAnswers(@Param("sessionId") Long sessionId);
    Map<String, Object> findReport(@Param("sessionId") Long sessionId);

    // 집계
    Map<String, Object> statsAxisAverages(@Param("memberId") Long memberId);
    List<Map<String, Object>> statsGrowth(@Param("memberId") Long memberId);
}
