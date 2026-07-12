// src/hooks/useNotifications.js
import { useEffect, useMemo, useState, useCallback } from "react";
import { apiClient } from "@/api/authconfig";
import { readJSONCookie, writeJSONCookie } from "@/lib/utils"; 

export function useNotifications(userId) {
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1) อ่าน hint จากคุกกี้ให้ UI ตอบสนองไว (badge ฯลฯ)
  useEffect(() => {
    const hint = readJSONCookie("noti_hint");
    if (hint?.unreadCount != null) setUnreadCount(hint.unreadCount);
    if (hint?.lastUpdated) setLastUpdated(hint.lastUpdated);
  }, []);

  // 2) โหลดข้อมูลจริงจาก backend แล้ว sync ค่า + คุกกี้
  const fetchNotis = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/user/notification/${userId}`, { withCredentials: true });
      const list = data?.notifications || data?.data || [];
      setItems(list);
      setUnreadCount(data?.unreadCount ?? 0);
      setLastUpdated(data?.lastUpdated ?? null);

      writeJSONCookie(
        "noti_hint",
        { unreadCount: data?.unreadCount ?? 0, lastUpdated: data?.lastUpdated ?? new Date().toISOString() },
        { sameSite: "Lax", secure: (import.meta.env.MODE === "production") }
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchNotis(); }, [fetchNotis]);

  // 3) Actions
  const markAsRead = useCallback(async (notiId) => {
    await apiClient.patch(`/user/notification/${notiId}/read`, null, { withCredentials: true });
    setItems(prev => prev.map(n => n.id === notiId ? { ...n, status: "READ", readAt: new Date().toISOString() } : n));
    setUnreadCount(prev => {
      const next = Math.max(0, prev - 1);
      writeJSONCookie("noti_hint", { unreadCount: next, lastUpdated: new Date().toISOString() },
        { sameSite: "Lax", secure: (import.meta.env.MODE === "production") });
      return next;
    });
  }, []);

  const removeOne = useCallback(async (notiId) => {
    await apiClient.delete(`/user/remove/noti/${notiId}`, { withCredentials: true });
    setItems(prev => prev.filter(n => n.id !== notiId));
    setUnreadCount(prev => {
      // ถ้าลบอันที่ยังไม่อ่าน ให้ลด count ด้วย
      const removedUnread = items.find(n => n.id === notiId && n.status !== "READ") ? 1 : 0;
      const next = Math.max(0, prev - removedUnread);
      writeJSONCookie("noti_hint", { unreadCount: next, lastUpdated: new Date().toISOString() },
        { sameSite: "Lax", secure: (import.meta.env.MODE === "production") });
      return next;
    });
  }, [items]);

  const removeAll = useCallback(async () => {
    await apiClient.delete(`/user/removeAll/noti`, { withCredentials: true });
    setItems([]);
    setUnreadCount(0);
    writeJSONCookie("noti_hint", { unreadCount: 0, lastUpdated: new Date().toISOString() },
      { sameSite: "Lax", secure: (import.meta.env.MODE === "production") });
  }, []);

  return {
    items, unreadCount, lastUpdated, loading,
    refresh: fetchNotis,
    markAsRead, removeOne, removeAll,
  };
}
