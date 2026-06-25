# test-demo-UI → frontend (JS + MUI) 변환 계획서

> 원본 `test-demo-UI`(React18 + TS + Tailwind/shadcn, Figma Make 프로토타입)의 화면들을
> `devready-demo/frontend`(React19 + MUI v9 + JS) 컨벤션으로 옮기기 위한 변환 계획.
> 본 문서는 조사 결과 기반 계획서이며, 변환 코드는 포함하지 않는다.

## 0. 가장 중요한 발견 (난이도 판단의 핵심)

- **모든 화면이 shadcn/ui 프리미티브를 0개 사용한다.** 원본에 48개 shadcn 프리미티브(`components/ui/`)가 있지만, 실제 화면들은 전부 **raw `<div>/<button>/<input>/<select>/<textarea>` + Tailwind 유틸 클래스**로 직접 만들었다. → **radix 동작 재현 부담이 사실상 없음**(전 화면 `radix=low`).
- 따라서 변환은 "radix 컴포넌트 동작 재현"이 아니라 **(1) Tailwind 클래스 → MUI `sx`/컴포넌트 재스타일링 + (2) TS 제거 + (3) 상태 로직 그대로 이식** 작업이다.
- **난이도를 결정하는 진짜 요인**: ① 라인 수, ② 상태머신 복잡도(다단계 위저드/실시간), ③ 무거운 라이브러리(recharts·jspdf·브라우저 미디어 API).
- 이미 완료: **랜딩(`/`)**, **공통 레이아웃**(Header / AnnouncementBanner / Layout).

---

## 1. 화면별 분석 표

| 화면 (경로) | 파일·라인 | shadcn | 연동 | 무거운 라이브러리 | 기존 대응 | 난이도 | 비고 |
|---|---|---|---|---|---|:---:|---|
| 면접 소개 (`/interview`) | InterviewLanding · 323 | 없음 | 정적 | — | 없음 | **하** | 비주얼 랜딩, 내비만. `AIRecommendCard` 사용 |
| 면접 기록 (`/history`) | HistoryPage · 144 | 없음 | AI | — | 없음 | **하** | 검색+필터칩+그리드, 단순 |
| 세션 상세 (`/history/:id`) | SessionDetail · 34 | 없음 | 정적 | — | 없음 | **하** | `InterviewReport`를 감싸는 34줄 래퍼 → 리포트 변환에 종속 |
| 회원가입 (`/signup`) | SignupPage · 292 | 없음 | 백엔드 | — | **있음**(우리 /signup) | 중 | 4단계 위저드+약관+이메일코드(목업). 우리 버전 이미 동작 |
| 공고 목록 (`/jobs`) | JobsPage · 343 | 없음 | 백엔드 | — | 없음 | 중 | 다축 필터+찜+`JOBS_DATA` export. `AIRecommendCard` 사용 |
| 공고 상세 (`/jobs/:id`) | JobDetailPage · 375 | 없음 | 백엔드 | — | 없음 | 중 | 2탭+사이드바+자체 막대차트. `JobsPage`의 JOBS_DATA·`ApplicationForm` 의존 |
| 교육 센터 (`/education`) | EducationPage · 479 | 없음 | AI | — | 없음 | 중 | AI 퀴즈 상태머신(3종). `AIRecommendCard`·`useAuthGuard` 의존 |
| 코딩테스트 (`/education/coding-test`) | CodingTestPage · 565 | 없음 | AI | — | 없음 | 중 | LeetCode식 분할 에디터(textarea+Tab 들여쓰기)·콘솔 |
| 캘린더 (`/calendar`) | CalendarPage · 501 | 없음 | 백엔드 | — | 없음 | 중 | 수제 월 그리드+D-day, 공고/교육 2모드 |
| 결제 (`/interview/payment`) | InterviewPayment · 305 | 없음 | 백엔드 | — | 없음 | 중 | 카드번호 포매터·결제수단 분기·검증 |
| 면접 설정 (`/interview/setup`) | InterviewSetup · 434 | 없음 | AI | — | 없음 | 중 | 5단계 위저드, 동의 토글, 장치체크 목업 |
| 커뮤니티 (`/community`) | CommunityPage · 431 | 없음 | 백엔드 | — | 없음 | 중 | 질문/자유 탭, 목록↔상세, 글·댓글 CRUD, 좋아요 |
| 로그인 (`/auth`) | AuthPage · 490 | 없음 | 백엔드 | — | **있음**(우리 /login) | **상** | 4모드(로그인/아이디찾기/비번재설정/FaceID)·다단계·코드인증 훅. 우리 /login 이미 동작 |
| 강의 상세 (`/education/course/:id`) | CourseDetailPage · 576 | 없음 | AI | — | 없음 | **상** | localStorage 진행률·챕터 Set·퀴즈 3종·모달 |
| 면접 진행 (`/interview/session`) | InterviewSession · 786 | 없음 | AI | (브라우저 미디어 API) | 없음 | **상** | getUserMedia·Web Speech STT·AudioContext·타이머·웨이브폼. 20+ useState/9 ref |
| 면접 리포트 (`/interview/report/:id`) | InterviewReport · 755 | 없음 | AI | **recharts, jspdf** | 없음 | **상** | Radar+Bar 차트, jsPDF 리포트 생성, 설문 모달 |
| 이력서 (`/resume`) | ResumePage · 972 | 없음 | AI | **jspdf** | 있음*(우리 /resume) | **상** | 6섹션 동적폼·다중이력서·버전관리·한글 PDF·AI 패널. *우리 건 "분석형"으로 성격 다름 |
| 마이페이지 (`/mypage`) | MyPage · 980 | 없음 | 백엔드 | **recharts** | 있음*(우리 /me) | **상** | 7탭·차트2·모달2·집계로직. *우리 /me는 단순 |
| 관리자 (`/admin`) | AdminPage · 1950 | 없음 | 백엔드 | **recharts** | 없음 | **상** | 10개 섹션·차트6·CRUD/필터/모달 대량. **분할 필수** |

