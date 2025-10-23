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
import { useToast } from "@/components/ui/use-toast"; // <-- Import useToast

// ✅ API functions (ตรวจสอบว่า path ถูกต้อง)
import {
  createSlot as apiCreateSlot,
  searchSellerSlots as apiSearchSellerSlots,
  getProfile as apiGetProfile,
} from "@/api/user"; // <-- ตรวจสอบว่า import createSlot ถูกต้อง
import TimeGridPicker from "@/components/TimeGridPicker";

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

function isOverlapping(startA, endA, startB, endB) {
  // Function to check if two time ranges overlap (uses milliseconds)
  return Math.max(startA, startB) < Math.min(endA, endB);
}

function slotsOfDayForPost(allSlots, postId, ymd) {
  // Function to filter slots for a specific post and day
  if (!postId || !ymd) return [];
  const startOfDay = new Date(`${ymd}T00:00:00`).getTime();
  const endOfDay = new Date(`${ymd}T23:59:59`).getTime();
  return (allSlots || []).filter((s) => {
    if (String(s.postId) !== String(postId)) return false;
    const st = new Date(s.startTime || s.start).getTime(); // Handle both property names
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
        const data = await apiGetProfile(); // Should return user profile including PropertyPost
        const raw = data?.user?.PropertyPost ?? [];
        const normalized = raw
          .filter((p) => p && p.id) // Ensure post has an ID
          .map((p) => ({
            id: String(p.id),
            label: p.Property_Name || `โพสต์ #${p.id}`,
          }));
        if (!ignore) setPosts(normalized);
      } catch (e) {
        console.error("getProfile failed in useSellerPosts:", e);
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
  const { toast } = useToast(); // <-- เรียกใช้ useToast
  const today = useMemo(() => new Date(new Date().setHours(0, 0, 0, 0)), []); // Date object for today midnight
  const todayISO = useMemo(() => today.toISOString().slice(0, 10), [today]);

  const [filters, setFilters] = useState({
    postId: "ALL",
    dateFrom: todayISO,
    dateTo: "",
    status: "ALL", // 'ALL', 'AVAILABLE', 'BOOKED'
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const [slots, setSlots] = useState([]); // All fetched slots based on filters
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false); // Loading state for fetching slots

  const [creating, setCreating] = useState(false); // Loading state for creating slot

  // Form state for creating a new slot
  const [createPostId, setCreatePostId] = useState(""); // postId for creation
  const [selectedDate, setSelectedDate] = useState(""); // 'YYYY-MM-DD' for creation
  const [startTime, setStartTime] = useState(""); // 'HH:mm' for creation start
  const [duration, setDuration] = useState(30); // Duration in minutes

  const { posts } = useSellerPosts(); // Fetch seller's posts

  // Map post ID to post label for display in the results table
  const postMap = useMemo(() => {
    const m = new Map();
    posts.forEach((p) => m.set(p.id, p.label));
    return m;
  }, [posts]);

  // Handler for filter changes
  function onFilterChange(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 })); // Reset page on filter change
  }

  // Function to fetch slots based on current filters
  async function fetchSlots() {
    try {
      setLoading(true);
      const params = { ...filters };
      if (params.postId === "ALL") delete params.postId;
      if (params.status === "ALL") delete params.status;
      // Assume apiSearchSellerSlots handles pagination and filtering correctly
      const res = await apiSearchSellerSlots(params);
      setSlots(res?.items || []);
      setTotal(res?.total ?? 0);
    } catch (e) {
      console.error("fetchSlots error:", e?.response?.data || e);
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถโหลดข้อมูลช่วงเวลาได้", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  // Fetch slots when filters change
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

  // Handler for the "Create Slot" button click
  async function handleCreateSlotButton() {
    if (!createPostId || !selectedDate || !startTime) {
      toast({ title: "ข้อมูลไม่ครบ", description: "กรุณาเลือกโพสต์, วันที่, และเวลาเริ่ม", variant: "warning" });
      return;
    }

    try {
      setCreating(true);
      const postIdForApi = String(createPostId).trim();
      if (!postIdForApi) {
        toast({ title: "รหัสโพสต์ไม่ถูกต้อง", variant: "warning" });
        setCreating(false);
        return;
      }

      // Calculate end time
      const [hh, mm] = startTime.split(":").map(Number);
      const endMins = hh * 60 + mm + duration;
      const endHH = pad2(Math.floor(endMins / 60));
      const endMM = pad2(endMins % 60);
      const endTime = `${endHH}:${endMM}`;

      // Prepare payload for the backend
      const payload = {
        postId: postIdForApi,
        date: selectedDate, // 'YYYY-MM-DD'
        timeSlots: [
          { startTime: startTime, endTime: endTime }, // 'HH:mm'
        ],
      };

      console.log("Sending payload:", JSON.stringify(payload, null, 2));
      // Call the API function to create the slot
      const result = await apiCreateSlot(payload);

      // Reset form and refresh the slot list on success
      setCreatePostId("");
      setSelectedDate("");
      setStartTime("");
      setDuration(30);
      await fetchSlots(); // Refresh the list
      toast({ title: "สร้างนัดสำเร็จ", description: `${result?.count ?? 1} รายการถูกเพิ่มเรียบร้อย` });
    } catch (e) {
      console.error("createSlot error:", e?.response?.data || e);
      toast({ title: "สร้างนัดไม่สำเร็จ", description: e?.response?.data?.message || "เกิดข้อผิดพลาด โปรดลองอีกครั้ง", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }
  return (
    <div className="space-y-4">
      {/* Filters Card */}
      <Card>
        <CardContent className="p-4 grid gap-3 md:grid-cols-6"> {/* Adjusted cols */}
          {/* Post Filter */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium">ประกาศ (โพสต์)</label>
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
                <SelectItem value="ALL">ทุกประกาศ</SelectItem>
                {posts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date From Filter */}
          <div>
            <label className="text-sm font-medium">จากวันที่</label>
            <Input
              type="date"
              className="mt-1"
              value={filters.dateFrom}
              min={todayISO} // Prevent selecting past dates in filter too
              onChange={(e) => onFilterChange("dateFrom", e.target.value)}
            />
          </div>

          {/* Date To Filter */}
          <div>
            <label className="text-sm font-medium">ถึงวันที่</label>
            <Input
              type="date"
              className="mt-1"
              value={filters.dateTo}
              min={filters.dateFrom || todayISO} // Min date is 'dateFrom'
              onChange={(e) => onFilterChange("dateTo", e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-sm font-medium">สถานะ</label>
            <Select
              value={filters.status}
              onValueChange={(v) => onFilterChange("status", v)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="เลือกสถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทั้งหมด</SelectItem>
                <SelectItem value="AVAILABLE">ว่าง</SelectItem>
                <SelectItem value="BOOKED">ถูกจอง</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search Button */}
          <div className="flex items-end">
            <Button className="w-full" onClick={fetchSlots} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
              ค้นหา
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Create Slot Card */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-lg">สร้างช่วงเวลาว่างใหม่</h3>

          {/* Form Grid */}
          <div className="grid gap-4 md:grid-cols-4">
            {/* Post Selection */}
            <div>
              <label className="text-sm font-medium block mb-1">ประกาศ*</label>
              <Select
                value={createPostId}
                onValueChange={(v) => {
                  setCreatePostId(v);
                  // Reset date/time if post changes to avoid showing invalid times
                  setSelectedDate("");
                  setStartTime("");
                }}
                disabled={!posts.length}
              >
                <SelectTrigger>
                  <SelectValue placeholder={posts.length ? "เลือกประกาศ" : "กรุณาสร้างโพสต์ก่อน"} />
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

            {/* Date Selection */}
            <div>
              <label className="text-sm font-medium block mb-1">วันนัด*</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start font-normal"
                    disabled={!createPostId} // Disable if no post selected
                  >
                    <CalendarIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                    {selectedDate || <span className="text-muted-foreground">เลือกวันที่</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate ? new Date(selectedDate) : undefined}
                    onSelect={(d) => {
                      if (d) {
                        const newYmd = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
                        setSelectedDate(newYmd);
                        setStartTime(""); // Reset start time when date changes
                      } else {
                        setSelectedDate("");
                        setStartTime("");
                      }
                    }}
                    disabled={(date) => date < today} // Prevent selecting past dates
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Duration Selection */}
            <div>
              <label className="text-sm font-medium block mb-1">ระยะเวลา</label>
              <Select
                value={String(duration)}
                onValueChange={(v) => setDuration(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 นาที</SelectItem>
                  <SelectItem value="60">60 นาที</SelectItem>
                  <SelectItem value="90">90 นาที</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Time Display */}
            <div>
              <label className="text-sm font-medium block mb-1">เวลาเริ่ม*</label>
              <div className="mt-1 h-10 px-3 py-2 flex items-center gap-2 border rounded-md bg-muted">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div className={`text-sm ${startTime ? '' : 'text-muted-foreground'}`}>{startTime || "เลือกด้านล่าง"}</div>
              </div>
            </div>
          </div>

          {/* Time Grid Picker */}
          <div className="pt-2">
            <label className="text-sm font-medium block mb-2">เลือกเวลาเริ่ม*</label>
            <TimeGridPicker
              selectedDate={selectedDate}
              postId={createPostId}
              duration={duration}
              allSlots={slots} // Pass currently fetched slots for overlap check
              onPick={(t) => setStartTime(t)}
            />
          </div>

          {/* End time preview */}
          <div className="text-sm text-muted-foreground pt-1">
            {selectedDate && startTime
              ? (() => {
                const [hh, mm] = startTime.split(":").map(Number);
                const startM = hh * 60 + mm;
                const endM = startM + duration;
                const endHH = pad2(Math.floor(endM / 60));
                const endMM = pad2(endM % 60);
                // Check if end time exceeds allowed range (e.g., 18:00)
                if (endHH > 18 || (endHH === 18 && endMM > 0)) {
                  return <span className="text-red-600">เวลาสิ้นสุดเกิน 18:00 น.</span>;
                }
                return `สิ้นสุดประมาณ ${endHH}:${endMM} น.`;
              })()
              : " "}
          </div>

          {/* Create Button */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleCreateSlotButton}
              disabled={creating || !createPostId || !selectedDate || !startTime || (startTime && (() => { // Disable if end time is invalid
                const [hh, mm] = startTime.split(":").map(Number);
                const endM = hh * 60 + mm + duration;
                const endHH = Math.floor(endM / 60);
                const endMM = endM % 60;
                return endHH > 18 || (endHH === 18 && endMM > 0);
              })())}
            >
              {creating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              สร้างช่วงเวลา
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Table Card */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-3">ช่วงเวลาทั้งหมด ({total})</h3>
          {/* Note: Pagination controls would go here if needed */}
        </CardContent>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-2 font-medium">ประกาศ</th>
                <th className="text-left px-4 py-2 font-medium">วัน/เวลาเริ่ม</th>
                <th className="text-left px-4 py-2 font-medium">วัน/เวลาสิ้นสุด</th>
                <th className="text-left px-4 py-2 font-medium">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {loading && slots.length === 0 ? ( // Show loading only if no slots are currently displayed
                <tr>
                  <td colSpan={4} className="text-center py-6 text-muted-foreground">
                    <Loader2 className="w-5 h-5 mx-auto animate-spin mb-2" />
                    กำลังโหลด...
                  </td>
                </tr>
              ) : slots.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-muted-foreground">
                    ไม่พบช่วงเวลาตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                slots.map((s) => (
                  <tr key={s.id || s._id} className="border-t hover:bg-muted/50">
                    <td className="px-4 py-2">{postMap.get(String(s.postId)) || s.postId}</td>
                    <td className="px-4 py-2">{new Date(s.startTime || s.start).toLocaleString("th-TH", { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td className="px-4 py-2">{new Date(s.endTime || s.end).toLocaleString("th-TH", { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${s.isBooked ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                        {s.isBooked ? "ถูกจองแล้ว" : "ว่าง"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
        {/* Simple Pagination (Example) */}
        {total > filters.pageSize && (
          <CardContent className="p-4 flex justify-end items-center gap-2 text-sm">
            <Button variant="outline" size="sm" onClick={() => onFilterChange('page', Math.max(1, filters.page - 1))} disabled={filters.page <= 1}>ก่อนหน้า</Button>
            <span>หน้า {filters.page} / {Math.ceil(total / filters.pageSize)}</span>
            <Button variant="outline" size="sm" onClick={() => onFilterChange('page', filters.page + 1)} disabled={filters.page * filters.pageSize >= total}>ถัดไป</Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
