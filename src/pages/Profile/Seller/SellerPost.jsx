// src/pages/Profile/SellerPost.jsx
import React, { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/api/authconfig";
import { Home } from "lucide-react";
import { Link } from "react-router-dom";

const formatPrice = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString() : "-";
};

const SellerPost = () => {
  const { authUser, loading, revalidateUser } = useAuth();
  const [q, setQ] = useState("");
  const [deleting, setDeleting] = useState(null);

  const posts = authUser?.PropertyPost ?? [];

  const filtered = useMemo(() => {
    if (!q.trim()) return posts;
    const key = q.toLowerCase();
    return posts.filter((p) => {
      const name = p?.Property_Name || "";
      const addr = p?.Address || "";
      const prov = p?.Province || "";
      return (
        name.toLowerCase().includes(key) ||
        addr.toLowerCase().includes(key) ||
        prov.toLowerCase().includes(key)
      );
    });
  }, [q, posts]);

  const handleDelete = async (postId) => {
    if (!confirm("ยืนยันลบโพสต์นี้?")) return;
    try {
      setDeleting(postId);
      await apiClient.delete(`/propertypost/${postId}`);
      await revalidateUser();
    } catch (e) {
      alert(e?.response?.data?.message || "ลบไม่สำเร็จ");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="animate-pulse h-10 w-1/2 bg-gray-200 rounded mb-4" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="flex items-center space-x-4 border p-4 rounded-xl"
            >
              <div className="w-24 h-24 bg-gray-200 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    // 👇 เพิ่ม h-[80vh] + overflow-y-auto
    <div className="p-6 max-w-3xl mx-auto h-[80vh] overflow-y-auto">
      {/* Search */}
      <div className="flex items-center justify-between mb-6 space-x-4">
        <input
          type="text"
          placeholder="ค้นหา: ชื่อประกาศ/ที่อยู่/จังหวัด"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-grow border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#34495E]"
        />
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="text-center text-gray-600 py-10">
          <p className="mb-4">
            {posts.length
              ? "ไม่พบผลลัพธ์ที่ตรงกับคำค้น"
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
        <div className="space-y-6">
          {filtered.map((post) => {
            const cover = post?.Image?.[0]?.url;
            return (
              <div
                key={post.id}
                className="flex items-center space-x-4 border border-gray-300 p-4 rounded-xl shadow-sm relative"
              >
                {cover ? (
                  <img
                    src={cover}
                    alt={post.Property_Name || "cover"}
                    className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Home className="w-6 h-6 text-gray-400" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold truncate">
                    {post.Property_Name || "-"}
                  </h3>
                  <p className="text-gray-600 mt-1 truncate">
                    {post.Address || "-"}
                  </p>
                  <p className="text-gray-600">{post.Province || "-"}</p>
                  <p className="text-green-600 font-bold mt-1 text-lg">
                    {formatPrice(post.Price)} บาท
                  </p>
                </div>

                {/* ปุ่มลบ */}
                <button
                  onClick={() => handleDelete(post.id)}
                  disabled={deleting === post.id}
                  className="absolute right-4 top-1/2 -translate-y-1/2 border-2 border-red-500 text-red-600 px-4 py-1 rounded-md font-medium hover:bg-red-500 hover:text-white transition disabled:opacity-50"
                >
                  {deleting === post.id ? "กำลังลบ..." : "ลบ"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SellerPost;
