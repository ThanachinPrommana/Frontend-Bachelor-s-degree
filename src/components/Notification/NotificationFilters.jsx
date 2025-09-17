// src/components/Notification/NotificationFilters.jsx
import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

/**
 * props:
 * - items: Array<Notification> (ใช้เพื่อสร้างรายการ type อัตโนมัติ)
 * - keyword, setKeyword: string, fn
 * - status, setStatus: "all" | "UNREAD" | "READ"
 * - type, setType: "all" | string
 * - onReset: fn
 */
export default function NotificationFilters({
  items = [],
  keyword,
  setKeyword,
  status,
  setStatus,
  type,
  setType,
  onReset,
}) {
  const typeOptions = useMemo(() => {
    const set = new Set((items ?? []).map((i) => i.type ?? "general"));
    return ["all", ...Array.from(set)];
  }, [items]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
      {/* ค้นหา */}
      <div className="md:col-span-5 flex items-center gap-2">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <Input
          value={keyword}
          onChange={(e) => setKeyword?.(e.target.value)}
          placeholder="ค้นหา… (หัวข้อ/ข้อความ)"
          aria-label="ค้นหาการแจ้งเตือน"
        />
      </div>

      {/* สถานะ */}
      <div className="md:col-span-3">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger aria-label="ตัวกรองสถานะ">
            <SelectValue placeholder="สถานะ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทั้งหมด</SelectItem>
            <SelectItem value="UNREAD">ยังไม่อ่าน</SelectItem>
            <SelectItem value="READ">อ่านแล้ว</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ประเภท */}
      <div className="md:col-span-3">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger aria-label="ตัวกรองประเภท">
            <SelectValue placeholder="ประเภท" />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((t) => (
              <SelectItem key={t} value={t}>
                {t === "all" ? "ทุกประเภท" : t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* รีเซ็ต */}
      <div className="md:col-span-1 flex justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={onReset}
          className="w-full md:w-auto"
        >
          <Filter className="w-4 h-4 mr-1" />
          รีเซ็ต
        </Button>
      </div>
    </div>
  );
}
