// src/api/auth.js
import { apiClient } from "./authconfig";

/** =============================
 *  Auth & Session
 * ==============================*/

/** เข้าสู่ระบบ */
export const login = async (payload) => {
  const { data } = await apiClient.post("/login", payload);
  return data;
};
export const Login = login; // alias เดิม

/** ดึงโปรไฟล์ปัจจุบัน (sync session) */
export const getProfile = async () => {
  const { data } = await apiClient.get("/profile");
  return data;
};
export const getprofile = getProfile; // alias เดิม (พิมพ์เล็ก)

/** ออกจากระบบ */
export const logout = async () => {
  const { data } = await apiClient.post("/logout");
  return data;
};
export const logOut = logout; // alias เผื่อบางไฟล์ใช้ O ใหญ่

/** =============================
 *  Register / Verify
 * ==============================*/

/** สมัครเบื้องต้น: ส่งเมลยืนยัน */
export const preRegister = async (payload) => {
  // ✅ backend ปัจจุบันใช้ /preregister (พิมพ์เล็กทั้งหมด)
  const { data } = await apiClient.post("/preregister", payload);
  return data;
};
export const preregister = preRegister; // alias เดิม

/** ยืนยัน + ลงทะเบียนผู้ซื้อ */
export const verifyAndRegister = async (payload) => {
  const { data } = await apiClient.post("/verifyandregister", payload);
  return data;
};
export const verifyandregister = verifyAndRegister; // alias เดิม

/** =============================
 *  Password flows
 * ==============================*/

/** ลืมรหัสผ่าน */
export const forgotPassword = async (payload) => {
  const { data } = await apiClient.post("/forgotpassword", payload);
  return data;
};
export const forgotpassword = forgotPassword; // alias เดิม

/** รีเซ็ตรหัสผ่าน */
export const resetPassword = async (payload) => {
  const { data } = await apiClient.post("/resetpassword", payload);
  return data;
};
export const resetpassword = resetPassword; // alias เดิม

/** =============================
 *  Seller register
 * ==============================*/

/** สมัครเป็น Seller (แนบรูปบัตรประชาชน) */
export const registerSeller = async (formData) => {
  // ✅ backend ปัจจุบันใช้ POST /seller/register
  const { data } = await apiClient.post("/seller/register", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};
// aliases เพิ่มเติมกันพิมพ์สลับเคส
export const RegisterSeller = registerSeller;
export const registerseller = registerSeller;
