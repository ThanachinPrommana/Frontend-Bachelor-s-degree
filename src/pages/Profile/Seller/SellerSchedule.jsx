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
  Trash2,
  ChevronLeft, // <-- Add this
  ChevronRight // <-- Add this
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
  removeSlot,
} from "@/api/user";
import { useAuth } from "@/context/AuthContext";
import TimeGridPicker from "@/components/TimeGridPicker";
import { useToast } from "@/components/ui/use-toast";

const DEFAULT_PAGE_SIZE = 20;
const ITEMS_PER_PAGE = 5;
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

// Note: isOverlapping and slotsOfDayForPost might be better placed inside TimeGridPicker
// if only used there. Keeping them here for completeness based on previous code.
function isOverlapping(startA, endA, startB, endB) {
  return Math.max(startA, startB) < Math.min(endA, endB);
}

function slotsOfDayForPost(allSlots, postId, ymd) {
  if (!postId || !ymd) return []; // Added check
  const startOfDay = new Date(ymd + "T00:00:00");
  const endOfDay = new Date(ymd + "T23:59:59");
  return (allSlots || []).filter((s) => {
    // Check if slot belongs to the correct post
    // Use optional chaining for safety; compare actual postId if available
    const slotPostId = s?.postId || s?.Post?.id;
    if (String(slotPostId) !== String(postId)) return false;

    // Check if the slot starts within the specified day
    const st = new Date(s?.startTime || s?.start || 0); // Use optional chaining
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
        const data = await apiGetProfile(); // Assuming this is defined elsewhere
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
  const { toast } = useToast();
  const { authUser, loading: authLoading, revalidateUser } = useAuth();
  const { posts } = useSellerPosts();

  // --- State Variables ---
  const [filters, setFilters] = useState({
    postId: "ALL",
    dateFrom: "", // Start empty for filters
    dateTo: "",
    status: "ALL",
  });
  const [creating, setCreating] = useState(false);
  const [createPostId, setCreatePostId] = useState(""); // Separate state for create form
  const [selectedDate, setSelectedDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState(30);
  const [deletingId, setDeletingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  // Removed slotsForPicker and loadingPickerSlots as fetchSlotsForPicker was commented out

  // --- Memoized Values ---
  const today = useMemo(() => new Date(new Date().setHours(0, 0, 0, 0)), []);
  // Removed todayISO as it's not used directly for filtering logic anymore
  const todayISO = useMemo(() => today.toISOString().slice(0, 10), [today]);

  const pastMatcher = useMemo(() => ({ before: today }), [today]); // ใช้ today
  const modifiers = useMemo(() => ({ past: pastMatcher }), [pastMatcher]);
  const modifiersStyles = useMemo(() => ({
    past: { opacity: 0.5, cursor: "not-allowed" },
  }), []);

  const allSellerSlots = useMemo(() => {
    return (authUser?.Seller?.DateTimeSlot || []).sort((a, b) =>
      new Date(a.startTime) - new Date(b.startTime) // Sort ascending
    );
  }, [authUser]);

  const postMap = useMemo(() => {
    const m = new Map();
    posts.forEach((p) => m.set(p.id, p.label));
    m.set("N/A", "N/A");
    return m;
  }, [posts]);

  // --- Client-side Filtering ---
  const filteredSlots = useMemo(() => {
    return allSellerSlots.filter(slot => {
      if (filters.postId !== "ALL" && String(slot?.Post?.id) !== String(filters.postId)) {
        return false;
      }
      const slotStartTime = new Date(slot.startTime);
      if (filters.dateFrom) {
        const filterFromDate = new Date(filters.dateFrom);
        filterFromDate.setHours(0, 0, 0, 0);
        if (slotStartTime < filterFromDate) return false;
      }
      if (filters.dateTo) {
        const filterToDate = new Date(filters.dateTo);
        filterToDate.setHours(23, 59, 59, 999);
        if (slotStartTime > filterToDate) return false;
      }
      if (filters.status !== "ALL") {
        const isAvailable = !slot.isBooked;
        if (filters.status === "AVAILABLE" && !isAvailable) return false;
        if (filters.status === "BOOKED" && isAvailable) return false;
      }
      return true;
    });
  }, [allSellerSlots, filters]);

  // --- Pagination Calculation ---
  const totalPages = Math.max(1, Math.ceil(filteredSlots.length / ITEMS_PER_PAGE));

  // Effect to adjust page if it exceeds total pages after filtering/deletion
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, totalPages]); // Added dependency check suggestion from ESLint comment

  const currentTableData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const lastPageIndex = firstPageIndex + ITEMS_PER_PAGE;
    return filteredSlots.slice(firstPageIndex, lastPageIndex);
  }, [filteredSlots, currentPage]);

  // --- Event Handlers & API Calls ---

  function onFilterChange(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset page on filter change
  }

  // Removed fetchSlotsForPicker as it was commented out

  async function handleDeleteSlot(slotId, startTime) {
    const formattedTime = new Date(startTime).toLocaleString("th-TH", { dateStyle: 'short', timeStyle: 'short' });
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบช่วงเวลา ${formattedTime} นี้?\n(การจองที่เกี่ยวข้องกับช่วงเวลานี้จะถูกลบไปด้วย)`)) {
      return;
    }
    setDeletingId(slotId);
    try {
      await removeSlot(slotId); // Assumes removeSlot is imported correctly
      toast({ title: "ลบช่วงเวลาสำเร็จ", description: `ช่วงเวลา ${formattedTime} ถูกลบแล้ว` });
      await revalidateUser(); // Refresh authUser -> updates allSellerSlots
    } catch (error) {
      console.error("Error removing time slot:", error?.response?.data || error);
      toast({
        title: "ลบช่วงเวลาไม่สำเร็จ",
        description: error?.response?.data?.message || "เกิดข้อผิดพลาด โปรดลองอีกครั้ง",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  }

  async function handleCreateSlotButton() {
    if (!createPostId || !selectedDate || !startTime) { // <-- ใช้ createPostId
      toast({ title: "ข้อมูลไม่ครบ", description: "กรุณาเลือกโพสต์, วันที่, และเวลาเริ่ม", variant: "warning" });
      return;
    }
    const inputDate = new Date(selectedDate + "T00:00:00");
    if (isNaN(inputDate.getTime())) {
      toast({ title: "วันที่ไม่ถูกต้อง", description: "รูปแบบวันที่ที่เลือกไม่ถูกต้อง", variant: "destructive" });
      return;
    }
    if (inputDate < today) {
      toast({ title: "ไม่สามารถสร้างนัดในอดีต", description: "กรุณาเลือกวันที่ปัจจุบันหรืออนาคต", variant: "warning" });
      return;
    }

    try {
      setCreating(true);
      const postIdForApi = String(createPostId).trim(); // Use createPostId
      if (!postIdForApi) {
        toast({ title: "รหัสโพสต์ไม่ถูกต้อง", variant: "warning" });
        setCreating(false);
        return;
      }

      const [hh, mm] = startTime.split(":").map(Number);
      const endMins = hh * 60 + mm + duration;
      const endHH = pad2(Math.floor(endMins / 60));
      const endMM = pad2(endMins % 60);
      const endTime = `${endHH}:${endMM}`;

      const now = new Date();
      const startDate = new Date(`${selectedDate}T${startTime}:00`);
      if (inputDate.toDateString() === today.toDateString() && startDate < now) {
        toast({ title: "ไม่สามารถสร้างนัดในอดีต", description: `เวลา ${startTime} ของวันนี้ได้ผ่านไปแล้ว`, variant: "warning" });
        setCreating(false);
        return;
      }
      // Check if end time exceeds 18:00
      if (endHH > 18 || (endHH === 18 && endMM > 0)) {
        toast({ title: "เวลาไม่ถูกต้อง", description: "เวลาสิ้นสุดต้องไม่เกิน 18:00 น.", variant: "warning" });
        setCreating(false);
        return;
      }

      const payload = {
        postId: postIdForApi,
        date: selectedDate,
        timeSlots: [{ startTime: startTime, endTime: endTime }],
      };

      console.log("Sending payload:", JSON.stringify(payload, null, 2));
      const result = await apiCreateSlot(payload); // Assumes apiCreateSlot is imported

      setSelectedDate("");
      setStartTime("");
      // Don't reset createPostId unless intended
      // setDuration(30); // Keep duration user selected?
      await revalidateUser(); // Refresh authUser -> updates allSellerSlots
      toast({ title: "สร้างนัดสำเร็จ", description: `${result?.count ?? 1} รายการถูกเพิ่มเรียบร้อย` });

    } catch (e) {
      console.error("createSlot error:", e?.response?.data || e);
      toast({ title: "สร้างนัดไม่สำเร็จ", description: e?.response?.data?.message || "เกิดข้อผิดพลาด โปรดลองอีกครั้ง", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }

  // --- Pagination Handlers ---
  const goToNextPage = () => {
    setCurrentPage((page) => Math.min(page + 1, totalPages));
  };
  const goToPreviousPage = () => {
    setCurrentPage((page) => Math.max(1, page - 1));
  };

  return (
    <div className="space-y-4">
      {/* Filters Card */}
      <Card>
        <CardContent className="p-4 grid gap-3 md:grid-cols-5"> {/* Adjusted cols back to 5 for Filters */}
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
              min={todayISO} // Prevent selecting past dates
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
          {/* <div className="flex items-end">
            <Button className="w-full" onClick={fetchSlots} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Search className="w-4 h-4 mr-2" />}
               ค้นหา
            </Button>
          </div> */}
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
                value={createPostId} // Use createForm state here
                onValueChange={(v) => {
                  setCreatePostId(v); // <-- เปลี่ยนมาใช้ setCreatePostId โดยตรง
                  // รีเซ็ตวันที่/เวลา เมื่อโพสต์เปลี่ยน
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
                    postId={createPostId}// Check createForm state
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
                        setStartTime("");
                      } else {
                        setSelectedDate("");
                        setStartTime("");
                      }
                    }}
                    disabled={pastMatcher}
                    modifiers={modifiers}
                    modifiersStyles={modifiersStyles}
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
              postId={createPostId} // Use createForm state here
              duration={duration}
              allSlots={allSellerSlots} // Pass ALL slots for overlap check
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
              disabled={creating || !createPostId || !selectedDate || !startTime || (startTime && (() => { // <-- เปลี่ยนเป็น !createPostId
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
          <h3 className="font-semibold text-lg mb-3">ช่วงเวลาทั้งหมด ({allSellerSlots.length})</h3>
        </CardContent>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-2 font-medium">ประกาศ</th>
                <th className="text-left px-4 py-2 font-medium">วัน/เวลาเริ่ม</th>
                <th className="text-left px-4 py-2 font-medium">วัน/เวลาสิ้นสุด</th>
                <th className="text-left px-4 py-2 font-medium">สถานะ</th>
                <th className="text-right px-4 py-2 font-medium">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {authLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-muted-foreground"> {/* Updated colSpan */}
                    <Loader2 className="w-5 h-5 mx-auto animate-spin mb-2" />
                    กำลังโหลดข้อมูลโปรไฟล์...
                  </td>
                </tr>
              ) : allSellerSlots.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-muted-foreground"> {/* Updated colSpan */}
                    คุณยังไม่ได้สร้างช่วงเวลาใดๆ
                  </td>
                </tr>
              ) : (
                currentTableData.map((s) => { // Use paginated data
                  // 1. ดึงเวลาปัจจุบัน
                  const now = new Date();
                  // 2. ตรวจสอบว่าเวลาปัจจุบัน เลยเวลาสิ้นสุด (s.endTime) ของ slot นี้ไปแล้วหรือยัง
                  const isPastEndTime = new Date(s.endTime) < now;

                  return (
                    <tr key={s.id || s._id} className="border-t hover:bg-muted/50">
                      <td className="px-4 py-2">{s?.Post?.Property_Name || 'N/A'}</td>
                      <td className="px-4 py-2">{new Date(s.startTime).toLocaleString("th-TH", { dateStyle: 'short', timeStyle: 'short' })}</td>
                      <td className="px-4 py-2">{new Date(s.endTime).toLocaleString("th-TH", { dateStyle: 'short', timeStyle: 'short' })}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${s.isBooked ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                          {s.isBooked ? "ถูกจองแล้ว" : "ว่าง"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:bg-red-100 hover:text-red-700"
                          onClick={() => handleDeleteSlot(s.id, s.startTime)}
                          //
                          // === 💜 4. เปลี่ยนเงื่อนไข 'disabled' ตรงนี้ ===
                          //
                          // disabled={s.isBooked || deletingId === s.id} // <-- ลบอันเก่านี้
                          //
                          // ปุ่มจะถูกปิด (disabled) ถ้า:
                          // 1. !isPastEndTime (ยังไม่เลยเวลาสิ้นสุด)
                          // 2. deletingId === s.id (กำลังลบ)
                          //
                          disabled={!isPastEndTime || deletingId === s.id} // <-- ใช้อันใหม่นี้
                          //
                          // === 💜 จบการเปลี่ยนแปลง ===
                          //
                          aria-label="ลบช่วงเวลา"
                        >
                          {deletingId === s.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
        {/* Pagination Controls */}
        {allSellerSlots.length > ITEMS_PER_PAGE && (
          <CardContent className="p-4 flex justify-end items-center gap-2 text-sm">
            <span className="text-muted-foreground">
              หน้า {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              ก่อนหน้า
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage >= totalPages}
            >
              ถัดไป
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

/* ============ TimeGridPicker ============ */
// function TimeGridPicker({ selectedDate, postId, duration, allSlots, onPick }) {
//   if (!selectedDate || !postId) {
//     return (
//       <div className="text-sm text-muted-foreground">
//         เลือก “ประกาศ” และ “วันนัด” ก่อน จากนั้นจะมีเวลาขึ้นมาให้เลือก
//       </div>
//     );
//   }

//   const options = useMemo(() => generateTimeOptions("08:00", "18:00", 30), []);
//   const daySlots = slotsOfDayForPost(allSlots, postId, selectedDate).map(
//     (s) => ({
//       startMs: new Date(s.start).getTime(),
//       endMs: new Date(s.end).getTime(),
//       isBooked: !!s.isBooked,
//     })
//   );

//   function isAvailable(timeStr) {
//     // ประเมินทับซ้อนจากข้อมูลที่มีอยู่ (ใช้เวลา HH:mm + duration)
//     const [hh, mm] = timeStr.split(":").map(Number);
//     const startMs = new Date(`${selectedDate}T${timeStr}:00`).getTime();
//     const endMins = hh * 60 + mm + duration;
//     const endHH = pad2(Math.floor(endMins / 60));
//     const endMM = pad2(endMins % 60);
//     const endMs = new Date(`${selectedDate}T${endHH}:${endMM}:00`).getTime();

//     const hardEnd = new Date(`${selectedDate}T18:00:00`).getTime();
//     if (endMs > hardEnd + 60 * 1000) return false;

//     for (const s of daySlots) {
//       if (isOverlapping(startMs, endMs, s.startMs, s.endMs)) return false;
//     }
//     return true;
//   }

//   return (
//     <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
//       {options.map((t) => {
//         const ok = isAvailable(t);
//         return (
//           <Button
//             key={t}
//             variant={ok ? "outline" : "secondary"}
//             className="justify-center"
//             disabled={!ok}
//             onClick={() => ok && onPick(t)}
//           >
//             {t}
//           </Button>
//         );
//       })}
//     </div>
//   );
// }
