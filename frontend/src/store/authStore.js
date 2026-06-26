import { create } from "zustand";
const TOKEN_KEY = "devready_token";
const USER_KEY = "devready_user";
// 변환 화면들의 실행 가드(EducationPage/Interview/Jobs 등)가 읽는 mock 플래그.
// 실제 JWT 로그인 상태를 이 플래그와 동기화(브리지)해 가드를 통과시킨다.
const AUTHED_FLAG_KEY = "devready_authed";
const useAuthStore = create((set) => ({
  token: localStorage.getItem(TOKEN_KEY) || null,
  user: JSON.parse(localStorage.getItem(USER_KEY) || "null"),
  setAuth: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(AUTHED_FLAG_KEY, "1"); // ← 가드 브리지
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(AUTHED_FLAG_KEY); // ← 가드 브리지 해제
    set({ token: null, user: null });
  },
}));
export default useAuthStore;
