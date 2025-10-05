// src/pages/Profile/SellerDoc.jsx
import { useState, useMemo } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";

/** แปลงสถานะเป็น badge สี ๆ ตาม Prisma: PENDING | APPROVED | REJECTED */
function StatusPill({ value }) {
  const v = (value || "").toUpperCase();
  const cls =
    v === "APPROVED"
      ? "bg-emerald-100 text-emerald-700"
      : v === "REJECTED"
      ? "bg-rose-100 text-rose-700"
      : "bg-amber-100 text-amber-700"; // PENDING (หรืออื่น ๆ)
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${cls}`}>
      {v || "-"}
    </span>
  );
}

/** ลิงก์ปลอดภัย: อนุญาตเฉพาะ http/https */
function isHttpUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function SellerDoc() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | PENDING | APPROVED | REJECTED
  const { authUser, loading } = useAuth();

  const documents = authUser?.DocumentUpload || [];

  const filteredDocs = useMemo(() => {
    const key = searchTerm.trim().toLowerCase();
    return documents
      .filter((doc) =>
        key ? (doc?.DocumentName || "").toLowerCase().includes(key) : true
      )
      .filter((doc) =>
        statusFilter === "ALL"
          ? true
          : (doc?.Review_Status || "").toUpperCase() === statusFilter
      );
  }, [documents, searchTerm, statusFilter]);

  if (loading) {
    return <div className="p-6 text-center">กำลังโหลดข้อมูลเอกสาร...</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Top bar */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-3">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <input
            type="text"
            placeholder="ค้นหาเอกสาร..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#34495E]"
          />
        </div>

        {/* Right - Filter + (optional) Delete */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="ALL">สถานะ: ทั้งหมด</option>
            <option value="PENDING">รอตรวจ</option>
            <option value="APPROVED">อนุมัติแล้ว</option>
            <option value="REJECTED">ถูกปฏิเสธ</option>
          </select>

          {/* ปุ่มลบ (เผื่ออนาคตทำ bulk delete) — ปัจจุบันยังไม่ผูก API เลยปิดไว้ */}
          <Button variant="outline" className="border-gray-400" disabled>
            <Trash2 className="w-5 h-5 text-gray-700" />
          </Button>
        </div>
      </div>

      {/* Document List */}
      <div className="bg-gray-100 p-4 rounded-lg max-h-[400px] overflow-y-auto space-y-3">
        {filteredDocs.length === 0 ? (
          <p className="text-gray-500 text-center">
            {documents.length === 0
              ? "คุณยังไม่มีเอกสารใด ๆ"
              : "ไม่พบเอกสารที่ตรงกับคำค้นหา/ตัวกรอง"}
          </p>
        ) : (
          filteredDocs.map((doc) => {
            const name =
              [doc?.User?.First_name, doc?.User?.Last_name]
                .filter(Boolean)
                .join(" ") || "-";
            const created = doc?.createdAt
              ? new Date(doc.createdAt).toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "-";
            const urlOK = isHttpUrl(doc?.DocumentUrl);

            return (
              <Card
                key={doc.id}
                className="bg-white rounded-md shadow-sm border border-gray-200"
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-lg truncate">
                        {doc?.DocumentName || "-"}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        โดย: {name} {" | "} วันที่: {created}
                      </p>

                      {/* ลิงก์เอกสาร */}
                      {urlOK ? (
                        <a
                          href={doc.DocumentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                        >
                          ดูเอกสาร
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400 mt-1 inline-block">
                          ไม่มีลิงก์เอกสารที่เปิดได้
                        </span>
                      )}

                      {/* เหตุผลถูกปฏิเสธ (ถ้ามี) */}
                      {(doc?.Review_Status || "").toUpperCase() ===
                        "REJECTED" &&
                        doc?.Rejection_Note && (
                          <div className="mt-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded px-3 py-2">
                            เหตุผลที่ถูกปฏิเสธ: {doc.Rejection_Note}
                          </div>
                        )}
                    </div>

                    <StatusPill value={doc?.Review_Status} />
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
