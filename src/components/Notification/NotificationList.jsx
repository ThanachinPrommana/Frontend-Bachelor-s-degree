// src/components/Notification/NotificationList.jsx
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, CheckCheck, ExternalLink } from "lucide-react";

export default function NotificationList({
  items = [],
  loading,
  onClearAll,
  onRemove,
  onMarkRead,
  showTypeBadge = true,
  showLeftColorBar = true,
}) {
  if (loading) {
    return <div className="p-3 text-sm text-slate-600">กำลังโหลด...</div>;
  }

  if (!items || items.length === 0) {
    return (
      <div className="p-3 text-sm text-slate-500">ยังไม่มีการแจ้งเตือน</div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      <div className="flex justify-between items-center px-3 py-2 text-xs text-slate-500">
        <span>ทั้งหมด {items.length} รายการ</span>
        {onClearAll && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1 text-red-500 hover:underline"
          >
            <Trash2 className="w-3 h-3" /> ลบทั้งหมด
          </button>
        )}
      </div>

      <ul className="max-h-[65vh] overflow-y-auto px-1">
        {items.map((n) => {
          const Icon = n._meta?.icon;
          return (
            <li
              key={n.id}
              className="relative my-1 rounded-lg border bg-white hover:bg-slate-50 transition cursor-pointer"
            >
              {showLeftColorBar && (
                <div
                  className={`absolute left-0 top-0 h-full w-1.5 rounded-l-lg ${n._meta?.leftBar}`}
                />
              )}
              <div className="flex items-start gap-2 px-3 py-2">
                {Icon && (
                  <Icon className="w-4 h-4 mt-0.5 text-slate-500 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm line-clamp-1">
                      {n.title}
                    </span>
                    {showTypeBadge && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${n._meta?.badge}`}
                      >
                        {n._typeKey}
                      </span>
                    )}
                    {(n.status ?? "UNREAD") === "UNREAD" && (
                      <span className="ml-auto inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {n.message}
                  </p>
                  <div className="flex items-center justify-between mt-0.5 text-[11px] text-slate-400">
                    <span>{new Date(n.createdAt).toLocaleString("th-TH")}</span>
                    <div className="flex items-center gap-2">
                      {onMarkRead && (
                        <button
                          onClick={() => onMarkRead(n.id)}
                          className="text-slate-400 hover:text-green-600"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onRemove && (
                        <button
                          onClick={() => onRemove(n.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {n.targetUrl && (
                        <a
                          href={n.targetUrl}
                          className="text-slate-400 hover:text-blue-600"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
