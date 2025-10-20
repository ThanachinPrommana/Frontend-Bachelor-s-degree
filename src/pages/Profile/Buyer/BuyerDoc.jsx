import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { FileText, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { apiClient } from "@/api/authconfig";

// Component สำหรับแสดงป้ายสถานะ (เหมือนใน SellerDoc)
const StatusBadge = ({ status }) => {
  let colorClasses = 'bg-gray-100 text-gray-800'; // Default
  let statusText = status;

  switch (status) {
    case 'PENDING':
      colorClasses = 'bg-yellow-100 text-yellow-800';
      statusText = 'รอตรวจสอบ';
      break;
    case 'APPROVED':
      colorClasses = 'bg-green-100 text-green-800';
      statusText = 'อนุมัติแล้ว';
      break;
    case 'REJECTED':
      colorClasses = 'bg-red-100 text-red-800';
      statusText = 'ถูกปฏิเสธ';
      break;
    case 'HIDDEN':
      colorClasses = 'bg-gray-100 text-gray-800';
      statusText = "สำเร็จ"
      break;
  }
  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${colorClasses}`}>
      {statusText}
    </span>
  );
};


const BuyerDoc = () => {

  const { authUser, loading, revalidateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    // ตั้งเวลาให้ revalidateUser ทำงานทุกๆ 15 วินาที (15000 milliseconds)
    const intervalId = setInterval(() => {
      console.log("Polling for new data..."); // (ตัวเลือก) ใส่ log เพื่อดูการทำงาน
      revalidateUser();
    }, 15000); // <-- คุณสามารถปรับเวลาตรงนี้ได้ตามต้องการ (เช่น 10000 = 10 วินาที)

    // Cleanup function: จะทำงานเมื่อ component ถูก unmount (ออกจากหน้านี้ไป)
    // เพื่อหยุดการทำงานของ setInterval ไม่ให้ทำงานเบื้องหลังโดยไม่จำเป็น
    return () => clearInterval(intervalId);

  }, [revalidateUser]);

  const groupedApplications = useMemo(() => {
    const documents = authUser?.DocumentUpload || [];
    // (เพิ่ม) ใส่ log ตรงนี้เพื่อยืนยันอีกครั้ง
    console.log("Data for useMemo:", { documents, authUser });

    if (documents.length === 0) {
      return []; // ถ้าไม่มีเอกสาร ก็ return array ว่างไปเลย
    }

    const grouped = documents
      .filter(doc => doc.unitId)
      .reduce((acc, doc) => {

        if (!acc[doc.unitId]) {
          acc[doc.unitId] = {

            unitId: doc.unitId,
            unitNumber: doc.unit?.Unit_Number || doc.unitId.slice(-6),
            propertyName: doc.Post?.Property_Name || 'ไม่ระบุชื่อโครงการ',
            createdAt: doc.createdAt,
            depositStatus: doc.unit?.Deposit?.Deposit_Status,
            bookingStatus: doc.unit?.Booking?.bookingStatus,
            documents: []
          };
        }
        acc[doc.unitId].documents.push(doc);
        return acc;
      }, {});

    return Object.values(grouped)
      .map(app => {
        const statuses = app.documents.map(d => d.Review_Status);
        let groupStatus;

        if (statuses.every(s => s === 'APPROVED')) {
          groupStatus = 'APPROVED';
        } else if (statuses.every(s => s === 'PENDING')) {
          groupStatus = 'PENDING';
        } else if (statuses.every(s => s === 'REJECTED')) {
          groupStatus = 'REJECTED';
        } else if (statuses.every(s => s === 'HIDDEN')) {
          groupStatus = 'HIDDEN';
        } else if (statuses.some(s => s === 'REJECTED')) {
          groupStatus = 'REJECTED';
        } else {
          groupStatus = 'MIXED_STATUS'; // กรณีอื่นๆ ที่มีสถานะผสมกัน
        }

        return { ...app, groupStatus };
      })
      .filter(app => {
        const key = searchTerm.trim().toLowerCase();
        if (!key) return true;
        const propertyMatch = app.propertyName.toLowerCase().includes(key);
        const docNameMatch = app.documents.some(d => (d.DocumentName || "").toLowerCase().includes(key));
        return propertyMatch || docNameMatch;
      })
      .filter(app => {
        if (statusFilter === "ALL") return true;
        return app.groupStatus === statusFilter;
      });
  }, [authUser, searchTerm, statusFilter,]);

  const handleRemoveApplication = async (application) => {
    if (!window.confirm("คุณต้องการลบเอกสารชุดนี้ใช่หรือไม่?")) {
      return;
    }
    setDeletingId(application.unitId);
    try {
      const deletePromises = application.documents.map(doc =>
        apiClient.delete(`/remove/document/${doc.id}`)
      );
      await Promise.all(deletePromises);
      alert("ลบเอกสารสำเร็จ");
      await revalidateUser();
    } catch (error) {
      console.error("Failed to remove application:", error);
      alert("เกิดข้อผิดพลาดในการลบเอกสาร: " + (error.response?.data?.message || error.message));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">กำลังโหลดข้อมูล...</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">เอกสารของฉัน</h2>

      {/* --- ส่วน Filter --- */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <input
          type="text"
          placeholder="ค้นหาจากชื่อโครงการ หรือชื่อเอกสาร..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="ALL">สถานะทั้งหมด</option>
          <option value="PENDING">รอตรวจสอบ</option>
          <option value="APPROVED">อนุมัติแล้ว</option>
          <option value="REJECTED">ถูกปฏิเสธ</option>
          <option value="HIDDEN">สำเร็จ</option>
          {/* (ตัวเลือก Filter อื่นๆ สามารถเพิ่มได้ตามต้องการ) */}
        </select>
      </div>

      {/* --- ส่วนแสดงรายการเอกสาร --- */}
      <div className="bg-gray-100 p-4 rounded-lg max-h-[600px] overflow-y-auto space-y-4">
        {groupedApplications.length === 0 ? (
          <div className="text-center text-gray-500 py-10 bg-gray-50 rounded-lg">
            <p>ไม่พบเอกสาร</p>
          </div>
        ) : (
          groupedApplications.map((app) => {

            // ==========================================================
            // (สำคัญ) เพิ่ม CONSOLE.LOG ไว้ที่บรรทัดแรกสุดใน MAP
            // ==========================================================
            console.log(`[CARD RENDER] Property: ${app.propertyName}`, {
              groupStatus: app.groupStatus,
              depositStatus: app.depositStatus,
              bookingStatus: app.bookingStatus,
            });
            // ==========================================================

            return (
              <div key={app.unitId} className="bg-white p-4 rounded-lg shadow-sm border flex flex-col gap-4 relative">

                {/* --- ส่วนปุ่มลบ (ถ้ามี) --- */}
                {app.groupStatus === 'HIDDEN' && (
                  <button
                    onClick={() => handleRemoveApplication(app)}
                    disabled={deletingId === app.unitId}
                    className="absolute top-3 right-3 p-1 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    aria-label="ลบเอกสาร"
                  >
                    {deletingId === app.unitId
                      ? <Loader2 className="w-5 h-5 animate-spin" />
                      : <Trash2 className="w-5 h-5" />
                    }
                  </button>
                )}

                {/* --- ส่วนหัวข้อของการ์ด --- */}
                <div className="flex justify-between items-start flex-wrap gap-3">
                  <div className="flex-grow pr-8">
                    <h3 className="font-bold text-gray-800 text-lg">
                      สำหรับโครงการ: {app.propertyName}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      ยูนิต: <span className="font-semibold text-gray-700">{app.unitNumber}</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      ส่งเมื่อ: {new Date(app.createdAt).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                </div>

                {/* --- ส่วนรายการไฟล์เอกสาร --- */}
                <div className="border-t pt-4 mt-2">
                  <p className="font-semibold text-gray-700 mb-2">เอกสารที่แนบมา ({app.documents.length} ฉบับ):</p>
                  <ul className="list-none pl-0 space-y-2">
                    {app.documents.map((doc) => (
                      <li key={doc.id} className="flex justify-between items-center gap-4 py-1 px-2 rounded hover:bg-gray-50 transition-colors">
                        <a href={doc.DocumentUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-600 hover:underline hover:text-blue-800 flex-grow">
                          <FileText size={16} />
                          <span className="truncate">{doc.DocumentName || 'เอกสารไม่ระบุชื่อ'}</span>
                        </a>
                        <StatusBadge status={doc.Review_Status} />
                      </li>
                    ))}
                  </ul>
                </div>

                {/* --- ส่วน Action ท้ายการ์ด --- */}
                <div className="mt-4 border-t pt-4">

                  {/* --- เงื่อนไขสำหรับสถานะ APPROVED --- */}
                  {(app.groupStatus === 'APPROVED') && (
                    <>
                      {/* สถานะ 1: รอชำระเงิน */}
                      {app.depositStatus !== 'CONFIRMED' && (
                        <Button
                          onClick={() => navigate('/buyer/deposit-payment', { state: { documentData: app.documents[0] } })}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5"
                        >
                          ชำระเงินมัดจำ
                        </Button>
                      )}

                      {/* สถานะ 2: ชำระเงินแล้ว, รอนัดหมาย */}
                      {app.depositStatus === 'CONFIRMED' && !app.bookingStatus && (
                        <Button
                          onClick={() => navigate(`/booking/${app.documents[0].postId}/${app.unitId}`)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5"
                        >
                          นัดวันเจรจา
                        </Button>
                      )}

                      {/* สถานะ 3: นัดหมายเรียบร้อยแล้ว */}
                      {app.depositStatus === 'CONFIRMED' && app.bookingStatus && (
                        <div className="text-center text-sm text-gray-700 font-semibold p-2.5 bg-gray-100 rounded-md">
                          ✅ นัดหมายเรียบร้อยแล้ว
                        </div>
                      )}
                    </>
                  )}

                  {/* --- เงื่อนไขสำหรับสถานะอื่นๆ --- */}
                  {app.groupStatus === 'PENDING' && (
                    <p className="text-center text-sm text-gray-500">เอกสารของคุณอยู่ระหว่างการตรวจสอบ</p>
                  )}
                  {app.groupStatus === 'REJECTED' && (
                    <p className="text-center text-sm text-red-600">เอกสารชุดนี้ถูกปฏิเสธ กรุณาส่งไปใหม่</p>
                  )}
                  {app.groupStatus === 'MIXED_STATUS' && (
                    <p className="text-center text-sm text-blue-600">สถานะเอกสารไม่ตรงกัน กรุณาตรวจสอบ</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BuyerDoc;