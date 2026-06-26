import axios from "axios";
import useAuthStore from "../store/authStore";

/**
 * 면접 AI 채점 전용 axios — Spring 게이트웨이(8080) 호출.
 * EXAONE 추론이 ~140초 걸려 timeout 180s 로 둠.
 * (기존 axiosInstance 는 VITE_API_BASE_URL=8000 직접·120s 라 resume 직접호출 보존용 — interview 엔 안 씀.)
 */
const gatewayAxios = axios.create({
  baseURL: import.meta.env.VITE_AUTH_API_BASE_URL || "http://localhost:8080",
  timeout: 180000,
  headers: { "Content-Type": "application/json" },
});

// 영속화 API 요청마다 로그인 JWT 를 Authorization: Bearer 로 첨부한다(백엔드가 member_id 추출).
// 토큰이 없으면(비로그인) 헤더를 붙이지 않아 기존 permitAll·비로그인 흐름을 유지한다.
gatewayAxios.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default gatewayAxios;
