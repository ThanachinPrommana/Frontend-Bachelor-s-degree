// ===============================
// File: src/pages/Profile/Seller/SellerSchedule.jsx
// Purpose: Manage seller's DateTimeSlots — filter, list, create (UX ง่ายขึ้น)
// Notes:
// - API createSlot ตอนนี้ต้องใช้ { postId, date: 'YYYY-MM-DD', timeSlots: [{start:'HH:mm', end:'HH:mm'}] }
// - ดึงโพสต์จาก data.user.PropertyPost
// - Calendar + กริดเวลา (step 30 นาที) และคำนวณเวลาสิ้นสุดอัตโนมัติ
// - ปิดเวลาที่ชนกับ slot เดิม (รวมถึงที่ถูกจอง)
// - ค่าใน <SelectItem> เป็น string เสมอ
// - ใช้ 'ALL' เป็น sentinel ในตัวกรอง และไม่ส่งไป backend
// ===============================

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Loader2,
  Calendar as CalendarIcon,
  Clock,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

// ✅ API functions
import {
  createSlot as apiCreateSlot,
  searchSellerSlots as apiSearchSellerSlots,
  getProfile as apiGetProfile,
} from "@/api/user";

const DEFAULT_PAGE_SIZE = 20;

/* ============ Helpers ============ */
const pad2 = (n) => String(n).padStart(2, "0");

function generateTimeOptions(start = "08:00", end = "18:00", stepMin = 30) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const arr = [];
  for (let t = startMin; t <= endMin; t += stepMin) {
    arr.push(`${pad2(Math.floor(t / 60))}:${pad2(t % 60)}`);
  }
  return arr;
}

// (เดิมใช้รวมเป็น ISO แต่ตอนนี้ backend เอา HH:mm เลย)
function isOverlapping(startA, endA, startB, endB) {
  return Math.max(startA, startB) < Math.min(endA, endB);
}

function slotsOfDayForPost(allSlots, postId, ymd) {
  const startOfDay = new Date(ymd + "T00:00:00");
  const endOfDay = new Date(ymd + "T23:59:59");
  return (allSlots || []).filter((s) => {
    if (String(s.postId) !== String(postId)) return false;
    const st = new Date(s.start);
    return st >= startOfDay && st <= endOfDay;
  });
}

/* ============ Hook: ดึงโพสต์ของผู้ขาย ============ */
function useSellerPosts() {
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await apiGetProfile();
        const raw = data?.user?.PropertyPost ?? [];
        const normalized = raw
          .filter((p) => p && (p.id ?? p.postId ?? p._id))
          .map((p) => ({
            id: String(p.id ?? p.postId ?? p._id),
            label:
              p.Property_Name ||
              p.title ||
              `โพสต์ #${p.id ?? p.postId ?? p._id}`,
          }));
        if (!ignore) setPosts(normalized);
      } catch (e) {
        console.error("getProfile failed:", e);
        if (!ignore) setPosts([]);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);
  return { posts };
}

