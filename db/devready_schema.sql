-- DevReady 데이터베이스 DDL (MySQL 8)
-- 출처: DB설계서.md 테이블 기술서를 그대로 변환
-- 문자셋 utf8mb4 / 엔진 InnoDB
-- 주의: 개발용. FK 검사를 끈 상태로 생성하므로 순서 무관, 재실행 가능(DROP IF EXISTS).

-- CREATE DATABASE IF NOT EXISTS `devready` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
-- USE `devready`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `member`;
CREATE TABLE `member` (
  `member_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '회원 식별 값',
  `email` VARCHAR(255) NOT NULL COMMENT '이메일',
  `email_verified` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '이메일 인증 여부',
  `password` VARCHAR(255) COMMENT '비밀번호',
  `name` VARCHAR(50) NOT NULL COMMENT '이름',
  `phone` VARCHAR(20) NOT NULL COMMENT '전화번호',
  `nickname` VARCHAR(50) NOT NULL COMMENT '닉네임',
  `last_login_method` VARCHAR(30) NOT NULL COMMENT '최근 로그인 방식',
  `role` VARCHAR(30) NOT NULL DEFAULT 'USER' COMMENT '권한',
  `status` VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' COMMENT '상태',
  `withdrawn_at` DATETIME COMMENT '탈퇴 일시',
  `joined_at` DATE NOT NULL DEFAULT (CURRENT_DATE) COMMENT '가입일',
  `warning_count` INT NOT NULL DEFAULT 0 COMMENT '누적 경고 횟수',
  PRIMARY KEY (`member_id`),
  UNIQUE KEY `uq_member_1` (`email`),
  UNIQUE KEY `uq_member_2` (`nickname`),
  UNIQUE KEY `uq_member_3` (`phone`),
  CONSTRAINT `ck_member_1` CHECK (`last_login_method` IN ('EMAIL','KAKAO','NAVER')),
  CONSTRAINT `ck_member_2` CHECK (`role` IN ('USER','ADMIN')),
  CONSTRAINT `ck_member_3` CHECK (`status` IN ('ACTIVE','DORMANT','WITHDRAWN','SUSPENDED','BANNED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='회원';

DROP TABLE IF EXISTS `member_face`;
CREATE TABLE `member_face` (
  `face_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Face ID 식별 값',
  `member_id` BIGINT NOT NULL COMMENT '회원',
  `face_data` TEXT NOT NULL COMMENT '얼굴 특징 데이터',
  `created_at` DATE NOT NULL DEFAULT (CURRENT_DATE) COMMENT '등록일',
  PRIMARY KEY (`face_id`),
  UNIQUE KEY `uq_member_face_1` (`member_id`),
  CONSTRAINT `fk_member_face_member_id` FOREIGN KEY (`member_id`) REFERENCES `member` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Face ID 등록';

DROP TABLE IF EXISTS `member_sns`;
CREATE TABLE `member_sns` (
  `sns_account_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'SNS 연동 식별 값',
  `member_id` BIGINT NOT NULL COMMENT '회원',
  `provider` VARCHAR(100) NOT NULL COMMENT '제공자',
  `provider_uid` VARCHAR(100) NOT NULL COMMENT '제공자 고유 ID',
  `sns_email` VARCHAR(255) COMMENT '제공자 전달 이메일',
  `verified_at` DATETIME COMMENT '통합 인증 시각',
  `linked_at` DATE NOT NULL DEFAULT (CURRENT_DATE) COMMENT '연동일',
  PRIMARY KEY (`sns_account_id`),
  UNIQUE KEY `uq_member_sns_1` (`member_id`, `provider`),
  UNIQUE KEY `uq_member_sns_2` (`provider`, `provider_uid`),
  CONSTRAINT `fk_member_sns_member_id` FOREIGN KEY (`member_id`) REFERENCES `member` (`member_id`),
  CONSTRAINT `ck_member_sns_1` CHECK (`provider` IN ('KAKAO','NAVER'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='회원 SNS 연동';

DROP TABLE IF EXISTS `subscription`;
CREATE TABLE `subscription` (
  `subscription_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '구독 식별 값',
  `member_id` BIGINT NOT NULL COMMENT '회원',
  `plan_type` VARCHAR(100) NOT NULL COMMENT '플랜 종류',
  `start_date` DATE NOT NULL COMMENT '시작일',
  `end_date` DATE COMMENT '종료일',
  `status` VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' COMMENT '상태',
  PRIMARY KEY (`subscription_id`),
  CONSTRAINT `fk_subscription_member_id` FOREIGN KEY (`member_id`) REFERENCES `member` (`member_id`),
  CONSTRAINT `ck_subscription_1` CHECK (`plan_type` IN ('ONE_TIME','STANDARD','PREMIUM')),
  CONSTRAINT `ck_subscription_2` CHECK (`end_date` >= `start_date`),
  CONSTRAINT `ck_subscription_3` CHECK (`status` IN ('ACTIVE','EXPIRED','CANCELLED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='구독';

DROP TABLE IF EXISTS `payment`;
CREATE TABLE `payment` (
  `payment_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '결제 식별 값',
  `member_id` BIGINT NOT NULL COMMENT '회원',
  `subscription_id` BIGINT NOT NULL COMMENT '구독',
  `amount` DECIMAL(10,2) NOT NULL COMMENT '결제 금액',
  `transaction_no` VARCHAR(100) NOT NULL COMMENT '거래번호',
  `paid_at` DATETIME COMMENT '결제일',
  `status` VARCHAR(30) NOT NULL COMMENT '상태',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '주문일',
  PRIMARY KEY (`payment_id`),
  UNIQUE KEY `uq_payment_1` (`transaction_no`),
  CONSTRAINT `fk_payment_member_id` FOREIGN KEY (`member_id`) REFERENCES `member` (`member_id`),
  CONSTRAINT `fk_payment_subscription_id` FOREIGN KEY (`subscription_id`) REFERENCES `subscription` (`subscription_id`),
  CONSTRAINT `ck_payment_1` CHECK (`amount`>0),
  CONSTRAINT `ck_payment_2` CHECK (`status` IN ('PAID','FAILED','REFUNDED','READY','IN_PROGRESS'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='결제';

DROP TABLE IF EXISTS `terms_agreement`;
CREATE TABLE `terms_agreement` (
  `agreement_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '동의 식별 값',
  `member_id` BIGINT NOT NULL COMMENT '회원',
  `policy_id` BIGINT NOT NULL COMMENT '정책 문서',
  `agreed` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '동의 여부',
  `responded_at` DATETIME NOT NULL COMMENT '응답 일시',
  PRIMARY KEY (`agreement_id`),
  UNIQUE KEY `uq_terms_agreement_1` (`member_id`, `policy_id`),
  CONSTRAINT `fk_terms_agreement_member_id` FOREIGN KEY (`member_id`) REFERENCES `member` (`member_id`),
  CONSTRAINT `fk_terms_agreement_policy_id` FOREIGN KEY (`policy_id`) REFERENCES `policy` (`policy_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='회원 약관 동의 이력';

DROP TABLE IF EXISTS `resume`;
CREATE TABLE `resume` (
  `resume_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '이력서 식별 값',
  `member_id` BIGINT NOT NULL COMMENT '회원',
  `birth_date` DATE COMMENT '생년월일',
  `address` VARCHAR(500) COMMENT '주소',
  `github_url` VARCHAR(500) COMMENT '깃허브 링크',
  `portfolio_url` VARCHAR(500) COMMENT '포트폴리오 링크',
  `is_primary` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '대표 이력서 여부',
  `created_at` DATE NOT NULL DEFAULT (CURRENT_DATE) COMMENT '작성일',
  `updated_at` DATE NOT NULL COMMENT '수정일',
  PRIMARY KEY (`resume_id`),
  CONSTRAINT `fk_resume_member_id` FOREIGN KEY (`member_id`) REFERENCES `member` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='기본 이력서';

DROP TABLE IF EXISTS `job_resume`;
CREATE TABLE `job_resume` (
  `job_resume_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '공고별이력서 식별 값',
  `resume_id` BIGINT NOT NULL COMMENT '기본 이력서',
  `job_posting_id` BIGINT NOT NULL COMMENT '대상 공고',
  `pdf_path` VARCHAR(500) NOT NULL COMMENT 'PDF 경로',
  `created_at` DATE NOT NULL DEFAULT (CURRENT_DATE) COMMENT '작성일',
  `updated_at` DATE NOT NULL COMMENT '수정일',
  PRIMARY KEY (`job_resume_id`),
  CONSTRAINT `fk_job_resume_resume_id` FOREIGN KEY (`resume_id`) REFERENCES `resume` (`resume_id`),
  CONSTRAINT `fk_job_resume_job_posting_id` FOREIGN KEY (`job_posting_id`) REFERENCES `job_posting` (`job_posting_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='공고별 이력서';

DROP TABLE IF EXISTS `academic`;
CREATE TABLE `academic` (
  `academic_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '학력 식별 값',
  `job_resume_id` BIGINT NOT NULL COMMENT '공고별이력서',
  `school_name` VARCHAR(100) NOT NULL COMMENT '학교명',
  `major` VARCHAR(100) NOT NULL COMMENT '학과',
  `admission_date` DATE NOT NULL COMMENT '입학일',
  `graduation_date` DATE NOT NULL COMMENT '졸업일',
  `gpa` DECIMAL(3,2) NOT NULL COMMENT '학점',
  PRIMARY KEY (`academic_id`),
  CONSTRAINT `fk_academic_job_resume_id` FOREIGN KEY (`job_resume_id`) REFERENCES `job_resume` (`job_resume_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='학력';

DROP TABLE IF EXISTS `career`;
CREATE TABLE `career` (
  `career_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '경력 식별 값',
  `resume_id` BIGINT NOT NULL COMMENT '기본이력서',
  `company_name` VARCHAR(100) NOT NULL COMMENT '회사명',
  `job_position` VARCHAR(100) NOT NULL COMMENT '직무',
  `start_date` DATE NOT NULL COMMENT '시작일',
  `end_date` DATE COMMENT '종료일',
  `employment_type` VARCHAR(100) NOT NULL COMMENT '근무 형태',
  `main_duties` VARCHAR(100) NOT NULL COMMENT '주요 업무',
  PRIMARY KEY (`career_id`),
  CONSTRAINT `fk_career_resume_id` FOREIGN KEY (`resume_id`) REFERENCES `resume` (`resume_id`),
  CONSTRAINT `ck_career_1` CHECK (`employment_type` IN ('정규직','계약직','인턴'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='경력';

DROP TABLE IF EXISTS `certificate`;
CREATE TABLE `certificate` (
  `certificate_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '자격증 식별 값',
  `job_resume_id` BIGINT NOT NULL COMMENT '공고별이력서',
  `acquired_date` DATE NOT NULL COMMENT '취득년월',
  `certificate_name` VARCHAR(100) NOT NULL COMMENT '자격증명',
  `issuer` VARCHAR(100) NOT NULL COMMENT '발행기관',
  PRIMARY KEY (`certificate_id`),
  CONSTRAINT `fk_certificate_job_resume_id` FOREIGN KEY (`job_resume_id`) REFERENCES `job_resume` (`job_resume_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='자격증';

DROP TABLE IF EXISTS `resume_skill`;
CREATE TABLE `resume_skill` (
  `resume_skill_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '연결 식별 값',
  `resume_id` BIGINT NOT NULL COMMENT '기본이력서',
  `skill_id` BIGINT NOT NULL COMMENT '스킬',
  PRIMARY KEY (`resume_skill_id`),
  CONSTRAINT `fk_resume_skill_resume_id` FOREIGN KEY (`resume_id`) REFERENCES `resume` (`resume_id`),
  CONSTRAINT `fk_resume_skill_skill_id` FOREIGN KEY (`skill_id`) REFERENCES `skill` (`skill_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='이력서-스킬 연결';

DROP TABLE IF EXISTS `cover_letter_item`;
CREATE TABLE `cover_letter_item` (
  `cover_letter_item_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '항목 식별 값',
  `job_resume_id` BIGINT NOT NULL COMMENT '공고별이력서',
  `template_id` BIGINT NOT NULL COMMENT '템플릿',
  `item_name` VARCHAR(100) NOT NULL COMMENT '항목명',
  `content` TEXT NOT NULL COMMENT '내용',
  `item_order` INT NOT NULL COMMENT '항목 순서',
  PRIMARY KEY (`cover_letter_item_id`),
  CONSTRAINT `fk_cover_letter_item_job_resume_id` FOREIGN KEY (`job_resume_id`) REFERENCES `job_resume` (`job_resume_id`),
  CONSTRAINT `fk_cover_letter_item_template_id` FOREIGN KEY (`template_id`) REFERENCES `cover_letter_template` (`template_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='자기소개서 항목';

DROP TABLE IF EXISTS `cover_letter_template`;
CREATE TABLE `cover_letter_template` (
  `template_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '템플릿 식별 값',
  `item_name` VARCHAR(100) NOT NULL COMMENT '항목명',
  `default_order` INT NOT NULL COMMENT '기본 노출 순서',
  `is_active` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '사용 여부',
  `admin_id` BIGINT NOT NULL COMMENT '등록 관리자',
  PRIMARY KEY (`template_id`),
  CONSTRAINT `fk_cover_letter_template_admin_id` FOREIGN KEY (`admin_id`) REFERENCES `member` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='자기소개서 기본 항목 템플릿 (관리자 관리)';

DROP TABLE IF EXISTS `skill`;
CREATE TABLE `skill` (
  `skill_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '스킬 식별 값',
  `skill_name` VARCHAR(100) NOT NULL COMMENT '스킬명',
  `usage_count` INT NOT NULL DEFAULT 0 COMMENT '사용 횟수',
  PRIMARY KEY (`skill_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='스킬';

DROP TABLE IF EXISTS `interview_session`;
CREATE TABLE `interview_session` (
  `session_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '세션 식별 값',
  `member_id` BIGINT NOT NULL COMMENT '대상 회원',
  `job_resume_id` BIGINT NOT NULL COMMENT '선택 이력서',
  `question_count` INT NOT NULL COMMENT '질문 수',
  `interview_type` VARCHAR(30) NOT NULL COMMENT '면접 유형',
  `interviewer_type` VARCHAR(30) NOT NULL COMMENT '면접관 유형',
  `interviewer_count` INT NOT NULL COMMENT '면접관 수',
  `input_mode` VARCHAR(30) NOT NULL COMMENT '입력 모드',
  `use_video` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '영상 사용 여부',
  `is_completed` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '완료 여부',
  `started_at` DATETIME NOT NULL COMMENT '시작 시각',
  `ended_at` DATETIME COMMENT '종료 시각',
  PRIMARY KEY (`session_id`),
  CONSTRAINT `fk_interview_session_member_id` FOREIGN KEY (`member_id`) REFERENCES `member` (`member_id`),
  CONSTRAINT `fk_interview_session_job_resume_id` FOREIGN KEY (`job_resume_id`) REFERENCES `job_resume` (`job_resume_id`),
  CONSTRAINT `ck_interview_session_1` CHECK (`interview_type` IN ('인성','기술','종합')),
  CONSTRAINT `ck_interview_session_2` CHECK (`interviewer_type` IN ('PRESSURE','FRIENDLY','NORMAL')),
  CONSTRAINT `ck_interview_session_3` CHECK (`input_mode` IN ('TEXT','VOICE'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='모의면접 세션';

DROP TABLE IF EXISTS `question`;
CREATE TABLE `question` (
  `question_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '질문 식별 값',
  `session_id` BIGINT NOT NULL COMMENT '세션',
  `question_text` TEXT NOT NULL COMMENT '질문 텍스트',
  `question_type` VARCHAR(30) NOT NULL COMMENT '질문 유형',
  `source` VARCHAR(30) NOT NULL COMMENT '출처',
  `difficulty` VARCHAR(100) NOT NULL COMMENT '난이도',
  `display_order` INT NOT NULL COMMENT '제시 순서',
  `parent_question_id` BIGINT COMMENT '부모 질문',
  PRIMARY KEY (`question_id`),
  CONSTRAINT `fk_question_session_id` FOREIGN KEY (`session_id`) REFERENCES `interview_session` (`session_id`),
  CONSTRAINT `fk_question_parent_question_id` FOREIGN KEY (`parent_question_id`) REFERENCES `question` (`question_id`),
  CONSTRAINT `ck_question_1` CHECK (`source` IN ('AI','BANK')),
  CONSTRAINT `ck_question_2` CHECK (`difficulty` IN ('하','중','상'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='질문';

DROP TABLE IF EXISTS `interview_report`;
CREATE TABLE `interview_report` (
  `interview_report_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '리포트 식별 값',
  `session_id` BIGINT NOT NULL COMMENT '세션',
  `item_score` DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT '항목별 집계 점수',
  `total_score` DECIMAL(5,2) NOT NULL COMMENT '총점',
  `overall_comment` TEXT NOT NULL COMMENT '총평',
  `strengths` TEXT NOT NULL COMMENT '강점',
  `weaknesses` TEXT NOT NULL COMMENT '약점',
  `good_answer` TEXT NOT NULL COMMENT '잘한_답변',
  `improvement_needed` TEXT NOT NULL COMMENT '개선_필요',
  `model_answer` TEXT NOT NULL COMMENT '모범_답변',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시각',
  PRIMARY KEY (`interview_report_id`),
  CONSTRAINT `fk_interview_report_session_id` FOREIGN KEY (`session_id`) REFERENCES `interview_session` (`session_id`),
  CONSTRAINT `ck_interview_report_1` CHECK (`item_score` BETWEEN 0 AND 100),
  CONSTRAINT `ck_interview_report_2` CHECK (`total_score` BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='종합 리포트';

DROP TABLE IF EXISTS `answer`;
CREATE TABLE `answer` (
  `answer_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '답변 식별 값',
  `question_id` BIGINT NOT NULL COMMENT '질문',
  `answer_text` TEXT NOT NULL COMMENT '답변 텍스트',
  `answer_order` INT NOT NULL COMMENT '답변 순서',
  PRIMARY KEY (`answer_id`),
  CONSTRAINT `fk_answer_question_id` FOREIGN KEY (`question_id`) REFERENCES `question` (`question_id`),
  CONSTRAINT `ck_answer_1` CHECK (`answer_order` BETWEEN 1 AND 10)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='답변 코어';

DROP TABLE IF EXISTS `answer_voice`;
CREATE TABLE `answer_voice` (
  `answer_id` BIGINT NOT NULL COMMENT '답변 식별 값',
  `stt_text` TEXT NOT NULL COMMENT 'STT 텍스트',
  `speech_rate` FLOAT NOT NULL COMMENT '말하기 속도',
  `pause_time` FLOAT NOT NULL COMMENT '공백 시간',
  `pause_count` INT NOT NULL DEFAULT 0 COMMENT '공백 횟수',
  PRIMARY KEY (`answer_id`),
  CONSTRAINT `fk_answer_voice_answer_id` FOREIGN KEY (`answer_id`) REFERENCES `answer` (`answer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='답변 음성';

DROP TABLE IF EXISTS `answer_video`;
CREATE TABLE `answer_video` (
  `answer_id` BIGINT NOT NULL COMMENT '답변 식별',
  `expression_score` TEXT NOT NULL COMMENT '표정 수치',
  `gaze_score` FLOAT NOT NULL COMMENT '시선 수치',
  PRIMARY KEY (`answer_id`),
  CONSTRAINT `fk_answer_video_answer_id` FOREIGN KEY (`answer_id`) REFERENCES `answer` (`answer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='답변 영상';

DROP TABLE IF EXISTS `star_analysis`;
CREATE TABLE `star_analysis` (
  `star_analysis_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'STAR 식별 값',
  `answer_id` BIGINT NOT NULL COMMENT '답변',
  `star_element` VARCHAR(100) NOT NULL COMMENT 'STAR 요소',
  `segment_text` TEXT NOT NULL COMMENT '구간 텍스트',
  `correction_highlight` VARCHAR(100) NOT NULL COMMENT '교정 하이라이트',
  PRIMARY KEY (`star_analysis_id`),
  CONSTRAINT `fk_star_analysis_answer_id` FOREIGN KEY (`answer_id`) REFERENCES `answer` (`answer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='STAR 분석';

DROP TABLE IF EXISTS `answer_score`;
CREATE TABLE `answer_score` (
  `answer_id` BIGINT NOT NULL COMMENT '답변',
  `technical_accuracy_score` DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT '기술정확성 점수',
  `logical_structure_score` DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT '논리구조 점수',
  `specificity_score` DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT '구체성 점수',
  `depth_understanding_score` DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT '심화이해 점수',
  `communication_score` DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT '커뮤니케이션 점수',
  `total_score` DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT '합산 점수',
  `item_feedback` TEXT NOT NULL COMMENT '항목별 피드백',
  PRIMARY KEY (`answer_id`),
  CONSTRAINT `fk_answer_score_answer_id` FOREIGN KEY (`answer_id`) REFERENCES `answer` (`answer_id`),
  CONSTRAINT `ck_answer_score_1` CHECK (`technical_accuracy_score` BETWEEN 0 AND 100),
  CONSTRAINT `ck_answer_score_2` CHECK (`logical_structure_score` BETWEEN 0 AND 100),
  CONSTRAINT `ck_answer_score_3` CHECK (`specificity_score` BETWEEN 0 AND 100),
  CONSTRAINT `ck_answer_score_4` CHECK (`depth_understanding_score` BETWEEN 0 AND 100),
  CONSTRAINT `ck_answer_score_5` CHECK (`communication_score` BETWEEN 0 AND 100),
  CONSTRAINT `ck_answer_score_6` CHECK (`total_score` BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='5항목 채점';

DROP TABLE IF EXISTS `interview_consent`;
CREATE TABLE `interview_consent` (
  `consent_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '동의 식별 값',
  `member_id` BIGINT NOT NULL COMMENT '회원',
  `terms_type` VARCHAR(30) NOT NULL COMMENT '약관 유형',
  `agreed` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '동의 여부',
  `agreed_at` DATETIME NOT NULL COMMENT '동의 일시',
  PRIMARY KEY (`consent_id`),
  CONSTRAINT `fk_interview_consent_member_id` FOREIGN KEY (`member_id`) REFERENCES `member` (`member_id`),
  CONSTRAINT `ck_interview_consent_1` CHECK (`terms_type` IN ('SERVICE','PRIVACY','MARKETING'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='면접 동의 이력';

DROP TABLE IF EXISTS `category`;
CREATE TABLE `category` (
  `category_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '카테고리 코드',
  `category_name` VARCHAR(100) NOT NULL COMMENT '카테고리명',
  PRIMARY KEY (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='카테고리 (마스터)';

DROP TABLE IF EXISTS `career_profile`;
CREATE TABLE `career_profile` (
  `career_profile_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '맞춤 진로 식별 값',
  `member_id` BIGINT NOT NULL COMMENT '회원',
  `target_job_category` VARCHAR(50) NOT NULL COMMENT '희망 직군',
  `experience_level` VARCHAR(30) NOT NULL COMMENT '경력 수준',
  `goal` VARCHAR(200) COMMENT '목표',
  PRIMARY KEY (`career_profile_id`),
  CONSTRAINT `fk_career_profile_member_id` FOREIGN KEY (`member_id`) REFERENCES `member` (`member_id`),
  CONSTRAINT `ck_career_profile_1` CHECK (`experience_level` IN ('신입','경력'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='기본 정보 (맞춤 진로)';

DROP TABLE IF EXISTS `level_test`;
CREATE TABLE `level_test` (
  `level_test_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '레벨테스트 식별 값',
  `member_id` BIGINT NOT NULL COMMENT '대상 회원',
  `career_profile_id` BIGINT NOT NULL COMMENT '기본 정보',
  `job_category_score` INT NOT NULL DEFAULT 0 COMMENT '직군별 측정 점수',
  `grade` VARCHAR(10) NOT NULL COMMENT '등급',
  `taken_at` DATETIME NOT NULL COMMENT '응시 시각',
  PRIMARY KEY (`level_test_id`),
  CONSTRAINT `fk_level_test_member_id` FOREIGN KEY (`member_id`) REFERENCES `member` (`member_id`),
  CONSTRAINT `fk_level_test_career_profile_id` FOREIGN KEY (`career_profile_id`) REFERENCES `career_profile` (`career_profile_id`),
  CONSTRAINT `ck_level_test_1` CHECK (`job_category_score` BETWEEN 0 AND 100),
  CONSTRAINT `ck_level_test_2` CHECK (`grade` IN ('상','중','하'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='레벨 테스트';

DROP TABLE IF EXISTS `course`;
CREATE TABLE `course` (
  `course_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '강의 식별 값',
  `course_name` VARCHAR(100) NOT NULL COMMENT '강의명',
  `category_id` BIGINT NOT NULL COMMENT '카테고리',
  `difficulty` VARCHAR(10) NOT NULL COMMENT '난이도',
  `chapter_count` INT NOT NULL COMMENT '챕터 수',
  `course_description` TEXT NOT NULL COMMENT '강의 설명',
  PRIMARY KEY (`course_id`),
  CONSTRAINT `fk_course_category_id` FOREIGN KEY (`category_id`) REFERENCES `category` (`category_id`),
  CONSTRAINT `ck_course_1` CHECK (`difficulty` IN ('상','중','하'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='강의';

DROP TABLE IF EXISTS `chapter`;
CREATE TABLE `chapter` (
  `chapter_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '챕터 식별 값',
  `course_id` BIGINT NOT NULL COMMENT '강의',
  `chapter_name` VARCHAR(100) NOT NULL COMMENT '챕터명',
  `display_order` INT NOT NULL COMMENT '제시 순서',
  `body` TEXT NOT NULL COMMENT '본문',
  `code_example` TEXT NOT NULL COMMENT '코드 예제',
  PRIMARY KEY (`chapter_id`),
  CONSTRAINT `fk_chapter_course_id` FOREIGN KEY (`course_id`) REFERENCES `course` (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='챕터 (콘텐츠 마스터)';

DROP TABLE IF EXISTS `enrollment`;
CREATE TABLE `enrollment` (
  `enrollment_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '수강 식별 값',
  `member_id` BIGINT NOT NULL COMMENT '대상 회원',
  `course_id` BIGINT NOT NULL COMMENT '강의',
  `enroll_source` VARCHAR(500) NOT NULL COMMENT '등록 경로',
  `start_date` DATE NOT NULL COMMENT '시작일',
  `end_date` DATE COMMENT '종료일',
  `progress_rate` DECIMAL(5,2) NOT NULL COMMENT '진행률',
  `is_completed` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '완료 여부',
  PRIMARY KEY (`enrollment_id`),
  CONSTRAINT `fk_enrollment_member_id` FOREIGN KEY (`member_id`) REFERENCES `member` (`member_id`),
  CONSTRAINT `fk_enrollment_course_id` FOREIGN KEY (`course_id`) REFERENCES `course` (`course_id`),
  CONSTRAINT `ck_enrollment_1` CHECK (`progress_rate` BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='수강';

DROP TABLE IF EXISTS `chapter_progress`;
CREATE TABLE `chapter_progress` (
  `chapter_progress_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '챕터진행 식별 값',
  `enrollment_id` BIGINT NOT NULL COMMENT '수강',
  `chapter_id` BIGINT NOT NULL COMMENT '챕터',
  `is_completed` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '완료 여부',
  `completed_at` DATETIME COMMENT '완료 시각',
  PRIMARY KEY (`chapter_progress_id`),
  UNIQUE KEY `uq_chapter_progress_1` (`chapter_id`),
  UNIQUE KEY `uq_chapter_progress_2` (`enrollment_id`),
  CONSTRAINT `fk_chapter_progress_enrollment_id` FOREIGN KEY (`enrollment_id`) REFERENCES `enrollment` (`enrollment_id`),
  CONSTRAINT `fk_chapter_progress_chapter_id` FOREIGN KEY (`chapter_id`) REFERENCES `chapter` (`chapter_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='챕터 진행 (회원별)';

DROP TABLE IF EXISTS `chapter_quiz`;
CREATE TABLE `chapter_quiz` (
  `chapter_quiz_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '퀴즈 식별 값',
  `chapter_id` BIGINT NOT NULL COMMENT '챕터',
  `problem_type` VARCHAR(30) NOT NULL COMMENT '문제 유형',
  `problem_text` TEXT NOT NULL COMMENT '문제 텍스트',
  `correct_answer` VARCHAR(100) NOT NULL COMMENT '정답',
  PRIMARY KEY (`chapter_quiz_id`),
  CONSTRAINT `fk_chapter_quiz_chapter_id` FOREIGN KEY (`chapter_id`) REFERENCES `chapter` (`chapter_id`),
  CONSTRAINT `ck_chapter_quiz_1` CHECK (`problem_type` IN ('MULTIPLE','OX','SHORT','CODING'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='챕터 퀴즈 (문제 마스터)';

DROP TABLE IF EXISTS `chapter_quiz_option`;
CREATE TABLE `chapter_quiz_option` (
  `option_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '선택지 식별 값',
  `chapter_quiz_id` BIGINT NOT NULL COMMENT '퀴즈 식별 값',
  `option_text` VARCHAR(200) NOT NULL COMMENT '선택지 텍스트',
  `option_order` INT NOT NULL COMMENT '선택지 순서',
  `is_correct` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '정오 여부',
  PRIMARY KEY (`option_id`),
  UNIQUE KEY `uq_chapter_quiz_option_1` (`chapter_quiz_id`),
  UNIQUE KEY `uq_chapter_quiz_option_2` (`option_order`),
  CONSTRAINT `fk_chapter_quiz_option_chapter_quiz_id` FOREIGN KEY (`chapter_quiz_id`) REFERENCES `chapter_quiz` (`chapter_quiz_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='챕터 퀴즈 선택지';

DROP TABLE IF EXISTS `quiz_attempt`;
CREATE TABLE `quiz_attempt` (
  `quiz_attempt_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '응시 식별 값',
  `member_id` BIGINT NOT NULL COMMENT '대상 회원',
  `chapter_quiz_id` BIGINT NOT NULL COMMENT '챕터 퀴즈',
  `submitted_answer` VARCHAR(100) NOT NULL COMMENT '제출 답안',
  `is_correct` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '정오 여부',
  `submitted_at` DATETIME NOT NULL COMMENT '제출 시각',
  PRIMARY KEY (`quiz_attempt_id`),
  CONSTRAINT `fk_quiz_attempt_member_id` FOREIGN KEY (`member_id`) REFERENCES `member` (`member_id`),
  CONSTRAINT `fk_quiz_attempt_chapter_quiz_id` FOREIGN KEY (`chapter_quiz_id`) REFERENCES `chapter_quiz` (`chapter_quiz_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='챕터 퀴즈 응시';

DROP TABLE IF EXISTS `coding_problem`;
CREATE TABLE `coding_problem` (
  `coding_problem_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '문제 식별 값',
  `problem_name` VARCHAR(100) NOT NULL COMMENT '문제명',
  `category_id` BIGINT NOT NULL COMMENT '카테고리',
  `difficulty` VARCHAR(10) NOT NULL COMMENT '난이도',
  `tags` VARCHAR(100) NOT NULL COMMENT '태그',
  `problem_description` TEXT NOT NULL COMMENT '문제 설명·제약조건',
  `example_io` TEXT NOT NULL COMMENT '예시 입출력',
  `correct_rate` DECIMAL(5,2) NOT NULL COMMENT '정답률',
  PRIMARY KEY (`coding_problem_id`),
  CONSTRAINT `fk_coding_problem_category_id` FOREIGN KEY (`category_id`) REFERENCES `category` (`category_id`),
  CONSTRAINT `ck_coding_problem_1` CHECK (`difficulty` IN ('상','중','하')),
  CONSTRAINT `ck_coding_problem_2` CHECK (`correct_rate` BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='코딩테스트 문제';

DROP TABLE IF EXISTS `coding_submission`;
CREATE TABLE `coding_submission` (
  `coding_submission_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '제출 식별 값',
  `member_id` BIGINT NOT NULL COMMENT '대상 회원',
  `coding_problem_id` BIGINT NOT NULL COMMENT '문제',
  `language` VARCHAR(100) NOT NULL COMMENT '사용 언어',
  `submitted_code` TEXT NOT NULL COMMENT '제출 코드',
  `execution_result` TEXT NOT NULL COMMENT '실행 결과',
  `is_passed` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '통과 여부',
  `submitted_at` DATETIME NOT NULL COMMENT '제출 시각',
  PRIMARY KEY (`coding_submission_id`),
  CONSTRAINT `fk_coding_submission_member_id` FOREIGN KEY (`member_id`) REFERENCES `member` (`member_id`),
  CONSTRAINT `fk_coding_submission_coding_problem_id` FOREIGN KEY (`coding_problem_id`) REFERENCES `coding_problem` (`coding_problem_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='코딩테스트 제출';

DROP TABLE IF EXISTS `ai_quiz`;
CREATE TABLE `ai_quiz` (
  `ai_quiz_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'AI퀴즈 식별 값',
  `member_id` BIGINT NOT NULL COMMENT '대상 회원',
  `category_id` BIGINT NOT NULL COMMENT '카테고리',
  `weak_concept_id` BIGINT COMMENT '취약 개념',
  `recommended_topic` VARCHAR(100) NOT NULL COMMENT '추천 주제',
  `problem_type` VARCHAR(30) NOT NULL COMMENT '문제 유형',
  `problem_text` TEXT NOT NULL COMMENT '문제 텍스트',
  `correct_answer` VARCHAR(100) NOT NULL COMMENT '정답',
  `grading_result` VARCHAR(100) NOT NULL COMMENT '채점 결과',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시각',
  `submitted_answer` VARCHAR(200) COMMENT '제출/선택한 답안',
  PRIMARY KEY (`ai_quiz_id`),
  CONSTRAINT `fk_ai_quiz_member_id` FOREIGN KEY (`member_id`) REFERENCES `member` (`member_id`),
  CONSTRAINT `fk_ai_quiz_category_id` FOREIGN KEY (`category_id`) REFERENCES `category` (`category_id`),
  CONSTRAINT `fk_ai_quiz_weak_concept_id` FOREIGN KEY (`weak_concept_id`) REFERENCES `weak_concept` (`weak_concept_id`),
  CONSTRAINT `ck_ai_quiz_1` CHECK (`problem_type` IN ('MULTIPLE','OX','SHORT','CODING'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='AI 추천 퀴즈';

DROP TABLE IF EXISTS `weak_concept`;
CREATE TABLE `weak_concept` (
  `weak_concept_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '취약개념 식별 값',
  `member_id` BIGINT NOT NULL COMMENT '대상 회원',
  `category_id` BIGINT NOT NULL COMMENT '카테고리',
  `concept_name` VARCHAR(100) NOT NULL COMMENT '개념명',
  `wrong_count` INT NOT NULL DEFAULT 0 COMMENT '오답 횟수',
  `recommended_content_id` BIGINT COMMENT '추천 콘텐츠',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '갱신 시각',
  PRIMARY KEY (`weak_concept_id`),
  CONSTRAINT `fk_weak_concept_member_id` FOREIGN KEY (`member_id`) REFERENCES `member` (`member_id`),
  CONSTRAINT `fk_weak_concept_category_id` FOREIGN KEY (`category_id`) REFERENCES `category` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='취약 개념';

DROP TABLE IF EXISTS `study_goal`;
CREATE TABLE `study_goal` (
  `study_goal_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '목표 식별 값',
  `member_id` BIGINT NOT NULL COMMENT '대상 회원',
  `category_id` BIGINT COMMENT '카테고리',
  `week_no` INT NOT NULL COMMENT '주차',
  `goal_item_name` VARCHAR(100) NOT NULL COMMENT '목표 항목명',
  `is_achieved` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '달성 여부',
  `achievement_rate` DECIMAL(5,2) NOT NULL COMMENT '달성률',
  PRIMARY KEY (`study_goal_id`),
  CONSTRAINT `fk_study_goal_member_id` FOREIGN KEY (`member_id`) REFERENCES `member` (`member_id`),
  CONSTRAINT `fk_study_goal_category_id` FOREIGN KEY (`category_id`) REFERENCES `category` (`category_id`),
  CONSTRAINT `ck_study_goal_1` CHECK (`achievement_rate` BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='학습 목표·체크리스트';

DROP TABLE IF EXISTS `study_stat`;
CREATE TABLE `study_stat` (
  `study_stat_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '통계 식별 값',
  `member_id` BIGINT NOT NULL COMMENT '대상 회원',
  `category_id` BIGINT NOT NULL COMMENT '카테고리',
  `base_date` DATE NOT NULL COMMENT '기준 일자',
  `completed_count` INT NOT NULL COMMENT '완료 문항 수',
  `in_progress_course_count` INT NOT NULL COMMENT '진행 강좌 수',
  `total_study_time` INT NOT NULL COMMENT '총 학습 시간',
  `quiz_correct_rate` DECIMAL(5,2) NOT NULL COMMENT '퀴즈 정답률',
  `recorded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '기록 시각',
  PRIMARY KEY (`study_stat_id`),
  UNIQUE KEY `uq_study_stat_1` (`base_date`),
  UNIQUE KEY `uq_study_stat_2` (`category_id`),
  UNIQUE KEY `uq_study_stat_3` (`member_id`),
  CONSTRAINT `fk_study_stat_member_id` FOREIGN KEY (`member_id`) REFERENCES `member` (`member_id`),
  CONSTRAINT `fk_study_stat_category_id` FOREIGN KEY (`category_id`) REFERENCES `category` (`category_id`),
  CONSTRAINT `ck_study_stat_1` CHECK (`quiz_correct_rate` BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='학습 통계 (일별 스냅샷)';

DROP TABLE IF EXISTS `post`;
CREATE TABLE `post` (
  `post_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '게시글 식별 값',
  `author_id` BIGINT NOT NULL COMMENT '작성 회원',
  `board_type` VARCHAR(30) NOT NULL COMMENT '게시판 구분',
  `title` VARCHAR(200) NOT NULL COMMENT '제목',
  `content` TEXT NOT NULL COMMENT '내용',
  `view_count` INT NOT NULL DEFAULT 0 COMMENT '조회 수',
  `status` VARCHAR(30) NOT NULL DEFAULT 'NORMAL' COMMENT '상태',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '작성 시각',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '수정 시각',
  PRIMARY KEY (`post_id`),
  CONSTRAINT `fk_post_author_id` FOREIGN KEY (`author_id`) REFERENCES `member` (`member_id`),
  CONSTRAINT `ck_post_1` CHECK (`board_type` IN ('FREE','QNA','INFO')),
  CONSTRAINT `ck_post_2` CHECK (`status` IN ('NORMAL','HIDDEN','DELETED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='게시글';

DROP TABLE IF EXISTS `comment`;
CREATE TABLE `comment` (
  `comment_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '댓글 식별 값',
  `post_id` BIGINT NOT NULL COMMENT '소속 게시글',
  `author_id` BIGINT NOT NULL COMMENT '작성 회원',
  `parent_comment_id` BIGINT COMMENT '부모 댓글',
  `content` TEXT NOT NULL COMMENT '내용',
  `status` VARCHAR(30) NOT NULL DEFAULT 'NORMAL' COMMENT '상태',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '작성 시각',
  PRIMARY KEY (`comment_id`),
  CONSTRAINT `fk_comment_post_id` FOREIGN KEY (`post_id`) REFERENCES `post` (`post_id`),
  CONSTRAINT `fk_comment_author_id` FOREIGN KEY (`author_id`) REFERENCES `member` (`member_id`),
  CONSTRAINT `fk_comment_parent_comment_id` FOREIGN KEY (`parent_comment_id`) REFERENCES `comment` (`comment_id`),
  CONSTRAINT `ck_comment_1` CHECK (`status` IN ('NORMAL','HIDDEN','DELETED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='댓글';

DROP TABLE IF EXISTS `post_attachment`;
CREATE TABLE `post_attachment` (
  `attachment_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '첨부 식별 값',
  `post_id` BIGINT NOT NULL COMMENT '소속 게시글',
  `file_url` VARCHAR(500) NOT NULL COMMENT '파일 경로/URL',
  `file_type` VARCHAR(30) NOT NULL COMMENT '파일 유형',
  `display_order` INT NOT NULL COMMENT '표시 순서',
  `uploaded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '업로드 시각',
  PRIMARY KEY (`attachment_id`),
  CONSTRAINT `fk_post_attachment_post_id` FOREIGN KEY (`post_id`) REFERENCES `post` (`post_id`),
  CONSTRAINT `ck_post_attachment_1` CHECK (`file_type` IN ('IMAGE','VIDEO','FILE'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='게시글 첨부 (이미지)';

DROP TABLE IF EXISTS `post_like`;
CREATE TABLE `post_like` (
  `post_like_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '좋아요 식별 값',
  `post_id` BIGINT NOT NULL COMMENT '대상 게시글',
  `member_id` BIGINT NOT NULL COMMENT '누른 회원',
  `liked_at` DATETIME NOT NULL COMMENT '누른 시각',
  PRIMARY KEY (`post_like_id`),
  CONSTRAINT `fk_post_like_post_id` FOREIGN KEY (`post_id`) REFERENCES `post` (`post_id`),
  CONSTRAINT `fk_post_like_member_id` FOREIGN KEY (`member_id`) REFERENCES `member` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='게시글 좋아요';

DROP TABLE IF EXISTS `comment_like`;
CREATE TABLE `comment_like` (
  `comment_like_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '좋아요 식별 값',
  `comment_id` BIGINT NOT NULL COMMENT '대상 댓글',
  `member_id` BIGINT NOT NULL COMMENT '누른 회원',
  `liked_at` DATETIME NOT NULL COMMENT '누른 시각',
  PRIMARY KEY (`comment_like_id`),
  CONSTRAINT `fk_comment_like_comment_id` FOREIGN KEY (`comment_id`) REFERENCES `comment` (`comment_id`),
  CONSTRAINT `fk_comment_like_member_id` FOREIGN KEY (`member_id`) REFERENCES `member` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='댓글 좋아요';

DROP TABLE IF EXISTS `tag`;
CREATE TABLE `tag` (
  `tag_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '태그 식별 값',
  `tag_name` VARCHAR(100) NOT NULL COMMENT '태그명',
  PRIMARY KEY (`tag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='태그';

DROP TABLE IF EXISTS `post_tag`;
CREATE TABLE `post_tag` (
  `post_tag_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '연결 식별 값',
  `post_id` BIGINT NOT NULL COMMENT '게시글',
  `tag_id` BIGINT NOT NULL COMMENT '태그',
  PRIMARY KEY (`post_tag_id`),
  CONSTRAINT `fk_post_tag_post_id` FOREIGN KEY (`post_id`) REFERENCES `post` (`post_id`),
  CONSTRAINT `fk_post_tag_tag_id` FOREIGN KEY (`tag_id`) REFERENCES `tag` (`tag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='게시글-태그 연결';

DROP TABLE IF EXISTS `notification`;
CREATE TABLE `notification` (
  `notification_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '알림 식별 값',
  `member_id` BIGINT NOT NULL COMMENT '회원',
  `notification_type` VARCHAR(30) NOT NULL COMMENT '알림 유형',
  `content` TEXT NOT NULL COMMENT '내용',
  `target_type` VARCHAR(30) DEFAULT 0 COMMENT '대상 유형',
  `target_id` BIGINT COMMENT '대상식별값',
  `is_read` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '읽음 여부',
  `sent_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '발송일',
  PRIMARY KEY (`notification_id`),
  CONSTRAINT `fk_notification_member_id` FOREIGN KEY (`member_id`) REFERENCES `member` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='알림';

DROP TABLE IF EXISTS `survey`;
CREATE TABLE `survey` (
  `survey_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '조사 식별 값',
  `member_id` BIGINT NOT NULL COMMENT '회원',
  `session_id` BIGINT NOT NULL COMMENT '트리거 면접',
  `feedback` TEXT NOT NULL COMMENT '의견',
  `created_at` DATE NOT NULL DEFAULT (CURRENT_DATE) COMMENT '등록일',
  PRIMARY KEY (`survey_id`),
  UNIQUE KEY `uq_survey_1` (`member_id`, `session_id`),
  CONSTRAINT `fk_survey_member_id` FOREIGN KEY (`member_id`) REFERENCES `member` (`member_id`),
  CONSTRAINT `fk_survey_session_id` FOREIGN KEY (`session_id`) REFERENCES `interview_session` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='만족도 조사 (5회 면접마다)';

DROP TABLE IF EXISTS `survey_score`;
CREATE TABLE `survey_score` (
  `survey_score_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '점수 식별 값',
  `survey_id` BIGINT NOT NULL COMMENT '조사',
  `category` VARCHAR(30) NOT NULL COMMENT '카테고리',
  `rating` DECIMAL(2,1) NOT NULL COMMENT '별점',
  PRIMARY KEY (`survey_score_id`),
  UNIQUE KEY `uq_survey_score_1` (`survey_id`, `category`),
  CONSTRAINT `fk_survey_score_survey_id` FOREIGN KEY (`survey_id`) REFERENCES `survey` (`survey_id`),
  CONSTRAINT `ck_survey_score_1` CHECK (`category` IN ('QUESTION_FIT','FEEDBACK_ACCURACY','ANALYSIS_ACCURACY','USABILITY','OVERALL')),
  CONSTRAINT `ck_survey_score_2` CHECK (`rating` BETWEEN 0 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='만족도 항목별 별점';

DROP TABLE IF EXISTS `report`;
CREATE TABLE `report` (
  `report_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '신고 식별 값',
  `reporter_id` BIGINT NOT NULL COMMENT '신고자',
  `reported_member_id` BIGINT NOT NULL COMMENT '피신고 회원',
  `target_type` VARCHAR(30) NOT NULL COMMENT '신고 대상 유형',
  `target_id` BIGINT NOT NULL COMMENT '대상 식별 값',
  `report_source` VARCHAR(30) NOT NULL COMMENT '신고 출처',
  `reason_code` VARCHAR(30) NOT NULL COMMENT '신고 사유 코드',
  `reason_detail` TEXT NOT NULL COMMENT '신고 사유 상세',
  `handle_status` VARCHAR(30) NOT NULL DEFAULT 'PENDING' COMMENT '처리 상태',
  `admin_id` BIGINT COMMENT '처리 관리자',
  `action_detail` TEXT COMMENT '조치 내용',
  `handle_reason` TEXT COMMENT '처리 사유',
  `reported_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '신고 시각',
  `handled_at` DATETIME COMMENT '처리 시각',
  PRIMARY KEY (`report_id`),
  CONSTRAINT `fk_report_reporter_id` FOREIGN KEY (`reporter_id`) REFERENCES `member` (`member_id`),
  CONSTRAINT `fk_report_reported_member_id` FOREIGN KEY (`reported_member_id`) REFERENCES `member` (`member_id`),
  CONSTRAINT `fk_report_admin_id` FOREIGN KEY (`admin_id`) REFERENCES `member` (`member_id`),
  CONSTRAINT `ck_report_1` CHECK (`target_type` IN ('POST','COMMENT')),
  CONSTRAINT `ck_report_2` CHECK (`reason_code` IN ('ABUSE','SPAM','OBSCENE','PERSONAL_INFO','IRRELEVANT','ETC')),
  CONSTRAINT `ck_report_3` CHECK (`handle_status` IN ('PENDING','PROCESSING','DONE'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='신고';

DROP TABLE IF EXISTS `sanction`;
CREATE TABLE `sanction` (
  `sanction_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '제재 식별 값',
  `member_id` BIGINT NOT NULL COMMENT '제재대상 회원',
  `report_id` BIGINT COMMENT '근거 신고',
  `filter_log_id` BIGINT COMMENT '근거 필터링 로그',
  `admin_id` BIGINT COMMENT '처리 관리자',
  `sanction_type` VARCHAR(30) NOT NULL COMMENT '제재 유형',
  `sanction_reason` TEXT NOT NULL COMMENT '제재 사유',
  `sanction_start_date` DATE NOT NULL COMMENT '제재 시작일',
  `sanction_end_date` DATE COMMENT '제재 종료일',
  PRIMARY KEY (`sanction_id`),
  CONSTRAINT `fk_sanction_member_id` FOREIGN KEY (`member_id`) REFERENCES `member` (`member_id`),
  CONSTRAINT `fk_sanction_report_id` FOREIGN KEY (`report_id`) REFERENCES `report` (`report_id`),
  CONSTRAINT `fk_sanction_filter_log_id` FOREIGN KEY (`filter_log_id`) REFERENCES `content_filter_log` (`filter_log_id`),
  CONSTRAINT `fk_sanction_admin_id` FOREIGN KEY (`admin_id`) REFERENCES `member` (`member_id`),
  CONSTRAINT `ck_sanction_1` CHECK (`sanction_type` IN ('WARNING','SUSPEND','BAN')),
  CONSTRAINT `ck_sanction_2` CHECK (`sanction_end_date` >= `sanction_start_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='회원 제재';

DROP TABLE IF EXISTS `banned_word`;
CREATE TABLE `banned_word` (
  `banned_word_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '금지어 식별 값',
  `word` VARCHAR(100) NOT NULL COMMENT '금지어',
  `category` VARCHAR(30) NOT NULL COMMENT '분류',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '사용여부',
  `admin_id` BIGINT NOT NULL COMMENT '등록 관리자',
  `created_at` DATE NOT NULL DEFAULT (CURRENT_DATE) COMMENT '등록일',
  PRIMARY KEY (`banned_word_id`),
  UNIQUE KEY `uq_banned_word_1` (`word`),
  CONSTRAINT `fk_banned_word_admin_id` FOREIGN KEY (`admin_id`) REFERENCES `member` (`member_id`),
  CONSTRAINT `ck_banned_word_1` CHECK (`category` IN ('ABUSE','SPAM','OBSCENE','PERSONAL_INFO'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='금지어 사전';

DROP TABLE IF EXISTS `content_filter_log`;
CREATE TABLE `content_filter_log` (
  `filter_log_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '필터 로그 식별 값',
  `target_type` VARCHAR(30) NOT NULL COMMENT '대상 유형',
  `target_id` BIGINT NOT NULL COMMENT '대상 식별 값',
  `filter_type` VARCHAR(30) NOT NULL COMMENT '필터 종류',
  `matched_keyword` VARCHAR(100) COMMENT '매칭 키워드',
  `ai_score` DECIMAL(5,2) COMMENT 'AI 유해점수',
  `action_taken` VARCHAR(30) NOT NULL COMMENT '처리 결과',
  `detected_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '탐지 시각',
  PRIMARY KEY (`filter_log_id`),
  CONSTRAINT `ck_content_filter_log_1` CHECK (`target_type` IN ('POST','COMMENT')),
  CONSTRAINT `ck_content_filter_log_2` CHECK (`filter_type` IN ('KEYWORD','AI')),
  CONSTRAINT `ck_content_filter_log_3` CHECK (`ai_score` BETWEEN 0 AND 100),
  CONSTRAINT `ck_content_filter_log_4` CHECK (`action_taken` IN ('BLOCKED','HIDDEN'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='콘텐츠 필터링 로그';

DROP TABLE IF EXISTS `chat_conversation`;
CREATE TABLE `chat_conversation` (
  `conversation_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '대화 식별 값',
  `member_id` BIGINT NOT NULL COMMENT '대상 회원',
  `title` VARCHAR(200) NOT NULL COMMENT '대화 제목/요약',
  `started_at` DATETIME NOT NULL COMMENT '시작 시각',
  `last_active_at` DATETIME NOT NULL COMMENT '마지막 활동 시각',
  PRIMARY KEY (`conversation_id`),
  CONSTRAINT `fk_chat_conversation_member_id` FOREIGN KEY (`member_id`) REFERENCES `member` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='챗봇 대화';

DROP TABLE IF EXISTS `chat_message`;
CREATE TABLE `chat_message` (
  `message_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '메시지 식별 값',
  `conversation_id` BIGINT NOT NULL COMMENT '소속 대화',
  `sender` VARCHAR(100) NOT NULL COMMENT '발신자',
  `message_content` TEXT NOT NULL COMMENT '메시지 내용',
  `faq_id` BIGINT COMMENT '연계 FAQ',
  `answer_type` VARCHAR(30) NOT NULL COMMENT '답변 방식',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시각',
  PRIMARY KEY (`message_id`),
  CONSTRAINT `fk_chat_message_conversation_id` FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversation` (`conversation_id`),
  CONSTRAINT `fk_chat_message_faq_id` FOREIGN KEY (`faq_id`) REFERENCES `chatbot_faq` (`faq_id`),
  CONSTRAINT `ck_chat_message_1` CHECK (`sender` IN ('USER','BOT')),
  CONSTRAINT `ck_chat_message_2` CHECK (`answer_type` IN ('AI','FIXED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='챗봇 메시지';

DROP TABLE IF EXISTS `chatbot_setting`;
CREATE TABLE `chatbot_setting` (
  `setting_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '설정 식별 값',
  `use_ai` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'AI 사용 여부',
  `fallback_type` VARCHAR(30) NOT NULL COMMENT '폴백 답변 방식',
  `fixed_response` TEXT NOT NULL COMMENT '고정 응답 내용',
  `admin_id` BIGINT NOT NULL COMMENT '수정 관리자',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '수정 시각',
  PRIMARY KEY (`setting_id`),
  CONSTRAINT `fk_chatbot_setting_admin_id` FOREIGN KEY (`admin_id`) REFERENCES `member` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='챗봇 설정 (관리자)';

DROP TABLE IF EXISTS `admin_permission`;
CREATE TABLE `admin_permission` (
  `permission_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '권한 식별 값',
  `admin_id` BIGINT NOT NULL COMMENT '관리자',
  `menu_name` VARCHAR(100) NOT NULL COMMENT '메뉴명',
  `read_permission` VARCHAR(30) NOT NULL COMMENT '조회 권한',
  `write_permission` VARCHAR(30) NOT NULL COMMENT '수정 권한',
  `is_active` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '활성 여부',
  PRIMARY KEY (`permission_id`),
  CONSTRAINT `fk_admin_permission_admin_id` FOREIGN KEY (`admin_id`) REFERENCES `member` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='관리자 권한';

DROP TABLE IF EXISTS `job_posting`;
CREATE TABLE `job_posting` (
  `job_posting_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '공고 식별 값',
  `company_name` VARCHAR(100) NOT NULL COMMENT '기업명',
  `job_category` VARCHAR(100) NOT NULL COMMENT '직군',
  `requirements` TEXT NOT NULL COMMENT '자격요건',
  `preferred_qualifications` TEXT NOT NULL COMMENT '우대사항',
  `deadline` DATE NOT NULL COMMENT '마감일',
  `posting_url` VARCHAR(500) NOT NULL COMMENT '공고 링크',
  `status` VARCHAR(30) NOT NULL DEFAULT 'OPEN' COMMENT '상태',
  `admin_id` BIGINT NOT NULL COMMENT '등록 관리자',
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '삭제 여부',
  `deleted_at` DATETIME COMMENT '삭제 일시',
  `created_at` DATE NOT NULL DEFAULT (CURRENT_DATE) COMMENT '등록일',
  PRIMARY KEY (`job_posting_id`),
  CONSTRAINT `fk_job_posting_admin_id` FOREIGN KEY (`admin_id`) REFERENCES `member` (`member_id`),
  CONSTRAINT `ck_job_posting_1` CHECK (`status` IN ('OPEN','CLOSED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='공고 (관리자 등록·수정·삭제)';

DROP TABLE IF EXISTS `chatbot_faq`;
CREATE TABLE `chatbot_faq` (
  `faq_id` BIGINT AUTO_INCREMENT COMMENT 'FAQ 식별 값',
  `category` VARCHAR(100) NOT NULL COMMENT '분류',
  `question` VARCHAR(255) NOT NULL COMMENT '질문',
  `answer` TEXT NOT NULL COMMENT '답변',
  `admin_id` BIGINT NOT NULL COMMENT '등록 관리자',
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '삭제 여부',
  `deleted_at` DATETIME COMMENT '삭제 일시',
  `created_at` DATE NOT NULL DEFAULT (CURRENT_DATE) COMMENT '등록일',
  PRIMARY KEY (`faq_id`),
  CONSTRAINT `fk_chatbot_faq_admin_id` FOREIGN KEY (`admin_id`) REFERENCES `member` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='챗봇 FAQ';

DROP TABLE IF EXISTS `daily_stat`;
CREATE TABLE `daily_stat` (
  `snapshot_date` BIGINT NOT NULL COMMENT '집계일자',
  `new_signup_count` INT NOT NULL COMMENT '신규 가입자 수',
  `active_member_count` INT NOT NULL COMMENT '활성 회원 수',
  `total_interview_count` INT NOT NULL COMMENT '누적 면접 횟수',
  `total_posting_count` INT NOT NULL COMMENT '누적 공고 수',
  `daily_revenue` BIGINT NOT NULL DEFAULT 0 COMMENT '일일 매출액',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시각',
  PRIMARY KEY (`snapshot_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='통계 일별 스냅샷 (신규 제안)';

DROP TABLE IF EXISTS `popup`;
CREATE TABLE `popup` (
  `popup_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '팝업 식별 값',
  `category` VARCHAR(100) NOT NULL COMMENT '카테고리',
  `title` VARCHAR(200) NOT NULL COMMENT '제목',
  `content` TEXT NOT NULL COMMENT '내용',
  `image_url` VARCHAR(500) NOT NULL COMMENT '이미지 URL',
  `link_url` VARCHAR(500) NOT NULL COMMENT '링크 URL',
  `expose_start_date` DATE NOT NULL COMMENT '노출 시작일',
  `expose_end_date` DATE NOT NULL COMMENT '노출 종료일',
  `is_exposed` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '노출 여부',
  `admin_id` BIGINT NOT NULL COMMENT '등록 관리자',
  `created_at` DATE NOT NULL DEFAULT (CURRENT_DATE) COMMENT '등록일',
  PRIMARY KEY (`popup_id`),
  CONSTRAINT `fk_popup_admin_id` FOREIGN KEY (`admin_id`) REFERENCES `member` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='팝업';

DROP TABLE IF EXISTS `ad_banner`;
CREATE TABLE `ad_banner` (
  `banner_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '배너 식별 값',
  `banner_text` VARCHAR(100) NOT NULL COMMENT '배너 문구',
  `link_url` VARCHAR(500) NOT NULL COMMENT '링크 URL',
  `expose_order` INT NOT NULL COMMENT '노출 순서',
  `expose_start_date` DATE NOT NULL COMMENT '노출 시작일',
  `expose_end_date` DATE NOT NULL COMMENT '노출 종료일',
  `is_exposed` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '노출 여부',
  `admin_id` BIGINT NOT NULL COMMENT '등록 관리자',
  `created_at` DATE NOT NULL DEFAULT (CURRENT_DATE) COMMENT '등록일',
  PRIMARY KEY (`banner_id`),
  CONSTRAINT `fk_ad_banner_admin_id` FOREIGN KEY (`admin_id`) REFERENCES `member` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='상단 광고 배너';

DROP TABLE IF EXISTS `policy`;
CREATE TABLE `policy` (
  `policy_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '정책 식별 값',
  `type` VARCHAR(30) NOT NULL COMMENT '유형',
  `is_required` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '필수 여부',
  `version` VARCHAR(100) NOT NULL COMMENT '버전',
  `body` TEXT NOT NULL COMMENT '본문',
  `effective_date` DATE NOT NULL COMMENT '시행일',
  `admin_id` BIGINT NOT NULL COMMENT '작성 관리자',
  `created_at` DATE NOT NULL DEFAULT (CURRENT_DATE) COMMENT '등록일',
  PRIMARY KEY (`policy_id`),
  CONSTRAINT `fk_policy_admin_id` FOREIGN KEY (`admin_id`) REFERENCES `member` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='정책 문서';

DROP TABLE IF EXISTS `ad_inquiry`;
CREATE TABLE `ad_inquiry` (
  `ad_inquiry_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '문의 식별 값',
  `company_name` VARCHAR(100) NOT NULL COMMENT '문의 기업명',
  `manager_name` VARCHAR(100) NOT NULL COMMENT '담당자명',
  `email` VARCHAR(255) NOT NULL COMMENT '이메일',
  `phone` VARCHAR(20) NOT NULL COMMENT '전화번호',
  `preferred_post_date` DATE NOT NULL COMMENT '희망 게재일',
  `other_inquiry` VARCHAR(100) NOT NULL COMMENT '기타 문의사항',
  `privacy_agreed` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '개인정보 수집 동의 여부',
  `handle_status` VARCHAR(30) NOT NULL COMMENT '처리 상태',
  `admin_id` BIGINT NOT NULL COMMENT '처리 관리자',
  `answer_content` TEXT COMMENT '답변 내용',
  `handled_at` DATETIME COMMENT '처리일시',
  `inquired_at` DATE NOT NULL COMMENT '문의일',
  PRIMARY KEY (`ad_inquiry_id`),
  CONSTRAINT `fk_ad_inquiry_admin_id` FOREIGN KEY (`admin_id`) REFERENCES `member` (`member_id`),
  CONSTRAINT `ck_ad_inquiry_1` CHECK (`handle_status` IN ('PENDING','PROCESSING','DONE'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='광고 문의';

DROP TABLE IF EXISTS `ad_product`;
CREATE TABLE `ad_product` (
  `ad_product_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '상품 식별 값',
  `product_name` VARCHAR(100) NOT NULL COMMENT '상품명',
  PRIMARY KEY (`ad_product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='광고 상품';

DROP TABLE IF EXISTS `ad_inquiry_product`;
CREATE TABLE `ad_inquiry_product` (
  `inquiry_product_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '연결 식별 값',
  `ad_inquiry_id` BIGINT NOT NULL COMMENT '광고 문의',
  `ad_product_id` BIGINT NOT NULL COMMENT '광고 상품',
  PRIMARY KEY (`inquiry_product_id`),
  CONSTRAINT `fk_ad_inquiry_product_ad_inquiry_id` FOREIGN KEY (`ad_inquiry_id`) REFERENCES `ad_inquiry` (`ad_inquiry_id`),
  CONSTRAINT `fk_ad_inquiry_product_ad_product_id` FOREIGN KEY (`ad_product_id`) REFERENCES `ad_product` (`ad_product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='광고문의-상품 연결';

SET FOREIGN_KEY_CHECKS = 1;
