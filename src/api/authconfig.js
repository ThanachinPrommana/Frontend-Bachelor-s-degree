// src/api/authconfig.js
import axios from "axios";

// อ่านค่า base URL จาก .env (VITE_API_BASE_URL) ถ้าไม่มีใช้ localhost
const API_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ||
  "http://localhost:8200/api";

// ✅ instance กลาง ใช้ทุกที่ใน frontend
export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // ✅ สำคัญมาก: ให้ browser แนบ cookie (เช่น connect.sid)
  headers: {
    "Content-Type": "application/json",
  },
});

// (Option) Interceptor สำหรับ response error
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    // ถ้า session หมดอายุ (401) สามารถ handle ที่นี่ได้เลย
    if (err?.response?.status === 401) {
      console.warn("Session expired or unauthorized");
      // ตัวเลือก: clear local state, redirect, etc.
      // window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);
