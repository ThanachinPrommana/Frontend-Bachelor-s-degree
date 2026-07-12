// src/pages/Profile/SellerPost.jsx
import React, {
  useMemo,
  useState,
  useDeferredValue,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { Link } from "react-router-dom";
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
import { useToast } from "@/components/ui/use-toast";

/* ---------- utils ---------- */
const fmtBaht = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString("th-TH") : "-";
};

const isSafeHttpUrl = (u) => {
  if (!u) return false;
  try {
    const x = new URL(u, window.location.origin);
    return x.protocol === "http:" || x.protocol === "https:";
  } catch {
    return false;
  }
};

const safeImgUrl = (maybe) => (isSafeHttpUrl(maybe) ? maybe : "");

/* ========= normalize status ========= */
const normalizeStatus = (raw) => {
  const up = String(raw || "").toUpperCase();
  if (!up) return "PENDING";
  if (up === "APPROVED") return "CONFIRMED";
  return up;
};

/** ใช้: PENDING | CONFIRMED | SOLD | HIDDEN | REJECTED */
const StatusBadge = ({ status }) => {
  const s = normalizeStatus(status);
  if (s === "CONFIRMED") {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
        อนุมัติแล้ว
      </Badge>
    );
  }
  if (s === "REJECTED") {
    return (
      <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">
        ถูกปฏิเสธ
      </Badge>
    );
  }
  if (s === "SOLD") {
    return (
      <Badge className="bg-slate-200 text-slate-800 hover:bg-slate-200">
        ขายแล้ว
      </Badge>
    );
  }
  if (s === "HIDDEN") {
    return (
      <Badge className="bg-gray-200 text-gray-700 hover:bg-gray-200">
        ซ่อนโดยแอดมิน
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
      รอดำเนินการ
    </Badge>
  );
};

const spec = (icon, text) => (
  <div className="flex items-center gap-1.5 text-sm text-gray-700">
    {icon}
    <span className="truncate">{text}</span>
  </div>
);

