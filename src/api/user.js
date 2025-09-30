// src/api/user.js
// แนะนำให้ตั้งใน authconfig.js แบบนี้:
// export const apiClient = axios.create({
//   baseURL: import.meta.env.VITE_API_URL + "/api",
//   withCredentials: true, // ให้ cookie session ติดไปด้วย
// });

import { apiClient } from "./authconfig";

// ===== Buyer =====
export const getBuyer = async (id) => {
  const { data } = await apiClient.get(`/profile/${encodeURIComponent(id)}`);
  return data;
};

// ===== Seller =====
export const getSeller = async (id) => {
  const { data } = await apiClient.get(
    `/seller/profile/${encodeURIComponent(id)}`
  );
  return data;
};

// อัปเดตโปรไฟล์ "ผู้ขาย" (รวม User + Buyer + Seller)
// → PATCH /api/seller/profile
export const updateSeller = async (payload) => {
  const { data } = await apiClient.patch(`/seller/profile`, payload);
  return data;
};

// อัปเดตโปรไฟล์ "ผู้ใช้/ผู้ซื้อ"
// → PATCH /api/profile
export const updateProfile = async (payload) => {
  const { data } = await apiClient.patch(`/profile`, payload);
  return data;
};
// alias เดิม (กันโค้ดเก่าเรียก)
export const updateprofile = updateProfile;

// อัปโหลดรูปโปรไฟล์ (multipart/form-data)
// → POST /api/image
export const updateImage = async (formData, onUploadProgress) => {
  const { data } = await apiClient.post("/image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress, // <— ใช้จาก component
    withCredentials: true,
  });
  return data;
};

// ฟิลเตอร์/ค้นหาสำหรับ Seller
// → POST /api/search/filters/seller
export const searchFilter = async (payload) => {
  const { data } = await apiClient.post(`/search/filters/seller`, payload);
  return data;
};
