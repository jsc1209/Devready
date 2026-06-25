import authAxios from "./authAxios";
export async function signup(email, password) {
  const res = await authAxios.post("/api/auth/signup", { email, password });
  return res.data; // {success, message, data}
}
export async function login(email, password) {
  const res = await authAxios.post("/api/auth/login", { email, password });
  return res.data;
}
