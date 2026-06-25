import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 120000, // AI 추론 지연 대비 (Budget Forcing 최악 ~90s)
  headers: { 'Content-Type': 'application/json' },
})

export default axiosInstance