/* ============ Main Component ============ */
export default function SellerSchedule() {
  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [filters, setFilters] = useState({
    postId: "ALL",
    dateFrom: todayISO,
    dateTo: "",
    status: "ALL",
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const [slots, setSlots] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    postId: "",
    start: "",
    end: "",
  });

  // UX ใหม่
  const [selectedDate, setSelectedDate] = useState(""); // 'YYYY-MM-DD'
  const [startTime, setStartTime] = useState(""); // 'HH:mm'
  const [duration, setDuration] = useState(30); // นาที

  const { posts } = useSellerPosts();

  const postMap = useMemo(() => {
    const m = new Map();
    posts.forEach((p) => m.set(p.id, p.label));
    return m;
  }, [posts]);

  function onFilterChange(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  }

  async function fetchSlots() {
    try {
      setLoading(true);
      // ✅ ส่ง postId เป็น string หรือ undefined
      const postIdForApi =
        filters.postId === "ALL" ? undefined : String(filters.postId);
      const res = await apiSearchSellerSlots({
        ...filters,
        postId: postIdForApi,
      });
      setSlots(res?.items || []);
      setTotal(res?.total ?? 0);
    } catch (e) {
      console.error("fetchSlots error:", e?.response?.data || e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.postId,
    filters.dateFrom,
    filters.dateTo,
    filters.status,
    filters.page,
    filters.pageSize,
  ]);

  async function handleCreateSlotButton() {
    if (!createForm.postId || !selectedDate || !startTime) {
      alert("กรอกข้อมูลให้ครบ (โพสต์, วัน, เวลาเริ่ม)");
      return;
    }

    try {
      setCreating(true);

      // ✅ ใช้ postId เป็น string (รองรับ ObjectId)
      const postIdForApi = String(createForm.postId).trim();
      if (!postIdForApi) {
        alert("postId ไม่ถูกต้อง");
        setCreating(false);
        return;
      }

      // คำนวณเวลาสิ้นสุดจาก duration เป็น HH:mm
      const [hh, mm] = startTime.split(":").map(Number);
      const endMins = hh * 60 + mm + duration;
      const endHH = pad2(Math.floor(endMins / 60));
      const endMM = pad2(endMins % 60);
      const endTime = `${endHH}:${endMM}`;

      // ✅ ฟอร์แมตใหม่ตาม backend: { date, timeSlots: [{start,end}] }
      const payload = {
        postId: postIdForApi,
        date: selectedDate, // 'YYYY-MM-DD'
        timeSlots: [
          { start: startTime, end: endTime }, // 'HH:mm'
        ],
      };

      await apiCreateSlot(payload);

      // reset & refresh
      setCreateForm({ postId: "", start: "", end: "" });
      setSelectedDate("");
      setStartTime("");
      setDuration(30);
      await fetchSlots();
      alert("✅ สร้างนัดสำเร็จ!");
    } catch (e) {
      console.error("createSlot error:", e?.response?.data || e);
      alert(e?.response?.data?.message || "❌ สร้างนัดไม่สำเร็จ");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-4 grid gap-3 md:grid-cols-5">
          <div className="md:col-span-2">
            <label className="text-sm">ประกาศ (โพสต์)</label>
            <Select
              value={filters.postId}
              onValueChange={(v) => onFilterChange("postId", v)}
              disabled={!posts.length}
            >
              <SelectTrigger className="mt-1">
                <SelectValue
                  placeholder={posts.length ? "เลือกโพสต์" : "ไม่มีโพสต์"}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทั้งหมด</SelectItem>
                {posts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm">จากวันที่</label>
            <Input
              type="date"
              className="mt-1"
              value={filters.dateFrom}
              onChange={(e) => onFilterChange("dateFrom", e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm">ถึงวันที่</label>
            <Input
              type="date"
              className="mt-1"
              value={filters.dateTo}
              onChange={(e) => onFilterChange("dateTo", e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm">สถานะ</label>
            <Select
              value={filters.status}
              onValueChange={(v) => onFilterChange("status", v)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทั้งหมด</SelectItem>
                <SelectItem value="AVAILABLE">ว่าง</SelectItem>
                <SelectItem value="BOOKED">ถูกจอง</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button className="w-full" onClick={fetchSlots}>
              <Search className="w-4 h-4 mr-2" /> ค้นหา
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Create Slot */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold">สร้างนัดใหม่</h3>

          <div className="grid gap-3 md:grid-cols-4">
            {/* โพสต์ */}
            <div>
              <label className="text-sm">ประกาศ</label>
              <Select
                value={createForm.postId}
                onValueChange={(v) =>
                  setCreateForm((s) => ({ ...s, postId: v }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="เลือกโพสต์" />
                </SelectTrigger>
                <SelectContent>
                  {posts.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* วัน */}
            <div>
              <label className="text-sm">วันนัด</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full mt-1 justify-start"
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {selectedDate || "เลือกวันที่"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate ? new Date(selectedDate) : undefined}
                    onSelect={(d) => {
                      if (d) {
                        const y = d.getFullYear();
                        const m = pad2(d.getMonth() + 1);
                        const dd = pad2(d.getDate());
                        setSelectedDate(`${y}-${m}-${dd}`);
                        setStartTime("");
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* ระยะเวลา */}
            <div>
              <label className="text-sm">ระยะเวลา</label>
              <Select
                value={String(duration)}
                onValueChange={(v) => setDuration(Number(v))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 นาที</SelectItem>
                  <SelectItem value="60">60 นาที</SelectItem>
                  <SelectItem value="90">90 นาที</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* เวลาเริ่ม */}
            <div>
              <label className="text-sm">เวลาเริ่ม</label>
              <div className="mt-1 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <div className="text-sm">{startTime || "-"}</div>
              </div>
            </div>
          </div>

          {/* กริดเวลา */}
          <TimeGridPicker
            selectedDate={selectedDate}
            postId={createForm.postId}
            duration={duration}
            allSlots={slots}
            onPick={(t) => setStartTime(t)}
          />

          {/* End time preview */}
          <div className="text-sm text-muted-foreground">
            {selectedDate && startTime
              ? (() => {
                  const [hh, mm] = startTime.split(":").map(Number);
                  const startM = hh * 60 + mm;
                  const endM = startM + duration;
                  return `สิ้นสุดประมาณ ${pad2(Math.floor(endM / 60))}:${pad2(
                    endM % 60
                  )} น.`;
                })()
              : "เลือกเวลาเริ่มเพื่อคำนวณเวลาสิ้นสุดอัตโนมัติ"}
          </div>

          <div className="flex items-end">
            <Button
              className="w-full md:w-auto"
              onClick={handleCreateSlotButton}
              disabled={creating}
            >
              {creating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              สร้างนัด
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ตาราง */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-2">โพสต์</th>
                <th className="text-left px-4 py-2">เริ่ม</th>
                <th className="text-left px-4 py-2">สิ้นสุด</th>
                <th className="text-left px-4 py-2">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-6">
                    กำลังโหลด...
                  </td>
                </tr>
              ) : slots.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-6">
                    ไม่พบข้อมูล
                  </td>
                </tr>
              ) : (
                slots.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="px-4 py-2">
                      {postMap.get(String(s.postId)) || s.postId}
                    </td>
                    <td className="px-4 py-2">
                      {new Date(s.start).toLocaleString("th-TH")}
                    </td>
                    <td className="px-4 py-2">
                      {new Date(s.end).toLocaleString("th-TH")}
                    </td>
                    <td className="px-4 py-2">
                      {s.isBooked ? "ถูกจอง" : "ว่าง"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

/* ============ TimeGridPicker ============ */
function TimeGridPicker({ selectedDate, postId, duration, allSlots, onPick }) {
  if (!selectedDate || !postId) {
    return (
      <div className="text-sm text-muted-foreground">
        เลือก “ประกาศ” และ “วันนัด” ก่อน จากนั้นจะมีเวลาขึ้นมาให้เลือก
      </div>
    );
  }

  const options = useMemo(() => generateTimeOptions("08:00", "18:00", 30), []);
  const daySlots = slotsOfDayForPost(allSlots, postId, selectedDate).map(
    (s) => ({
      startMs: new Date(s.start).getTime(),
      endMs: new Date(s.end).getTime(),
      isBooked: !!s.isBooked,
    })
  );

  function isAvailable(timeStr) {
    // ประเมินทับซ้อนจากข้อมูลที่มีอยู่ (ใช้เวลา HH:mm + duration)
    const [hh, mm] = timeStr.split(":").map(Number);
    const startMs = new Date(`${selectedDate}T${timeStr}:00`).getTime();
    const endMins = hh * 60 + mm + duration;
    const endHH = pad2(Math.floor(endMins / 60));
    const endMM = pad2(endMins % 60);
    const endMs = new Date(`${selectedDate}T${endHH}:${endMM}:00`).getTime();

    const hardEnd = new Date(`${selectedDate}T18:00:00`).getTime();
    if (endMs > hardEnd + 60 * 1000) return false;

    for (const s of daySlots) {
      if (isOverlapping(startMs, endMs, s.startMs, s.endMs)) return false;
    }
    return true;
  }

  return (
    <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
      {options.map((t) => {
        const ok = isAvailable(t);
        return (
          <Button
            key={t}
            variant={ok ? "outline" : "secondary"}
            className="justify-center"
            disabled={!ok}
            onClick={() => ok && onPick(t)}
          >
            {t}
          </Button>
        );
      })}
    </div>
  );
}
