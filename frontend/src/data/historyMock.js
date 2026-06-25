// 면접 기록 mock 데이터 (test-demo-UI/HistoryPage.tsx 의 인라인 mock 분리)
export const ALL_SESSIONS = [
  { id: "1", date: "2026.06.05", type: "기술 면접", job: "프론트엔드", level: "신입", score: 80, grade: "B+", duration: "24분", questions: 5 },
  { id: "2", date: "2026.06.01", type: "인성 면접", job: "프론트엔드", level: "신입", score: 76, grade: "B", duration: "18분", questions: 5 },
  { id: "3", date: "2026.05.25", type: "직무 면접", job: "풀스택", level: "신입", score: 72, grade: "C+", duration: "26분", questions: 10 },
  { id: "4", date: "2026.05.20", type: "기술 면접", job: "백엔드", level: "신입", score: 70, grade: "C+", duration: "22분", questions: 5 },
  { id: "5", date: "2026.05.15", type: "종합 면접", job: "프론트엔드", level: "신입", score: 67, grade: "C", duration: "31분", questions: 10 },
  { id: "6", date: "2026.05.10", type: "기술 면접", job: "프론트엔드", level: "신입", score: 61, grade: "C", duration: "20분", questions: 5 },
];

export const TYPE_OPTIONS = ["전체", "기술 면접", "인성 면접", "직무 면접", "종합 면접"];