> 공유 의존: `AIRecommendCard`(교육/공고/면접 3곳), `ApplicationForm`(공고상세), `ChatbotWidget`(전역).

---

## 2. 난이도 버킷

- **하 (3)**: InterviewLanding, HistoryPage, SessionDetail*  (*SessionDetail은 InterviewReport에 종속)
- **중 (9)**: SignupPage, JobsPage, JobDetailPage, EducationPage, CodingTestPage, CalendarPage, InterviewPayment, InterviewSetup, CommunityPage
- **상 (7)**: AuthPage, CourseDetailPage, InterviewSession, InterviewReport, ResumePage, MyPage, AdminPage

---

## 3. 권장 변환 우선순위 (단계별 + 근거)

### Phase 0 — 공유 컴포넌트 선(先)공통화
| 순서 | 대상 | 근거(한 줄) |
|---|---|---|
| 0-1 | **AIRecommendCard** (하) | 교육·공고·면접 **3개 화면이 공유** → 먼저 만들면 뒤 화면들이 바로 가져다 씀 |
| 0-2 | **ApplicationForm** (하) | 공고상세가 쓰는 지원 모달 → MUI `Dialog`로 먼저 만들어 두면 공고 플로우가 막힘 없음 |

### Phase 1 — 퀵윈으로 패턴·레이아웃 정착
| 순서 | 대상 | 근거 |
|---|---|---|
| 1-1 | **InterviewLanding** (하) | 정적·내비만 → MUI 변환 패턴(섹션 컴포넌트화·sx) 정착용 |
| 1-2 | **HistoryPage** (하) | 144줄 단순 목록 → 필터칩·그리드 패턴 확립 |

### Phase 2 — 공고 플로우(응집)
| 순서 | 대상 | 근거 |
|---|---|---|
| 2-1 | **JobsPage** (중) | `JOBS_DATA`를 export → 상세가 이 목업을 import. 데이터는 `data/`로 분리 |
| 2-2 | **JobDetailPage** (중) | JobsPage 데이터 + (Phase0) ApplicationForm 의존 → 둘 준비 후 진행 |

