// src/components/Notification/BellMenu.jsx
import { useEffect, useRef, useState, useMemo } from "react";
import {
  Bell,
  Loader2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Info,
  CreditCard,
  ClipboardList,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications"; // ✅ ใช้ hook ใหม่

function getProfilePath(userType) {
  if (userType === "Buyer") return "/buyer/profile?tab=notifications";
  if (userType === "Seller") return "/seller/profile?tab=notifications";
  return "/login";
}

const TYPE_META = {
  post: {
    icon: FileText,
    badge: "bg-sky-100 text-sky-700 border border-sky-200",
    leftBar: "bg-sky-500",
  },
  deposit: {
    icon: CreditCard,
    badge: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    leftBar: "bg-emerald-500",
  },
  document: {
    icon: ClipboardList,
    badge: "bg-violet-100 text-violet-700 border border-violet-200",
    leftBar: "bg-violet-500",
  },
  system: {
    icon: Info,
    badge: "bg-gray-100 text-gray-700 border border-gray-200",
    leftBar: "bg-gray-500",
  },
  success: {
    icon: CheckCircle2,
    badge: "bg-green-100 text-green-700 border border-green-200",
    leftBar: "bg-green-500",
  },
  warning: {
    icon: AlertTriangle,
    badge: "bg-amber-100 text-amber-800 border border-amber-200",
    leftBar: "bg-amber-500",
  },
  general: {
    icon: Bell,
    badge: "bg-slate-100 text-slate-700 border border-slate-200",
    leftBar: "bg-slate-500",
  },
};

export default function BellMenu() {
  const { authUser } = useAuth();
  const userId = authUser?.userId || authUser?.id || null;

  // ✅ อ่าน unreadCount จากคุกกี้ได้ทันที + sync จาก BE โดย hook
  const { items, unreadCount, loading, refresh } = useNotifications(userId);

  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const profileHref = getProfilePath(
    authUser?.userType || localStorage.getItem("userType")
  );

  // เปิดเมนูเมื่อไหร่ให้ refresh ล่าสุด (ดึงจริงจาก BE)
  const toggle = async () => {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen) {
      await refresh();
    }
  };

  // ปิดเมื่อคลิกนอก
  useEffect(() => {
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // อัปเดต badge เป็นระยะ + เมื่อกลับมาโฟกัสแท็บ
  useEffect(() => {
    if (!userId) return;
    const onVis = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVis);
    const t = setInterval(refresh, 90_000);
    refresh(); // โหลดครั้งแรก

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      clearInterval(t);
    };
  }, [userId, refresh]);

  // แสดงแค่ 5 อันล่าสุดในเมนู (UI เดิมใช้ limit=5)
  const latest5 = useMemo(() => items.slice(0, 5), [items]);

  // map meta สำหรับเรนเดอร์
  const normalized = useMemo(
    () =>
      latest5.map((n) => {
        const t = (n.type || "general").toLowerCase();
        const meta = TYPE_META[t] || TYPE_META.general;
        return { ...n, _meta: meta, _typeKey: t };
      }),
    [latest5]
  );

  if (!authUser) return null;

  return (
    <div className="relative z-50" ref={menuRef}>
      <button
        onClick={toggle}
        className="relative inline-flex items-center justify-center p-2 rounded-full hover:bg-white/10 transition"
        aria-label="notifications"
        title="การแจ้งเตือน"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center pointer-events-none shadow">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <Card className="absolute right-0 mt-2 w-[22rem] rounded-2xl shadow-2xl border bg-white/95 backdrop-blur z-[60]">
          {/* Header */}
          <div className="px-4 py-2.5 rounded-t-2xl bg-gradient-to-r from-slate-50 to-white border-b flex items-center justify-between">
            <div className="font-semibold">การแจ้งเตือน</div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setOpen(false);
                navigate(profileHref);
              }}
            >
              ดูทั้งหมด
            </Button>
          </div>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-3 flex items-center gap-2 text-sm text-slate-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                กำลังโหลด…
              </div>
            ) : normalized.length === 0 ? (
              <div className="p-3 text-sm text-slate-600">
                ยังไม่มีการแจ้งเตือน
              </div>
            ) : (
              <ul className="max-h-[360px] overflow-auto py-1">
                {normalized.map((n, idx) => {
                  const Icon = n._meta.icon;
                  return (
                    <li
                      key={n.id}
                      onClick={() => {
                        setOpen(false);
                        if (n.targetUrl) navigate(n.targetUrl);
                        else navigate(profileHref);
                      }}
                      className={`group mx-2 rounded-xl border bg-white hover:bg-slate-50 hover:shadow transition cursor-pointer relative ${
                        idx === 0 ? "mt-1 mb-1" : "my-1"
                      }`}
                    >
                      {/* แถบสีซ้ายตามประเภท */}
                      <div
                        className={`absolute left-0 top-0 h-full w-1.5 rounded-l-xl ${n._meta.leftBar}`}
                      />
                      <div className="px-3 py-2 pl-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0">
                            <Icon className="w-4.5 h-4.5 opacity-80" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-sm line-clamp-1">
                                {n.title}
                              </div>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full ${n._meta.badge}`}
                              >
                                {n._typeKey}
                              </span>
                              {(n.status ?? "UNREAD") === "UNREAD" && (
                                <span className="ml-auto inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
                              )}
                            </div>
                            <div className="text-slate-600 text-xs line-clamp-2">
                              {n.message}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {new Date(n.createdAt).toLocaleString("th-TH")}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
