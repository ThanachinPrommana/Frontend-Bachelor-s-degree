// src/hooks/useNotifications.js
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchUserNoti,
  fetchUnreadCount,
  removeNotiAll as apiRemoveAll,
  removeNotification as apiRemoveOne,
  markAsRead as apiMarkRead,
} from "@/api/notification";

/**
 * Hook จัดการ Notification ของผู้ใช้
 * - โหลดครั้งแรกอัตโนมัติเมื่อมี userId
 * - มีฟังก์ชัน clearAll / removeOne / markOneRead
 * - คืนค่าทั้ง items, total, loading, error และตัว reload (load)
 */
export function useNotifications(userId) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setErr] = useState(null);

  // โหลดรายการ (รับพารามิเตอร์เสริมได้ เช่น {limit, status, type, page, pageSize})
  const load = useCallback(
    async (params = {}) => {
      if (!userId) return;
      setLoading(true);
      setErr(null);
      try {
        const { notifications, total } = await fetchUserNoti(userId, params);
        setItems(notifications);
        setTotal(total);
      } catch (e) {
        console.error("[useNotifications] load error:", e);
        setErr(e);
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  // โหลดจำนวนยังไม่อ่านทั้งหมด
  const loadUnreadCount = useCallback(async () => {
    if (!userId) return;
    try {
      const count = await fetchUnreadCount(userId);
      setUnread(count);
    } catch (e) {
      // ไม่ต้อง fail ทั้งหน้า
    }
  }, [userId]);

  // ลบทั้งหมด
  const clearAll = useCallback(async () => {
    await apiRemoveAll();
    // รีโหลดผลลัพธ์
    await Promise.all([load(), loadUnreadCount()]);
  }, [load, loadUnreadCount]);

  // ลบทีละอัน
  const removeOne = useCallback(
    async (notiId) => {
      await apiRemoveOne(notiId);
      // อัปเดต state ทันทีให้ UI ไหลลื่น แล้ว sync ด้วย load อีกที
      setItems((prev) => prev.filter((n) => n.id !== notiId));
      setTotal((t) => Math.max(0, t - 1));
      await loadUnreadCount();
    },
    [loadUnreadCount]
  );

  // ทำเครื่องหมายว่าอ่านแล้ว
  const markOneRead = useCallback(
    async (notiId) => {
      try {
        await apiMarkRead(notiId);
        setItems((prev) =>
          prev.map((n) =>
            n.id === notiId ? { ...n, status: "READ", readAt: new Date().toISOString() } : n
          )
        );
        await loadUnreadCount();
      } catch (e) {
        console.error("[useNotifications] markOneRead error:", e);
      }
    },
    [loadUnreadCount]
  );

  // โหลดครั้งแรกเมื่อ userId พร้อม
  useEffect(() => {
    if (!userId) return;
    load();           // ดึงทั้งหมด (ตาม default ของ BE)
    loadUnreadCount();
  }, [userId, load, loadUnreadCount]);

  // info ที่อนุพันธ์ (ถ้าจะใช้)
  const info = useMemo(
    () => ({ total, unread, read: Math.max(0, total - unread) }),
    [total, unread]
  );

  return {
    items,
    total,
    unreadInfo: info, // { total, unread, read }
    loading,
    error: error,
    load,
    clearAll,
    removeOne,
    markOneRead,
  };
}