### Phase 3 — 교육 플로우
| 순서 | 대상 | 근거 |
|---|---|---|
| 3-1 | **EducationPage** (중) | AIRecommendCard(0-1) 선행 필요. 퀴즈 상태머신 |
| 3-2 | **CodingTestPage** (중) | 에디터/콘솔 독립 — 교육 묶음으로 함께 |
| 3-3 | **CourseDetailPage** (상) | 진행률·퀴즈·모달 많음 → 교육 묶음의 마지막 |

### Phase 4 — 단독 중간 난이도
| 순서 | 대상 | 근거 |
|---|---|---|
| 4-1 | **CommunityPage** (중) | 목록↔상세·CRUD·모달, 독립적 |
| 4-2 | **CalendarPage** (중) | 수제 월 그리드 로직 — 랜딩 MiniCalendar 패턴 재활용 가능 |

### Phase 5 — 면접 플로우(가벼운 것부터, 미디어는 최후)
| 순서 | 대상 | 근거 |
|---|---|---|
| 5-1 | **InterviewSetup** (중) | 5단계 위저드(Signup 위저드 패턴 재활용) |
| 5-2 | **InterviewPayment** (중) | 결제 폼·검증, 독립 |
| 5-3 | **InterviewReport** (상) | recharts+jsPDF 도입 지점. 차트·PDF 유틸 분리 |
| 5-4 | **SessionDetail** (하) | 5-3 직후 — 리포트를 감싸는 래퍼라 리포트 변환에 종속 |
| 5-5 | **InterviewSession** (상) | **가장 마지막** — getUserMedia/STT/AudioContext 미디어 API. 별도 hook(useCamera/useSTT/useAudioMeter)으로 격리. (박서진 영역과 겹침) |

### Phase 6 — 대형 화면(분할 이식)
| 순서 | 대상 | 근거 |
|---|---|---|
| 6-1 | **MyPage** (상, 980) | 7탭 → 탭별 서브뷰 분할 |
| 6-2 | **AdminPage** (상, 1950) | 10섹션 → 섹션별 분할, 여러 PR로 (아래 4장) |

### 별도 트랙 — 인증(후순위)
- **AuthPage(`/auth`) · SignupPage(`/signup`)**: 우리 frontend에 **이미 동작하는 `/login`·`/signup`이 존재**. 원본 AuthPage는 4모드로 훨씬 풍부하지만, 기능상 로그인은 이미 됨 → **재변환은 후순위**. 필요 시 "아이디 찾기/비번 재설정" 등 모드만 점진 보강. (백엔드 AU-001~007, 김진희 영역과 연계)
- ⚠️ 결정 필요: 우리 `/signup`을 원본 4단계 위저드로 **교체**할지 / 현행 유지할지 → 팀 확인.

> **순서 한 줄 요약**: 공유부품 먼저 → 퀵윈으로 패턴 정착 → 응집된 플로우(공고→교육→면접) 단위로 → 미디어/대형/관리자는 마지막. 종속(상세는 목록, SessionDetail은 Report, 화면들은 AIRecommendCard)을 거꾸로 밟지 않도록 정렬.

---

## 4. 주의(대형·복잡) 화면 분할 전략

### AdminPage — 1,950줄, 10개 섹션 ★최대 난관
- **단일 파일 금지.** `pages/admin/AdminPage.jsx`(레이아웃+탭) + `components/admin/` 아래 섹션별 컴포넌트로 분할:
  대시보드 / 회원관리 / 공고관리 / 게시판 / 알고리즘 / 챗봇 / 공지·FAQ / 알림 / 만족도 / 관리자권한 (10개).
- **PR 분할**: 1 PR = 1~2 섹션. CLAUDE.md 규칙(대형 컴포넌트는 섹션 단위)과 일치.
- recharts 차트 6종(Line/Bar/Radar/Responsive)은 섹션과 함께 점진 이식.
- 목업: 대부분 인라인 const + `data/notices`. 변환 시 `data/adminMock.js`로 분리.

