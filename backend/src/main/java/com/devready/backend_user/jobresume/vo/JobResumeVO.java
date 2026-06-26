package com.devready.backend_user.jobresume.vo;

import lombok.Getter;
import lombok.Setter;

/** job_resume 행(공고별 이력서). 이력서를 공고에 바인딩한 단위. */
@Getter
@Setter
public class JobResumeVO {
    private Long jobResumeId;
    private Long resumeId;
    private Long jobPostingId;
    private String pdfPath;
    private String createdAt;
    private String updatedAt;
}
