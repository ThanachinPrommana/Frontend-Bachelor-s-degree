// src/api/authconfig.js
import axios from "axios";

// อ่านค่า base URL จาก .env (VITE_API_BASE_URL) ถ้าไม่มีใช้ localhost
const API_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ||
  "http://localhost:8200/api";

// ✅ instance กลาง ใช้ทุกที่ใน frontend
export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // แนบ cookie (เช่น connect.sid)
});

// ✅ ถ้า payload เป็น FormData ให้ลบ Content-Type ออก เพื่อให้เบราว์เซอร์ตั้ง boundary ให้เอง
apiClient.interceptors.request.use((config) => {
  const isFormData =
    typeof FormData !== "undefined" && config.data instanceof FormData;

  if (isFormData) {
    // ลบ header ที่อาจเคยถูกตั้งมา (รวมถึงของ axios เอง)
    if (config.headers) {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    }
    // ปล่อยให้เบราว์เซอร์ตั้งให้เอง
    return config;
  }

  // สำหรับ request ปกติที่เป็น JSON ค่อยตั้ง JSON header แบบเฉพาะ request
  if (config.headers && !config.headers["Content-Type"]) {
    config.headers["Content-Type"] = "application/json";
  }
  return config;
});

// (Option) Interceptor สำหรับ response error
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      console.warn("Session expired or unauthorized");
      // ตัวเลือก: redirect ไป login ก็ได้
      // window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);
