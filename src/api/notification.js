// src/api/notification.js
import { apiClient } from "@/api/authconfig";

/**
 * ดึงรายการแจ้งเตือนของผู้ใช้
 * รองรับ query: limit, status, type, page, pageSize
 * @returns {Promise<{notifications: Array, total: number}>}
 */
export const fetchUserNoti = async (
  userId,
  { limit, status, type, page, pageSize } = {}
) => {
  const params = {};
  if (limit != null) params.limit = limit;
  if (status) params.status = status;
  if (type) params.type = type;
  if (page != null) params.page = page;
  if (pageSize != null) params.pageSize = pageSize;

  const { data } = await apiClient.get(`/user/notification/${userId}`, { params });

  // รองรับทั้ง {notifications,total} และ array แบบเก่า
  const list = Array.isArray(data) ? data : data?.notifications ?? [];
  const total =
    typeof data?.total === "number"
      ? data.total
      : Array.isArray(data)
      ? data.length
      : list.length;

  // ✅ normalize ฟิลด์ให้เป็น lower-case เสมอ
  const notifications = list.map((n) => ({
    id: n.id,
    userId: n.userId,
    title: n.title ?? n.Title ?? "แจ้งเตือน",
    message: n.message ?? n.Message ?? "",
    type: n.type ?? "general",
    status: n.status ?? n.Status ?? "UNREAD",
    targetUrl: n.targetUrl ?? null,
    relatedProcess: n.relatedProcess ?? null,
    createdAt: n.createdAt ?? n.date ?? new Date().toISOString(),
    readAt: n.readAt ?? null,
  }));

  return { notifications, total };
};

/** นับจำนวนยังไม่อ่านทั้งหมด (ใช้ total จาก BE ถ้ามี) */
export const fetchUnreadCount = async (userId) => {
  const { data } = await apiClient.get(`/user/notification/${userId}`, {
    params: { status: "UNREAD", limit: 1 },
  });
  if (Array.isArray(data)) return data.length; // fallback เก่า
  return typeof data?.total === "number"
    ? data.total
    : data?.notifications?.length ?? 0;
};

/** ทำเครื่องหมายว่าอ่านแล้ว */
export const markAsRead = async (notiId) => {
  const { data } = await apiClient.patch(`/user/notification/${notiId}/read`);
  return data;
};

/** ลบแจ้งเตือน 1 อัน */
export const removeNotification = async (notiId) => {
  const { data } = await apiClient.delete(`/user/remove/noti/${notiId}`);
  return data;
};

/** ลบแจ้งเตือนทั้งหมดของผู้ใช้ที่ล็อกอินอยู่ */
export const removeNotiAll = async () => {
  const { data } = await apiClient.delete(`/user/removeAll/noti`);
  return data;
};

/* ===== backward-compatible aliases (กันของเดิมพัง) ===== */
export const clearAllNoti = removeNotiAll;
export const removeNoti = removeNotification;
export const markRead = markAsRead;
