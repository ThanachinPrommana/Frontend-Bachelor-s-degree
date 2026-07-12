// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useRef } from "react";
import { apiClient } from "@/api/authconfig";
import { clearJSONCookie } from "@/lib/utils"; // ✅ ลบ noti_hint ตอน logout

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  const revalidateUser = async () => {
    try {
      const res = await apiClient.get("/profiles/user", {
        withCredentials: true,
      });
      const userData = res?.data?.user || null;
      if (!mounted.current) return;
      setAuthUser(userData ? { ...userData } : null);
    } catch (err) {
      if (!mounted.current) return;
      setAuthUser(null);
    }
  };

  useEffect(() => {
    mounted.current = true;
    (async () => {
      await revalidateUser();
      if (mounted.current) setLoading(false);
    })();

    return () => {
      mounted.current = false;
    };
  }, []);

  const logout = async () => {
    try {
      // แจ้งเซิร์ฟเวอร์ปิด session
      await apiClient.post("/logout", null, { withCredentials: true });
    } catch (err) {
      // ถ้าเรียกไม่สำเร็จ เราก็ทำความสะอาดฝั่ง FE ต่อไป
      console.error("Logout failed:", err);
    } finally {
      // ✅ ลบ noti hint cookie ให้ badge หายทันที
      clearJSONCookie("noti_hint");

      // ✅ เคลียร์ของที่เก็บฝั่ง FE (ถ้ามีการใช้อยู่)
      try {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("id");
      } catch {}

      // ✅ เคลียร์สถานะผู้ใช้ในแอป
      if (mounted.current) setAuthUser(null);
    }
  };

  const value = { authUser, loading, logout, revalidateUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
