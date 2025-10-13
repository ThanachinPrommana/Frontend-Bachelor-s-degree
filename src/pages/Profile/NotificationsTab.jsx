// src/pages/Profile/NotificationsTab.jsx
import {
  useMemo,
  useState,
  useEffect,
  useDeferredValue,
  useCallback,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationFilters from "@/components/Notification/NotificationFilters";
import NotificationList from "@/components/Notification/NotificationList";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  RotateCcw,
  Info,
  Bell,
  FileText,
  CreditCard,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";

/* สี/ไอคอนสำหรับประเภท (ใช้ร่วมกับ BellMenu) */
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
    icon: Bell,
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

export default function NotificationsTab() {
  const { authUser } = useAuth();
  const { items, loading, removeAll, removeOne, markOneRead, load, error } =
    useNotifications(authUser?.id);

  // ฟิลเตอร์ฝั่ง FE
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("all"); // "all" | "UNREAD" | "READ"
  const [type, setType] = useState("all"); // "all" | <string>

  // ทำให้ input search ไม่บล็อค UI ตอนพิมพ์
  const dKeyword = useDeferredValue(keyword);

  // รองรับเปิดมาที่แท็บนี้ผ่าน query เช่น ?tab=notifications
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "notifications") {
      const el = document.getElementById("notifications-root");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [searchParams]);

  // 1) normalize: ทำครั้งเดียวเมื่อ items เปลี่ยน (ผูก meta + เตรียมสตริงค้นหา)
  const normalized = useMemo(() => {
    const arr = items ?? [];
    if (!arr.length) return [];
    return arr.map((n) => {
      const rawType = n.type ?? "general";
      const tKey = String(rawType).toLowerCase();
      const meta = TYPE_META[tKey] || TYPE_META.general;

      // เตรียมสตริงค้นหา lower-case ไว้เลย เพื่อลดงานเวลาพิมพ์ทุกตัวอักษร
      const searchBlob = `${n.title ?? ""} ${n.message ?? ""}`.toLowerCase();

      // เก็บสำเนาฟิลด์ที่ใช้กรองให้แน่นอน (เลี่ยง undefined)
      const _status = n.status ?? "UNREAD";
      const _type = rawType;

      return {
        ...n,
        _meta: meta,
        _typeKey: tKey,
        _search: searchBlob,
        _status,
        _type,
      };
    });
  }, [items]);

  // 2) filter: ใช้คีย์ที่ normalize แล้ว + keyword ที่ defer แล้ว
  const decorated = useMemo(() => {
    const kw = dKeyword.trim().toLowerCase();
    const needKw = kw !== "";
    const needStat = status !== "all";
    const needType = type !== "all";

    if (!normalized.length) return normalized;

    // กรองแบบ single-pass
    const out = [];
    for (let i = 0; i < normalized.length; i++) {
      const it = normalized[i];
      if (needKw && !it._search.includes(kw)) continue;
      if (needStat && it._status !== status) continue;
      if (needType && it._type !== type) continue;
      out.push(it);
    }
    return out;
  }, [normalized, dKeyword, status, type]);

  // 3) แฮนด์เลอร์คงที่ ลด re-render ของลูก
  const handleClearAll = useCallback(async () => {
    if (!confirm("ต้องการลบการแจ้งเตือนทั้งหมดหรือไม่?")) return;
    await removeAll();
  }, [removeAll]);

  const handleRemove = useCallback((id) => removeOne(id), [removeOne]);
  const handleMarkRead = useCallback((id) => markOneRead(id), [markOneRead]);

  return (
    <div id="notifications-root" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">การแจ้งเตือน</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={load} title="รีเฟรช">
            <RotateCcw className="w-4 h-4 mr-1" />
            รีเฟรช
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="p-3 text-amber-800 text-sm flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <div>โหลดการแจ้งเตือนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง</div>
          </CardContent>
        </Card>
      )}

      <NotificationFilters
        items={items}
        keyword={keyword}
        setKeyword={setKeyword}
        status={status}
        setStatus={setStatus}
        type={type}
        setType={setType}
        onReset={() => {
          setKeyword("");
          setStatus("all");
          setType("all");
        }}
      />

      <Card className="rounded-xl border">
        <div className="max-h-[68vh] overflow-y-auto overscroll-contain pr-1">
          <NotificationList
            items={decorated}
            loading={loading}
            onClearAll={handleClearAll}
            onRemove={handleRemove}
            onMarkRead={handleMarkRead}
            showTypeBadge
            showLeftColorBar
          />
        </div>
      </Card>
    </div>
  );
}
