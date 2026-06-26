package com.devready.backend_user.jobresume.service;

import com.devready.backend_user.jobresume.mapper.JobResumeMapper;
import com.devready.backend_user.jobresume.vo.JobResumeVO;
import com.devready.backend_user.resume.mapper.ResumeMapper;
import com.devready.backend_user.resume.vo.ResumeVO;
import com.devready.backend_user.resume.vo.ResumeVersionVO;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 지원/면접 시작 시점 바인딩: 본인 이력서(활성 버전 스냅샷)를 공고에 묶어 job_resume 를 만들고,
 * 그 시점에 학력/자격증/자소서를 정규화 테이블(academic/certificate/cover_letter_item)로 materialize 한다.
 * 정규화 대상 FK 단위 = job_resume(스키마 확정). 반환값 job_resume.id 는 슬라이스4 면접 세션 FK 가 사용.
 * 모든 동작은 본인 member_id 범위.
 */
@Service
@RequiredArgsConstructor
public class JobResumeService {

    private final JobResumeMapper jobResumeMapper;
    private final ResumeMapper resumeMapper;
    private final ObjectMapper objectMapper;

    private static final Pattern YM = Pattern.compile("(\\d{4})\\.(\\d{1,2})");
    private static final Pattern NUM = Pattern.compile("(\\d+(?:\\.\\d+)?)");

    /**
     * 이력서를 공고에 바인딩 + 학력/자격/자소서 materialize.
     * @param versionId 선택(특정 버전 스냅샷). null 이면 최신 버전 사용.
     * @return 생성된 job_resume_id
     */
    @Transactional
    public Long bind(Long memberId, Long resumeId, Long jobPostingId, Long versionId) {
        ResumeVO resume = resumeMapper.findResumeById(resumeId);
        if (resume == null || !resume.getMemberId().equals(memberId)) {
            throw new IllegalArgumentException("이력서를 찾을 수 없거나 권한이 없습니다.");
        }
        if (jobResumeMapper.countJobPosting(jobPostingId) == 0) {
            throw new IllegalArgumentException("공고를 찾을 수 없습니다.");
        }

        JobResumeVO jr = new JobResumeVO();
        jr.setResumeId(resumeId);
        jr.setJobPostingId(jobPostingId);
        jr.setPdfPath("pending://job-resume/r" + resumeId + "-j" + jobPostingId);  // 파일서버 추후
        jobResumeMapper.insertJobResume(jr);
        Long jobResumeId = jr.getJobResumeId();

        // 활성(또는 지정) 버전 스냅샷에서 정규화 materialize
        List<ResumeVersionVO> versions = resumeMapper.findVersionsByResume(resumeId);
        ResumeVersionVO target = null;
        if (!versions.isEmpty()) {
            if (versionId != null) {
                for (ResumeVersionVO v : versions) {
                    if (versionId.equals(v.getVersionId())) {
                        target = v;
                        break;
                    }
                }
            }
            if (target == null) {
                target = versions.get(versions.size() - 1);  // 최신
            }
        }
        if (target != null) {
            Map<String, Object> snap = parse(target.getSnapshot());
            if (snap != null) {
                materialize(jobResumeId, snap);
            }
        }
        return jobResumeId;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> findMyJobResumes(Long memberId) {
        return jobResumeMapper.findJobResumesByMember(memberId);
    }

    // 스냅샷 JSON → academic / certificate / cover_letter_item INSERT
    private void materialize(Long jobResumeId, Map<String, Object> snap) {
        // 학력
        for (Object o : asList(snap.get("educations"))) {
            Map<String, Object> e = asMap(o);
            if (e == null) continue;
            String school = str(e.get("school"));
            if (school == null || school.isBlank()) continue;
            String[] ag = parsePeriod(str(e.get("period")));
            Map<String, Object> p = new HashMap<>();
            p.put("jobResumeId", jobResumeId);
            p.put("schoolName", trunc(school, 100));
            p.put("major", trunc(orEmpty(str(e.get("major"))), 100));
            p.put("admissionDate", ag[0]);
            p.put("graduationDate", ag[1]);
            p.put("gpa", parseGpa(str(e.get("grade"))));
            jobResumeMapper.insertAcademic(p);
        }
        // 자격증
        for (Object o : asList(snap.get("certifications"))) {
            Map<String, Object> c = asMap(o);
            if (c == null) continue;
            String name = str(c.get("name"));
            if (name == null || name.isBlank()) continue;
            Map<String, Object> p = new HashMap<>();
            p.put("jobResumeId", jobResumeId);
            p.put("certificateName", trunc(name, 100));
            p.put("issuer", trunc(orEmpty(str(c.get("issuer"))), 100));
            p.put("acquiredDate", parseOneDate(str(c.get("date"))));
            jobResumeMapper.insertCertificate(p);
        }
        // 자기소개서(단일 blob → cover_letter_item 1건, template_id 는 활성 템플릿)
        String coverText = str(snap.get("coverText"));
        if (coverText != null && !coverText.isBlank()) {
            Long templateId = jobResumeMapper.findActiveTemplateId();
            if (templateId != null) {
                Map<String, Object> p = new HashMap<>();
                p.put("jobResumeId", jobResumeId);
                p.put("templateId", templateId);
                p.put("itemName", "자기소개서");
                p.put("content", coverText);
                p.put("itemOrder", 1);
                jobResumeMapper.insertCoverLetterItem(p);
            }
        }
    }

    // ───── parsing helpers (원본은 스냅샷에 보존, 정규화는 best-effort) ─────
    private String[] parsePeriod(String period) {
        String adm = null, grad = null;
        if (period != null) {
            Matcher m = YM.matcher(period);
            List<String> ds = new ArrayList<>();
            while (m.find()) ds.add(ym(m));
            if (!ds.isEmpty()) adm = ds.get(0);
            if (ds.size() >= 2) grad = ds.get(1);
        }
        if (adm == null) adm = "2000-01-01";
        if (grad == null) grad = adm;   // 졸업일 미상 → placeholder
        return new String[]{adm, grad};
    }

    private String parseOneDate(String s) {
        if (s != null) {
            Matcher m = YM.matcher(s);
            if (m.find()) return ym(m);
        }
        return "2000-01-01";
    }

    private String ym(Matcher m) {
        int y = Integer.parseInt(m.group(1));
        int mo = Integer.parseInt(m.group(2));
        if (mo < 1) mo = 1;
        if (mo > 12) mo = 12;
        return String.format("%04d-%02d-01", y, mo);
    }

    private double parseGpa(String grade) {
        if (grade != null) {
            Matcher m = NUM.matcher(grade);
            if (m.find()) {
                try {
                    double g = Double.parseDouble(m.group(1));
                    if (g < 0) g = 0;
                    if (g > 9.99) g = 9.99;   // DECIMAL(3,2)
                    return g;
                } catch (NumberFormatException ignored) {
                    // fallthrough
                }
            }
        }
        return 0.0;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> asMap(Object o) {
        return (o instanceof Map) ? (Map<String, Object>) o : null;
    }

    @SuppressWarnings("unchecked")
    private List<Object> asList(Object o) {
        return (o instanceof List) ? (List<Object>) o : List.of();
    }

    private String str(Object o) {
        return o == null ? null : String.valueOf(o);
    }

    private String orEmpty(String s) {
        return s == null ? "" : s;
    }

    private String trunc(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(0, max);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parse(String json) {
        try {
            return objectMapper.readValue(json, Map.class);
        } catch (Exception e) {
            return null;
        }
    }
}