/* ===================== PostCard ===================== */
function PostCard({ post, onEdit, onAskDelete }) {
  const cover = useMemo(() => {
    const firstImg = post?.Image?.[0];
    return safeImgUrl(firstImg?.secure_url) || safeImgUrl(firstImg?.url) || "";
  }, [post?.Image]);

  const usable = useMemo(() => {
    return Number.isFinite(Number(post?.Usable_Area))
      ? `${post.Usable_Area} ตร.ม.`
      : "-";
  }, [post?.Usable_Area]);

  const land = useMemo(() => {
    return Number.isFinite(Number(post?.Land_Size))
      ? `${post.Land_Size} ตร.ว.`
      : "-";
  }, [post?.Land_Size]);

  const title = post?.Property_Name || "-";
  const province = post?.Province || "-";
  const priceBaht = fmtBaht(post?.Price);
  const normalizedStatus = normalizeStatus(post?.Status_post);
  const isConfirmed = normalizedStatus === "CONFIRMED"; // ✅ ปิดแก้ไขถ้าอนุมัติแล้ว

  return (
    <Card className="overflow-hidden border-gray-200" key={post.id}>
      {/* Cover */}
      {cover ? (
        <Link to={`/post/${post.id}`} aria-label={`เปิดประกาศ ${title}`}>
          <img
            src={cover}
            alt={title}
            className="w-full h-40 object-cover"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = "";
              e.currentTarget.alt = "no-image";
              e.currentTarget.classList.add("bg-gray-100");
            }}
          />
        </Link>
      ) : (
        <Link
          to={`/post/${post.id}`}
          aria-label={`เปิดประกาศ ${title}`}
          className="block w-full h-40 bg-gray-100"
        >
          <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
            <Home className="w-7 h-7 text-gray-400" />
          </div>
        </Link>
      )}

      <CardContent className="p-4">
        {/* Title + Status + Price */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold truncate">
              <Link to={`/post/${post.id}`} className="hover:underline">
                {title}
              </Link>
            </h3>
            <div className="mt-1 text-gray-600 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span className="truncate">
                {(post.Address && `${post.Address} · `) || ""}
                {province}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <StatusBadge status={normalizedStatus} />
            <div className="text-[#117A2D] font-bold text-lg leading-tight mt-1">
              ฿ {priceBaht}
            </div>
          </div>
        </div>

        {/* Specs */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3">
          {spec(<Ruler className="w-4 h-4" />, `ใช้สอย ${usable}`)}
          {spec(<Ruler className="w-4 h-4" />, `ที่ดิน ${land}`)}
          {spec(
            <BedDouble className="w-4 h-4" />,
            `${post?.Bedrooms ?? "-"} ห้องนอน`
          )}
          {spec(
            <Bath className="w-4 h-4" />,
            `${post?.Bathroom ?? "-"} ห้องน้ำ`
          )}
          {spec(
            <CarFront className="w-4 h-4" />,
            `${post?.Parking_Space ?? "-"} ที่จอดรถ`
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-xs text-gray-400">
            อัปเดตล่าสุด{" "}
            {post.updatedAt
              ? new Date(post.updatedAt).toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "-"}
          </div>
          <div className="flex gap-2">
            {/* แก้ไขปิดถ้าอนุมัติแล้ว */}
            <div
              title={
                isConfirmed
                  ? "โพสต์ที่อนุมัติแล้วไม่สามารถแก้ไขได้"
                  : "แก้ไขประกาศ"
              }
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => !isConfirmed && onEdit(post)}
                aria-label={`แก้ไขประกาศ ${title}`}
                className={`border-[#34495E] text-[#34495E] hover:bg-[#34495E] hover:text-white ${
                  isConfirmed
                    ? "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-[#34495E]"
                    : ""
                }`}
                disabled={isConfirmed}
              >
                <Pencil className="w-4 h-4 mr-1" />
                แก้ไข
              </Button>
            </div>

            {/* ลบยังคงใช้งานได้ */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAskDelete(post.id)}
              aria-label={`ลบประกาศ ${title}`}
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
}
/* ======================= หน้าหลัก ======================= */
export default function SellerPost() {
  const { authUser, loading, revalidateUser } = useAuth();
  const { toast } = useToast();

  // ---- UI state
  const [q, setQ] = useState("");
  const qDeferred = useDeferredValue(q);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");

  // ✨ Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12); // เลือกได้ 6 / 12 / 24

  // Edit dialog
  const [openEdit, setOpenEdit] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  // Delete dialog
  const [deletingId, setDeletingId] = useState(null);
  const [busyDelete, setBusyDelete] = useState(false);

  // รายการที่ดึงรายละเอียดด้วย getPost
  const [detailedPosts, setDetailedPosts] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const fetchedRef = useRef(false);

  // ==== ดึงรายละเอียดด้วย getPost ตาม id ทั้งหมดของผู้ใช้ ====
  useEffect(() => {
    const base = authUser?.PropertyPost || [];
    if (!base.length) {
      setDetailedPosts([]);
      fetchedRef.current = true;
      return;
    }

    let cancelled = false;
    const fetchAll = async () => {
      setLoadingDetails(true);
      try {
        const results = await Promise.allSettled(
          base.map((p) => apiClient.get(`/propertypost/${p.id}`))
        );

        const merged = results.map((r, idx) => {
          const fallback = base[idx] || {};
          if (r.status === "fulfilled") {
            const data = r.value?.data || {};
            // รวมข้อมูลเดิมไว้เป็น fallback และ normalize สถานะ
            return {
              ...fallback,
              ...data,
              Status_post: normalizeStatus(
                data?.Status_post || fallback?.Status_post
              ),
            };
          }
          // ถ้าดึงไม่ได้ ใช้ข้อมูลเดิมพร้อม normalize สถานะ
          return {
            ...fallback,
            Status_post: normalizeStatus(fallback?.Status_post),
          };
        });

        if (!cancelled) {
          setDetailedPosts(merged);
          fetchedRef.current = true;
        }
      } finally {
        if (!cancelled) setLoadingDetails(false);
      }
    };

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [authUser?.PropertyPost]);

  // รีเฟรชเมื่อโฟกัสแท็บ
  useEffect(() => {
    const onFocus = () => {
      revalidateUser().catch(() => {});
    };
    const onVis = () => {
      if (document.visibilityState === "visible") onFocus();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [revalidateUser]);

  // ใช้รายการที่ดึงมาจริงเป็นหลัก ถ้ายังไม่ดึงเสร็จตกกลับของเดิมชั่วคราว
  const posts = fetchedRef.current
    ? detailedPosts
    : authUser?.PropertyPost || [];

  // collator สำหรับ sort ชื่อภาษาไทย
  const thCollator = useMemo(
    () => new Intl.Collator("th", { sensitivity: "base" }),
    []
  );

  const sorters = useMemo(
    () => ({
      newest: (a, b) =>
        (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0),
      price_desc: (a, b) => (Number(b.Price) || 0) - (Number(a.Price) || 0),
      price_asc: (a, b) => (Number(a.Price) || 0) - (Number(b.Price) || 0),
      name: (a, b) =>
        thCollator.compare(a?.Property_Name || "", b?.Property_Name || ""),
    }),
    [thCollator]
  );

  /* ---- Stats: ไม่นับ HIDDEN ในทุกกรณี, SOLD นับรวมใน total ได้ */
  const stats = useMemo(() => {
    const visible = posts.filter(
      (p) => normalizeStatus(p?.Status_post) !== "HIDDEN"
    );
    const total = visible.length;
    const confirmed = visible.filter(
      (p) => normalizeStatus(p?.Status_post) === "CONFIRMED"
    ).length;
    const pending = visible.filter(
      (p) => normalizeStatus(p?.Status_post) === "PENDING"
    ).length;
    const rejected = visible.filter(
      (p) => normalizeStatus(p?.Status_post) === "REJECTED"
    ).length;
    return { total, confirmed, pending, rejected };
  }, [posts]);

  // ---- Search + Filter + Sort
  const filteredSorted = useMemo(() => {
    // เริ่มจากตัด HIDDEN ออกเสมอ
    let arr = posts.filter((p) => normalizeStatus(p?.Status_post) !== "HIDDEN");

    // ค้นหาข้อความ
    const key = qDeferred.trim().toLowerCase();
    if (key) {
      arr = arr.filter((p) => {
        const name = (p.Property_Name || "").toLowerCase();
        const addr = (p.Address || "").toLowerCase();
        const prov = (p.Province || "").toLowerCase();
        return name.includes(key) || addr.includes(key) || prov.includes(key);
      });
    }

    // ตัวกรองสถานะ
    if (statusFilter !== "ALL") {
      arr = arr.filter((p) => normalizeStatus(p?.Status_post) === statusFilter);
    } else {
      // ALL: ไม่แสดง SOLD
      arr = arr.filter((p) => normalizeStatus(p?.Status_post) !== "SOLD");
    }

    // เรียง
    const sorter = sorters[sortBy] || sorters.newest;
    arr.sort(sorter);

    return arr;
  }, [posts, qDeferred, statusFilter, sortBy, sorters]);

  // ✨ Reset หน้าเมื่อ search/filter/sort เปลี่ยน
  useEffect(() => {
    setPage(1);
  }, [qDeferred, statusFilter, sortBy]);

  // ✨ คำนวณหน้า
  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSorted.slice(start, start + pageSize);
  }, [filteredSorted, currentPage, pageSize]);

  const handleDelete = useCallback(async () => {
    if (!deletingId) return;
    try {
      setBusyDelete(true);
      await apiClient.delete(`/propertypost/${deletingId}`);
      await revalidateUser();
      // ตัดหน้าให้พอดีหลังลบ
      const afterCount = filteredSorted.length - 1;
      const afterTotalPages = Math.max(1, Math.ceil(afterCount / pageSize));
      if (currentPage > afterTotalPages) setPage(afterTotalPages);
      toast({
        title: "ลบประกาศสำเร็จ",
        description: "ข้อมูลถูกลบออกจากระบบแล้ว",
        variant: "success",
      });
    } catch (e) {
      toast({
        title: "ลบไม่สำเร็จ",
        description: e?.response?.data?.message || "โปรดลองอีกครั้ง",
        variant: "destructive",
      });
    } finally {
      setBusyDelete(false);
      setDeletingId(null);
    }
  }, [
    deletingId,
    revalidateUser,
    toast,
    filteredSorted.length,
    currentPage,
    pageSize,
  ]);

  /* ===== Loading skeleton ===== */
  if (loading || (!fetchedRef.current && loadingDetails)) {
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
              <div className="text-xl font-semibold">{stats.confirmed}</div>
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
        <div className="flex flex-col md:flex-row gap-3 md:items-center mb-4">
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
              <option value="CONFIRMED">อนุมัติแล้ว</option>
              <option value="PENDING">รอดำเนินการ</option>
              <option value="REJECTED">ถูกปฏิเสธ</option>
              <option value="SOLD">ขายแล้ว</option>
              {/* ไม่มี HIDDEN ให้เลือก */}
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

        {/* Pagination controls (top-right) */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-500">
            พบ {filteredSorted.length} รายการ
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">แสดงต่อหน้า</label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm"
              aria-label="จำนวนรายการต่อหน้า"
            >
              <option value={6}>6</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
            </select>

            <div className="inline-flex items-center gap-2 ml-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                aria-label="ก่อนหน้า"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                ก่อนหน้า
              </Button>
              <span className="text-sm text-gray-600">
                หน้า {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                aria-label="ถัดไป"
              >
                ถัดไป
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Empty state / Grid */}
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
          <>
            <div className="h-[calc(100vh-200px)] overflow-y-auto pr-1">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {paged.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onEdit={(p) => {
                      setEditingPost(p);
                      setOpenEdit(true);
                    }}
                    onAskDelete={(id) => setDeletingId(id)}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-4">
              <span className="text-sm text-muted-foreground">
                หน้า {currentPage} / {totalPages}
              </span>
              <div className="inline-flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  aria-label="ก่อนหน้า"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  ก่อนหน้า
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  aria-label="ถัดไป"
                >
                  ถัดไป
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
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
          // ดึงรายละเอียดใหม่อัตโนมัติจาก useEffect เมื่อ authUser เปลี่ยน
          toast({
            title: "บันทึกการแก้ไขแล้ว",
            description: "ประกาศถูกอัปเดตเรียบร้อย",
            variant: "success",
          });
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
