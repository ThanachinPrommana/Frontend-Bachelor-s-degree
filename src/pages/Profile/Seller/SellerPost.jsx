// src/pages/Profile/SellerPost.jsx
import React, { useMemo, useState, useDeferredValue } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/api/authconfig";
import {
  Home,
  Pencil,
  BedDouble,
  Bath,
  CarFront,
  Ruler,
  MapPin,
  Trash2,
  SortDesc,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  Search,
} from "lucide-react";
import { Link } from "react-router-dom";
import EditPostDialog from "@/components/PostComponents/EditPostDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

const fmtBaht = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString("th-TH") : "-";
};

const spec = (icon, text) => (
  <div className="flex items-center gap-1.5 text-sm text-gray-700">
    {icon}
    <span className="truncate">{text}</span>
  </div>
);

const StatusBadge = ({ status }) => {
  const s = (status || "").toUpperCase();
  if (s === "APPROVED")
    return (
      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
        อนุมัติแล้ว
      </Badge>
    );
  if (s === "REJECTED")
    return (
      <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">
        ถูกปฏิเสธ
      </Badge>
    );
  return (
    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
      รอดำเนินการ
    </Badge>
  );
};

const sorters = {
  newest: (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
  price_desc: (a, b) => (Number(b.Price) || 0) - (Number(a.Price) || 0),
  price_asc: (a, b) => (Number(a.Price) || 0) - (Number(b.Price) || 0),
  name: (a, b) =>
    (a.Property_Name || "").localeCompare(b.Property_Name || "", "th"),
};

export default function SellerPost() {
  const { authUser, loading, revalidateUser } = useAuth();

  // ---- UI state
  const [q, setQ] = useState("");
  const qDeferred = useDeferredValue(q); // เด้งเบา ๆ
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");

  // Edit dialog
  const [openEdit, setOpenEdit] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  // Delete dialog
  const [deletingId, setDeletingId] = useState(null);
  const [busyDelete, setBusyDelete] = useState(false);

  const posts = authUser?.PropertyPost ?? [];

  // ---- Derived: stats
  const stats = useMemo(() => {
    const total = posts.length;
    const approved = posts.filter(
      (p) => (p.Status_post || "").toUpperCase() === "APPROVED"
    ).length;
    const pending = posts.filter(
      (p) => (p.Status_post || "").toUpperCase() === "PENDING"
    ).length;
    const rejected = posts.filter(
      (p) => (p.Status_post || "").toUpperCase() === "REJECTED"
    ).length;
    return { total, approved, pending, rejected };
  }, [posts]);

  // ---- Search + Filter + Sort
  const filteredSorted = useMemo(() => {
    let arr = [...posts];

    const key = qDeferred.trim().toLowerCase();
    if (key) {
      arr = arr.filter((p) => {
        const name = (p.Property_Name || "").toLowerCase();
        const addr = (p.Address || "").toLowerCase();
        const prov = (p.Province || "").toLowerCase();
        return name.includes(key) || addr.includes(key) || prov.includes(key);
      });
    }

    if (statusFilter !== "ALL") {
      arr = arr.filter(
        (p) => (p.Status_post || "").toUpperCase() === statusFilter
      );
    }

    const sorter = sorters[sortBy] || sorters.newest;
    arr.sort(sorter);

    return arr;
  }, [posts, qDeferred, statusFilter, sortBy]);

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      setBusyDelete(true);
      await apiClient.delete(`/propertypost/${deletingId}`);
      await revalidateUser();
    } catch (e) {
      alert(e?.response?.data?.message || "ลบไม่สำเร็จ");
    } finally {
      setBusyDelete(false);
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="animate-pulse h-8 w-48 bg-gray-200 rounded mb-6" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border rounded-xl overflow-hidden">
              <div className="h-40 bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl font-semibold text-[#2C3E50]">โพสต์ของฉัน</h1>
          <p className="text-gray-600">
            จัดการประกาศอสังหา ดูรายละเอียดคร่าว ๆ และแก้ไขได้อย่างรวดเร็ว
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="border-amber-200">
            <CardContent className="py-3">
              <div className="text-xs text-gray-500">ทั้งหมด</div>
              <div className="text-xl font-semibold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="border-emerald-200">
            <CardContent className="py-3">
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />{" "}
                อนุมัติแล้ว
              </div>
              <div className="text-xl font-semibold">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card className="border-amber-200">
            <CardContent className="py-3">
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Clock3 className="w-4 h-4 text-amber-600" /> รอดำเนินการ
              </div>
              <div className="text-xl font-semibold">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card className="border-rose-200">
            <CardContent className="py-3">
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-rose-600" /> ถูกปฏิเสธ
              </div>
              <div className="text-xl font-semibold">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-3 md:items-center mb-5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหา: ชื่อประกาศ / ที่อยู่ / จังหวัด"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#34495E]"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="ALL">สถานะ: ทั้งหมด</option>
              <option value="APPROVED">อนุมัติแล้ว</option>
              <option value="PENDING">รอดำเนินการ</option>
              <option value="REJECTED">ถูกปฏิเสธ</option>
            </select>

            <div className="relative">
              <SortDesc className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-md pl-9 pr-3 py-2"
              >
                <option value="newest">เรียง: ล่าสุด</option>
                <option value="price_desc">ราคาสูง → ต่ำ</option>
                <option value="price_asc">ราคาต่ำ → สูง</option>
                <option value="name">ชื่อ A → Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Empty state */}
        {filteredSorted.length === 0 ? (
          <div className="text-center text-gray-600 py-12">
            <p className="mb-4">
              {posts.length
                ? "ไม่พบผลลัพธ์ที่ตรงกับคำค้น/ตัวกรอง"
                : "ยังไม่มีรายการโพสต์"}
            </p>
            <Link
              to="/seller/post-for-sale/title"
              className="inline-flex items-center border-2 border-[#34495E] text-[#34495E] px-4 py-2 rounded-md font-medium hover:bg-[#34495E] hover:text-white transition"
            >
              <Home className="w-4 h-4 mr-2" />
              สร้างประกาศแรกของคุณ
            </Link>
          </div>
        ) : (
          <div className="h-[calc(100vh-160px)] overflow-y-auto pr-1">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSorted.map((post) => {
                const cover = post?.Image?.[0]?.url;
                const usable = post?.Usable_Area
                  ? `${post.Usable_Area} ตร.ม.`
                  : "-";
                const land = post?.Land_Size ? `${post.Land_Size} ตร.ว.` : "-";
                const beds = post?.Bedrooms ?? "-";
                const baths = post?.Bathroom ?? "-";
                const park = post?.Parking_Slots ?? post?.Parking ?? "-";

                return (
                  <Card
                    key={post.id}
                    className="overflow-hidden border-gray-200"
                  >
                    {/* Cover */}
                    {cover ? (
                      <img
                        src={cover}
                        alt={post.Property_Name || "cover"}
                        className="w-full h-40 object-cover"
                      />
                    ) : (
                      <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                        <Home className="w-7 h-7 text-gray-400" />
                      </div>
                    )}

                    <CardContent className="p-4">
                      {/* Title + Status + Price */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-lg font-semibold truncate">
                            {post.Property_Name || "-"}
                          </h3>
                          <div className="mt-1 text-gray-600 flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">
                              {(post.Address && `${post.Address} · `) || ""}
                              {post.Province || "-"}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <StatusBadge status={post.Status_post} />
                          <div className="text-[#117A2D] font-bold text-lg leading-tight mt-1">
                            ฿ {fmtBaht(post.Price)}
                          </div>
                        </div>
                      </div>

                      {/* Specs */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3">
                        {spec(
                          <Ruler className="w-4 h-4" />,
                          `ใช้สอย ${usable}`
                        )}
                        {spec(<Ruler className="w-4 h-4" />, `ที่ดิน ${land}`)}
                        {spec(
                          <BedDouble className="w-4 h-4" />,
                          `${beds} ห้องนอน`
                        )}
                        {spec(<Bath className="w-4 h-4" />, `${baths} ห้องน้ำ`)}
                        {spec(
                          <CarFront className="w-4 h-4" />,
                          `${park} ที่จอดรถ`
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-xs text-gray-400">
                          อัปเดตล่าสุด{" "}
                          {post.updatedAt
                            ? new Date(post.updatedAt).toLocaleDateString(
                                "th-TH",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )
                            : "-"}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingPost(post);
                              setOpenEdit(true);
                            }}
                            className="border-[#34495E] text-[#34495E] hover:bg-[#34495E] hover:text-white"
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            แก้ไข
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeletingId(post.id)}
                            className="border-red-500 text-red-600 hover:bg-red-500 hover:text-white"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            ลบ
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <EditPostDialog
        open={openEdit}
        onOpenChange={(v) => {
          setOpenEdit(v);
          if (!v) setEditingPost(null);
        }}
        postId={editingPost?.id}
        initialPost={editingPost}
        onSaved={async () => {
          await revalidateUser();
        }}
      />

      {/* Delete Dialog */}
      <AlertDialog
        open={!!deletingId}
        onOpenChange={(v) => !v && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบโพสต์นี้ใช่ไหม?</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-gray-600">
            การลบไม่สามารถย้อนกลับได้ ข้อมูลประกาศนี้จะถูกลบออกจากระบบทันที
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busyDelete}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
              disabled={busyDelete}
            >
              {busyDelete ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              ลบประกาศ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
