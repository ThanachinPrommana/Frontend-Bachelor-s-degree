// src/api/user.js
// ✅ ใช้ร่วมกับ authconfig.js ที่ตั้ง baseURL = import.meta.env.VITE_API_URL + "/api"
// และเปิด withCredentials เพื่อส่ง session cookie ไปกับทุก request

import { apiClient } from "./authconfig";

/* ===========================
   🧍 Buyer (ผู้ซื้อทั่วไป)
   =========================== */

// ดึงข้อมูลโปรไฟล์ Buyer ตาม ID
// → GET /api/user/profile/:id
export const getBuyer = async (id) => {
  const { data } = await apiClient.get(
    `/user/profile/${encodeURIComponent(id)}`,
    { withCredentials: true }
  );
  return data;
};

// อัปเดตโปรไฟล์ Buyer/User ปกติ
// ✅ Backend ใช้ route: PATCH /api/profile
export const updateProfile = async (payload) => {
  const { data } = await apiClient.patch(`/profile`, payload, {
    withCredentials: true,
  });
  return data;
};

// alias เผื่อโค้ดเก่าเรียก (คงไว้ไม่พัง)
export const updateprofile = updateProfile;

/* ===========================
   🧾 Seller (ผู้ขาย)
   =========================== */

// ดึงข้อมูลโปรไฟล์ Seller ตาม ID
// → GET /api/seller/profile/:id
export const getSeller = async (id) => {
  const { data } = await apiClient.get(
    `/seller/profile/${encodeURIComponent(id)}`,
    { withCredentials: true }
  );
  return data;
};

// อัปเดตโปรไฟล์ Seller (รวมข้อมูลผู้ใช้ + ผู้ขาย)
// → PATCH /api/seller/profile
export const updateSeller = async (payload) => {
  const { data } = await apiClient.patch(`/seller/profile`, payload, {
    withCredentials: true,
  });
  return data;
};

/* ===========================
   🖼️ อัปโหลดรูปโปรไฟล์
   =========================== */

// ✅ Backend ใช้: POST /api/image (ไม่ใช่ /user/image)
// src/api/user.js

export const updateImage = async (input, onUploadProgress) => {
  // สร้าง FormData ให้แน่ใจว่ามี key = 'image' ตามที่ backend รับผ่าน multer.single('image')
  let formData;

  if (input instanceof FormData) {
    formData = input;
  } else {
    formData = new FormData();

    // รองรับหลายเคสจาก component อัปโหลด
    if (input?.file instanceof File) {
      formData.append("image", input.file, input.file.name || "avatar.jpg");
    } else if (input instanceof File || input instanceof Blob) {
      formData.append("image", input, "avatar.jpg");
    } else if (Array.isArray(input?.files) && input.files[0]) {
      formData.append(
        "image",
        input.files[0],
        input.files[0].name || "avatar.jpg"
      );
    } else if (input?.url) {
      // ถ้าคอมโพเนนต์ส่งมาเป็น URL (อัปโหลดไปที่อื่นแล้ว) ให้ fallback ไปอัปเดตโปรไฟล์
      const { data } = await apiClient.patch(
        `/profile`,
        { image: input.url },
        { withCredentials: true }
      );
      return data;
    } else {
      // ไม่มีไฟล์จริง → จะโดน 400 ที่เซิร์ฟเวอร์แน่ ๆ
      throw new Error("No file provided for upload");
    }
  }

  // ส่ง multipart/form-data ไปที่ /api/image
  const { data } = await apiClient.post(`/image`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    withCredentials: true,
    onUploadProgress,
  });
  return data;
};

/* ===========================
   🔍 ฟิลเตอร์โพสต์สำหรับ Seller
   =========================== */

// → POST /api/search/filters/seller
export const searchFilter = async (payload) => {
  const { data } = await apiClient.post(`/search/filters/seller`, payload, {
    withCredentials: true,
  });
  return data;
};
/* ===========================
   👤 โปรไฟล์รวม (ใช้ในหน้าต่างๆ)
   =========================== */
// → GET /api/profiles/user  (ดึง deposits/bookings/mySlots ของตัวเองจาก session cookie)
export const getProfile = async () => {
  const { data } = await apiClient.get(`/profiles/user`, {
    withCredentials: true,
  });
  return data;
};

/* ===========================
   🗓️ Slots (Seller)
   =========================== */
// → POST /api/seller/slot  (สร้าง DateTimeSlot)
export const createSlot = async (payload) => {
  // ตรวจสอบว่า payload มี date และ timeSlots ก่อนส่ง (Optional)
  if (!payload.date || !Array.isArray(payload.timeSlots) || payload.timeSlots.length === 0) {
    throw new Error("Invalid payload: Missing date or timeslots array.");
  }

  // (แก้ไข) ส่ง payload ทั้ง object ไปเป็น request body
  const { data } = await apiClient.post(
    `/seller/slot`,
    payload, // <-- ส่ง payload ที่รับมา
    { withCredentials: true } // ถ้า session/cookie จำเป็น
  );
  return data;
};

// → POST /api/search/slot/seller  (ค้นหา Slot + pagination/filters)
export const searchSellerSlots = async (filters) => {
  // filters: { postId, dateFrom, dateTo, status, page, pageSize }
  const { data } = await apiClient.post(`/search/slot/seller`, filters, {
    withCredentials: true,
  });
  return data;
};

/* ===========================
   📄 Booking / Slip (Seller)
   =========================== */
// → POST /api/confirmed-slip/:bookingId  (ยืนยันสลิปของลูกค้า)
export const confirmSlip = async (bookingId, body = { approve: true }) => {
  const { data } = await apiClient.post(
    `/confirmed-slip/${encodeURIComponent(bookingId)}`,
    body,
    { withCredentials: true }
  );
  return data;
};
