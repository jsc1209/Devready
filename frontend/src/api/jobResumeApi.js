import gatewayAxios from "./gatewayAxios";

// 이력서를 공고에 바인딩(+학력/자격/자소서 materialize) → { jobResumeId }
// 면접 시작 시점에 호출, 반환된 jobResumeId 를 면접 세션 저장(슬라이스4)이 사용한다.
export async function bindJobResume({ resumeId, jobPostingId, versionId }) {
  const res = await gatewayAxios.post("/api/job-resumes", {
    resumeId,
    jobPostingId,
    ...(versionId ? { versionId } : {}),
  });
  return res?.data?.data; // { jobResumeId }
}
