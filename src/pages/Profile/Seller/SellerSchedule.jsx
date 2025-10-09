// ===============================
// File: src/pages/Profile/Seller/SellerSchedule.jsx
// Purpose: Manage seller's DateTimeSlots — filter, list, create
// Notes:
// - Relies on API helpers from '@/api/user':
//     createSlot(payload), searchSellerSlots(filters), getProfile()
// - UI intentionally minimal to fit your existing design.
// - Fix: shadcn <SelectItem> must not use empty string value. Use 'ALL' sentinel.
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
import { Plus, Search, Loader2 } from "lucide-react";

// 👉 Adjust these imports to match your API layer
import {
  createSlot as apiCreateSlot,
  searchSellerSlots as apiSearchSellerSlots,
  getProfile as apiGetProfile,
} from "@/api/user";

const DEFAULT_PAGE_SIZE = 20;

function useSellerPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function run() {
      try {
        setLoading(true);
        // Expect your getProfile to include seller posts under something like user.PropertyPost
        const res = await apiGetProfile();
        const sellerPosts =
          res?.user?.PropertyPost || res?.sellerPosts || res?.posts || [];
        if (!ignore) setPosts(sellerPosts);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    run();
    return () => {
      ignore = true;
    };
  }, []);

  return { posts, loading };
}

export default function SellerSchedule() {
  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []); // YYYY-MM-DD

  const [filters, setFilters] = useState({
    postId: "ALL", // 🔧 ใช้ 'ALL' แทนค่าว่าง
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

  const { posts } = useSellerPosts();

  async function fetchSlots() {
    try {
      setLoading(true);
      const res = await apiSearchSellerSlots({
        ...filters,
        // 🔧 ไม่ส่ง 'ALL' ไปหลังบ้าน ให้ตีความเป็นไม่ได้กรอง
        postId: filters.postId === "ALL" ? undefined : filters.postId,
      });
      setSlots(res?.items || []);
      setTotal(res?.total ?? 0);
    } catch (e) {
      console.error(e);
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

  function onFilterChange(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  }

  async function handleCreateSlot(e) {
    e?.preventDefault?.();
    if (!createForm.postId || !createForm.start || !createForm.end) {
      alert("กรอกข้อมูลให้ครบ (โพสต์, เวลาเริ่ม, เวลาสิ้นสุด)");
      return;
    }
    try {
      setCreating(true);
      await apiCreateSlot({
        postId: createForm.postId,
        start: new Date(createForm.start).toISOString(),
        end: new Date(createForm.end).toISOString(),
      });
      // reset & refresh
      setCreateForm({ postId: "", start: "", end: "" });
      await fetchSlots();
      alert("สร้างนัดสำเร็จ");
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "สร้างนัดไม่สำเร็จ");
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
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="เลือกโพสต์" />
              </SelectTrigger>
              <SelectContent>
                {/* 🔧 ห้าม value="" */}
                <SelectItem value="ALL">ทั้งหมด</SelectItem>
                {posts
                  ?.filter((p) => p?.id)
                  ?.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.Property_Name || p.title || p.id}
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
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">สร้างนัดใหม่</h3>
          </div>
          <form
            className="grid gap-3 md:grid-cols-4"
            onSubmit={handleCreateSlot}
          >
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
                  {posts
                    ?.filter((p) => p?.id)
                    ?.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.Property_Name || p.title || p.id}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm">เริ่ม</label>
              <Input
                type="datetime-local"
                className="mt-1"
                value={createForm.start}
                onChange={(e) =>
                  setCreateForm((s) => ({ ...s, start: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-sm">สิ้นสุด</label>
              <Input
                type="datetime-local"
                className="mt-1"
                value={createForm.end}
                onChange={(e) =>
                  setCreateForm((s) => ({ ...s, end: e.target.value }))
                }
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                สร้างนัด
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Slots Table */}
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
                  <td className="px-4 py-6" colSpan={4}>
                    กำลังโหลด...
                  </td>
                </tr>
              ) : slots.length === 0 ? (
                <tr>
                  <td className="px-4 py-6" colSpan={4}>
                    ไม่พบข้อมูล
                  </td>
                </tr>
              ) : (
                slots.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="px-4 py-2">{s.postId}</td>
                    <td className="px-4 py-2">
                      {new Date(s.start).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      {new Date(s.end).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      {s.isBooked ? "ถูกจอง" : "ว่าง"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {/* Pagination */}
          <div className="flex items-center justify-between p-3">
            <div>ทั้งหมด {total} รายการ</div>
            <div className="space-x-2">
              <Button
                variant="outline"
                disabled={filters.page <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              >
                ก่อนหน้า
              </Button>
              <Button
                variant="outline"
                disabled={slots.length < filters.pageSize}
                onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              >
                ถัดไป
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
