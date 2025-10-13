import { useState, useMemo } from "react";
import { Check, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { apiClient } from "@/api/authconfig";
import { useNavigate, useLocation } from "react-router";

export default function SellerDoc() {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | PENDING | APPROVED | REJECTED
    const { authUser, loading, revalidateUser } = useAuth();
    const [reviewingId, setReviewingId] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    const documents = authUser?.DocumentUpload || [];

    const filteredDocs = useMemo(() => {
        const key = searchTerm.trim().toLowerCase();
        return documents
            .filter((doc) => doc.Review_Status !== 'HIDDEN')
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

    const handleReview = async (documentId, status) => {
        if (!window.confirm(`คุณต้องการที่จะ "${status}" เอกสารนี้ใช่หรือไม่?`)) {
            return;
        }

        setReviewingId(documentId);
        try {
            await apiClient.patch(`/update/document/${documentId}`, { status });
            await revalidateUser();
        } catch (error) {
            console.error(`Failed to ${status} document:`, error);
            alert(`เกิดข้อผิดพลาดในการ ${status} เอกสาร`);
        } finally {
            setReviewingId(null);
        }
    };

    const StatusBadge = ({ status }) => {
        let colorClasses = 'bg-yellow-100 text-yellow-800'; // Default to PENDING
        if (status === 'APPROVED') {
            colorClasses = 'bg-green-100 text-green-800';
        } else if (status === 'REJECTED') {
            colorClasses = 'bg-red-100 text-red-800';
        }
        return (
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colorClasses}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Top bar */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-3">
                <div className="relative w-full md:flex-1">
                    <input
                        type="text"
                        placeholder="ค้นหาเอกสาร..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#34495E]"
                    />
                </div>
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
                    filteredDocs.map((doc) => (
                        <div
                            key={doc.id}
                            className="bg-white p-4 rounded-md shadow-sm border border-gray-200"
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <h4 className="font-semibold text-lg">{doc.DocumentName}</h4>
                                    <p className="text-sm text-gray-500 mt-1">
                                        โดย: {doc.User?.First_name || ''} {doc.User?.Last_name || ''}
                                        {' | '}
                                        วันที่: {new Date(doc.createdAt).toLocaleDateString('th-TH')}
                                    </p>
                                    <a
                                        href={doc.DocumentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                                    >
                                        ดูเอกสาร
                                    </a>
                                </div>

                                <div className="flex flex-col items-end gap-2 min-w-[120px]">
                                    <StatusBadge status={doc.Review_Status} />

                                    {doc.Review_Status === 'PENDING' && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
                                                onClick={() => handleReview(doc.id, 'REJECTED')}
                                                disabled={reviewingId === doc.id}
                                            >
                                                <X className="w-4 h-4 mr-1" />
                                                ปฏิเสธ
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                onClick={() => handleReview(doc.id, 'APPROVED')}
                                                disabled={reviewingId === doc.id}
                                            >
                                                <Check className="w-4 h-4 mr-1" />
                                                อนุมัติ
                                            </Button>
                                        </div>
                                    )}

                                    {doc.Review_Status === 'APPROVED' && (
                                        <Button
                                            onClick={() => {
                                                if (!authUser) {
                                                    navigate("/login", { state: { from: location } })
                                                } else if (authUser.userType == "Buyer") {
                                                    navigate('/buyer/deposit-payment', { state: { documentData: doc } })
                                                } else if (authUser.userType == "Seller") {
                                                    // ✅ แก้ไขให้ Seller นำทางไปยังหน้าชำระเงินได้
                                                    navigate('/seller/deposit-payment', { state: { documentData: doc } })
                                                }
                                            }}
                                            className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-3 text-xs mt-2"
                                        >
                                            ชำระเงินมัดจำ
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