### MyPage — 980줄, 7탭
- `pages/MyPage.jsx`(탭 셸) + 탭별 서브뷰 7개(프로필/이력서이력/면접이력/지원이력/학습/결제/…)로 분할.
- recharts(Line/Radar) 2개. 집계 로직(평균/취약항목/등급)은 util로 분리.
- 우리 `/me`는 단순 → 사실상 신규 대규모 이식(라우트는 `/me` 또는 `/mypage` 정리 필요).

### ResumePage — 972줄
- 6섹션 동적 폼 / 다중 이력서 탭 / 버전 저장·복원 / 3종 모달 / **jsPDF 한글 PDF** / AI 자동완성 패널.
- 섹션 폼 컴포넌트 + `usePdfExport`(jsPDF) util + AI 패널 분리. 우리 `/resume`(분석형)과 **성격 다름** → 통합/공존 방침 결정 필요.

### InterviewSession — 786줄
- 브라우저 미디어 API가 핵심 → `useCamera`/`useSTT`/`useAudioMeter`/`useInterviewTimer` 등 **hook으로 격리**.
- 미디어·STT는 박서진(영상/음성) 영역과 겹침 → 담당 확인 후 진행.

### InterviewReport — 755줄
- recharts(Radar+Bar) + jsPDF 생성기(`downloadPDF`)를 각각 컴포넌트/util로 분리.

---

## 5. 공통화 후보 (먼저 만들지 메모)

| 컴포넌트 | 라인 | 소비처 | 선공통화? | MUI 변환 메모 |
|---|---|---|:---:|---|
| **AIRecommendCard** | 107 | 교육·공고·면접 **3곳** | **예(우선)** | 네이티브 `<select>` → MUI `TextField select`/`Select`. variant prop 유지. 난이도 하 |
| **ApplicationForm** | 150 | 공고상세 1곳 | **예(공고 플로우 전)** | 풀스크린 모달 → MUI `Dialog`. props 그대로(질문 배열·onSubmit). 난이도 하 |
| **ChatbotWidget** | 520 | Root(전역) | 후순위/선택 | 전역 FAB 위젯·멀티뷰·이력. 화면 변환을 막지 않으므로 **후속 단계**(필요 시 Layout에 추가). 난이도 상 |

---

## 6. 라이브러리·연동 메모

- **추가 필요 라이브러리(해당 화면 변환 시점에 설치)**:
  - `recharts` — InterviewReport, MyPage, AdminPage. (React19 호환, 차트 코드 보존 위해 **유지** 권장. MUI X-Charts 재작성은 비용 큼.)
  - `jspdf` — ResumePage, InterviewReport. (프레임워크 무관 → 그대로 유지.)
  - motion/react-dnd/embla 등은 **이 화면들에서 미사용**(분석 확인) → 도입 불필요.
- **연동(미래 와이어링) 분류** — 원본은 전부 목업(실제 호출 0). 변환 시에도 우선 목업 유지, 백엔드/AI 준비되면 연결:
  - **백엔드(Spring)**: AuthPage, SignupPage, JobsPage, JobDetailPage, CalendarPage, InterviewPayment, CommunityPage, MyPage, AdminPage → `authAxios` 인스턴스.
  - **AI 서버**: EducationPage, CourseDetailPage, CodingTestPage, ResumePage, InterviewSetup, InterviewSession, InterviewReport, HistoryPage → `axiosInstance`(120s).
  - **정적**: InterviewLanding, SessionDetail.
- 데이터: 화면 인라인 const는 변환 시 `src/data/<feature>Mock.js`로 분리(랜딩에서 확립한 패턴).

---

## 7. 진행 현황

- ✅ 완료: 랜딩(`/`), 공통 레이아웃(Header·AnnouncementBanner·Layout), MUI 테마(primary #6C63FF).
- ⏭ 다음 권장: **Phase 0(AIRecommendCard·ApplicationForm) → Phase 1(InterviewLanding·HistoryPage)**.

*(본 계획서는 조사 시점 기준. 화면별 상세는 변환 착수 시 해당 원본 파일을 재확인한다.)*
