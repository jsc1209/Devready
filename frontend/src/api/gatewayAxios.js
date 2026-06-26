import axios from "axios";

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

export default gatewayAxios;
