import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Check, X, FileText, Loader2 } from "lucide-react"; // (นำ Loader2 มาใช้)
import { Button } from "@/components/ui/button";
import { apiClient } from "@/api/authconfig";
import { useNavigate } from "react-router";

// Component สำหรับแสดงป้ายสถานะ
const StatusBadge = ({ status }) => {
    let colorClasses = 'bg-gray-100 text-gray-800';
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
        case 'REJECTED': // (อาจไม่จำเป็นต้องใช้ แต่ใส่ไว้เผื่อ)
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


export default function SellerDoc() {
    const { authUser, loading, revalidateUser } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState('PENDING');
    const [reviewingId, setReviewingId] = useState(null);
    const navigate = useNavigate()

    useEffect(() => {
        // ตั้งเวลาให้ revalidateUser ทำงานทุกๆ 15 วินาที
        const intervalId = setInterval(() => {
            console.log("Polling for new seller data...");
            revalidateUser();
        }, 15000);

        // Cleanup function เพื่อหยุดการทำงานเมื่อออกจากหน้านี้
        return () => clearInterval(intervalId);

    }, [revalidateUser]);
    // 1. ดึงข้อมูลเอกสารทั้งหมดจากทุกโพสต์ของ Seller
    const allDocumentsFromPosts = useMemo(() => {
        if (!authUser?.PropertyPost) return [];
        return authUser.PropertyPost.flatMap(post => post.DocumentUpload || []);
    }, [authUser]);

    // 2. จัดกลุ่มและกรองข้อมูล
    const groupedApplications = useMemo(() => {
        // 1. ดึงข้อมูล 2 แหล่ง
        const docsFromOthers = authUser?.PropertyPost?.flatMap(post => post.DocumentUpload || []) || [];
        const docsFromMe = authUser?.DocumentUpload || [];

        // 2. รวมและคัดกรองข้อมูลซ้ำ
        const allDocumentsMap = new Map();
        [...docsFromOthers, ...docsFromMe].forEach(doc => {
            if (doc) {
                allDocumentsMap.set(doc.id, doc);
            }
        });
        const allUniqueDocuments = Array.from(allDocumentsMap.values());

        // 3. นำข้อมูลที่รวมแล้วไปประมวลผล
        const grouped = allUniqueDocuments
            .filter(doc => doc.unitId)
            .reduce((acc, doc) => {
                if (!acc[doc.unitId]) {
                    acc[doc.unitId] = {
                        unitId: doc.unitId,
                        unitNumber: doc.unit?.Unit_Number || doc.unitId.slice(-6),
                        propertyName: doc.Post?.Property_Name || 'ไม่ระบุชื่อโครงการ',
                        buyerName: `${doc.User?.First_name || ''} ${doc.User?.Last_name || ''}`,
                        buyerUserId: doc.User?.id,
                        createdAt: doc.createdAt,
                        depositStatus: doc.unit?.Deposit?.Deposit_Status,
                        bookingStatus: doc.unit?.Booking?.bookingStatus,
                        documents: []
                    };
                }
                acc[doc.unitId].documents.push(doc);
                return acc;
            }, {});

        // 4. Map ข้อมูล, คำนวณ groupStatus, และกรองตาม searchTerm
        const processedApps = Object.values(grouped)
            .map(app => {
                const statuses = app.documents.map(d => d.Review_Status);
                let groupStatus;
                if (statuses.some(s => s === 'REJECTED')) groupStatus = 'REJECTED';
                else if (statuses.every(s => s === 'APPROVED')) groupStatus = 'APPROVED';
                else if (statuses.every(s => s === 'HIDDEN')) groupStatus = 'HIDDEN';
                else groupStatus = 'PENDING';

                return { ...app, groupStatus };
            })
            .filter(app => {
                const key = searchTerm.trim().toLowerCase();
                if (!key) return true;
                const buyerMatch = app.buyerName.toLowerCase().includes(key);
                const propertyMatch = app.propertyName.toLowerCase().includes(key);
                return buyerMatch || propertyMatch;
            });

        // ==========================================================
        // (สำคัญ) 5. กรองตาม Tab ที่เลือก เป็นขั้นตอนสุดท้าย
        // ==========================================================
        return processedApps.filter(app => {
            // กรองรายการที่มีสถานะ 'HIDDEN' ออกไปก่อนเสมอ
            // if (app.groupStatus === 'HIDDEN') {
            //     return false;
            // }

            // จากนั้นจึงกรองตาม Tab ที่เลือก
            if (activeTab === "ALL") {
                return true;
            }
            return app.groupStatus === activeTab;
        });

    }, [authUser, searchTerm, activeTab]); // Dependency array ที่ถูกต้อง

    // 3. ฟังก์ชันสำหรับอนุมัติ/ปฏิเสธ
    const handleReview = async (application, newStatus) => {
        const actionText = newStatus === 'APPROVED' ? 'อนุมัติ' : 'ปฏิเสธ';
        if (!window.confirm(`คุณต้องการที่จะ "${actionText}" เอกสารทั้งกลุ่มนี้ใช่หรือไม่?`)) {
            return;
        }

        setReviewingId(application.unitId);
        try {
            const updatePromises = application.documents.map(doc =>
                apiClient.patch(`/update/document/${doc.id}`, { status: newStatus })
            );
            await Promise.all(updatePromises);
            alert(`ดำเนินการ "${actionText}" เอกสารสำเร็จ`);
            await revalidateUser();
        } catch (error) {
            console.error(`Failed to ${newStatus} application:`, error);
            alert(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
        } finally {
            setReviewingId(null);
        }
    };

    if (loading) {
        return <div className="p-4 text-center">กำลังโหลดข้อมูล...</div>;
    }

    return (
        <div className="p-4 md:p-6 max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">เอกสารสำหรับตรวจสอบ</h2>

            {/* --- ส่วนของ Filter และ Slide Tab --- */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
                <input
                    type="text"
                    placeholder="ค้นหาจากชื่อผู้ซื้อ หรือชื่อโครงการ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-4 py-2"
                />

                {/* (สำคัญ) เปลี่ยนจาก div ที่มี button เป็น select dropdown */}
                <select
                    value={activeTab}
                    onChange={(e) => setActiveTab(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 md:w-auto w-full"
                >
                    <option value="ALL">สถานะทั้งหมด</option>
                    <option value="PENDING">รอตรวจสอบ</option>
                    <option value="APPROVED">อนุมัติแล้ว</option>
                    <option value="REJECTED">ถูกปฏิเสธ</option>
                    <option value="HIDDEN">สำเร็จ</option>
                </select>
            </div>

            {/* --- ส่วนแสดงรายการเอกสาร --- */}
            <div className="bg-gray-100 p-4 rounded-lg max-h-[600px] overflow-y-auto space-y-4">
                {groupedApplications.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">
                        <p>ไม่พบเอกสารในหมวดหมู่นี้</p>
                    </div>
                ) : (
                    groupedApplications.map((app) => {
                        // --- Logic ตรวจสอบสถานะสำหรับการ์ดที่กดได้ ---
                        const isMyOwn = authUser.id === app.buyerUserId;
                        const groupIsApproved = app.groupStatus === 'APPROVED';
                        const depositIsNotConfirmed = app.depositStatus !== 'CONFIRMED';

                        // เงื่อนไขสุดท้ายที่จะทำให้ปุ่มแสดง
                        const shouldShowPayButton = isMyOwn && groupIsApproved && depositIsNotConfirmed;

                        //                     console.log(`
                        // --------------------------------
                        // [DEBUG CARD] โครงการ: ${app.propertyName}
                        // - เป็นเอกสารของฉัน?: ${isMyOwn} (My ID: ${authUser.id}, Owner ID: ${app.buyerUserId})
                        // - สถานะกลุ่มอนุมัติ?: ${groupIsApproved} (สถานะจริง: '${app.groupStatus}')
                        // - สถานะมัดจำยังไม่จ่าย?: ${depositIsNotConfirmed} (สถานะจริง: '${app.depositStatus}')
                        // - ==> ควรแสดงปุ่มชำระเงิน?: ${shouldShowPayButton}
                        // --------------------------------
                        // `);
                        // ==========================================================


                        // --- Logic ตรวจสอบสถานะสำหรับการ์ดที่กดได้ (โค้ดส่วนนี้เหมือนเดิม) ---
                        const isReadyForPayment = isMyOwn && groupIsApproved && depositIsNotConfirmed;

                        const cardClassName = `bg-white p-4 rounded-lg shadow-sm border flex flex-col gap-4 relative ${isReadyForPayment ? 'cursor-pointer hover:border-blue-500 hover:shadow-md transition-all' : ''
                            }`;

                        const handleCardClick = isReadyForPayment
                            ? () => navigate('/seller/deposit-payment', { state: { documentData: app.documents[0] } })
                            : undefined;

                        return (
                            <div key={app.unitId} className={cardClassName} onClick={handleCardClick}>

                                {/* --- ส่วนหัวข้อของการ์ด --- */}
                                <div className="flex justify-between items-start flex-wrap gap-3">
                                    <div className="flex-grow">
                                        <h3 className="font-bold text-gray-800 text-lg">
                                            โครงการ: {app.propertyName}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            ยูนิต: <span className="font-semibold text-gray-700">{app.unitNumber}</span>
                                        </p>
                                        <p className="text-sm text-gray-500 mt-0.5">
                                            ผู้ส่ง: <span className="font-semibold text-gray-700">{app.buyerName}</span> | ส่งเมื่อ: {new Date(app.createdAt).toLocaleDateString('th-TH')}
                                        </p>
                                    </div>
                                    <StatusBadge status={app.groupStatus} />
                                </div>

                                {/* --- ส่วนรายการไฟล์เอกสาร --- */}
                                <div className="border-t pt-4 mt-2">
                                    <p className="font-semibold text-gray-700 mb-2">เอกสารที่แนบมา ({app.documents.length} ฉบับ):</p>
                                    <ul className="list-none pl-0 space-y-2">
                                        {app.documents.map((doc) => (
                                            <li key={doc.id} className="flex items-center gap-4 py-1 px-2">
                                                <a href={doc.DocumentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                                                    <FileText size={16} />
                                                    <span className="truncate">{doc.DocumentName || 'เอกสารไม่ระบุชื่อ'}</span>
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* --- ส่วน Action ท้ายการ์ด (Logic 2 บทบาท) --- */}
                                <div className="mt-4 border-t pt-4">

                                    {/* --- กรณีที่เป็นเอกสารของตัวเอง (Seller สวมบท Buyer) --- */}
                                    {isMyOwn ? (
                                        <>
                                            {app.groupStatus === 'APPROVED' && (
                                                <>
                                                    {app.depositStatus !== 'CONFIRMED' && (
                                                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                                            ชำระเงินมัดจำ
                                                        </Button>
                                                    )}
                                                    {app.depositStatus === 'CONFIRMED' && !app.bookingStatus && (
                                                        <Button onClick={() => navigate(`/booking/${app.documents[0].postId}/${app.unitId}`)} className="w-full bg-green-600 hover:bg-green-700 text-white">
                                                            นัดวันเจรจา
                                                        </Button>
                                                    )}
                                                    {app.depositStatus === 'CONFIRMED' && app.bookingStatus && (
                                                        <div className="text-center text-sm text-gray-700 font-semibold p-2.5 bg-gray-100 rounded-md">✅ นัดหมายเรียบร้อยแล้ว</div>
                                                    )}
                                                </>
                                            )}
                                            {app.groupStatus === 'PENDING' && <p className="text-center text-sm text-gray-500">เอกสารของคุณอยู่ระหว่างการตรวจสอบ</p>}
                                            {app.groupStatus === 'REJECTED' && <p className="text-center text-sm text-red-600">เอกสารถูกปฏิเสธ</p>}
                                            {app.groupStatus === 'HIDDEN' && <div className="text-center text-sm text-gray-700 font-semibold p-2.5 bg-gray-100 rounded-md">✅ ขั้นตอนเสร็จสมบูรณ์</div>}
                                        </>
                                    ) : (
                                        /* --- กรณีที่เป็นเอกสารของคนอื่น (Seller ทั่วไป) --- */
                                        <>
                                            {app.groupStatus === 'PENDING' && (
                                                <div className="flex items-center justify-end gap-3">
                                                    <Button variant="outline" onClick={() => handleReview(app, 'REJECTED')} disabled={reviewingId === app.unitId} className="border-red-500 text-red-500 hover:bg-red-50">
                                                        {reviewingId === app.unitId ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                                                        <span className="ml-2">ปฏิเสธ</span>
                                                    </Button>
                                                    <Button onClick={() => handleReview(app, 'APPROVED')} disabled={reviewingId === app.unitId} className="bg-green-600 hover:bg-green-700 text-white">
                                                        {reviewingId === app.unitId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                        <span className="ml-2">อนุมัติ</span>
                                                    </Button>
                                                </div>
                                            )}
                                            {app.groupStatus === 'APPROVED' && (
                                                <>
                                                    {app.depositStatus !== 'CONFIRMED' && <p className="text-center text-sm text-blue-600 font-semibold">รอผู้ซื้อชำระเงินมัดจำและนัดหมาย...</p>}
                                                    {app.depositStatus === 'CONFIRMED' && !app.bookingStatus && <p className="text-center text-sm text-green-600 font-semibold">ผู้ซื้อชำระเงินแล้ว, รอนัดวันเจรจา...</p>}
                                                    {app.depositStatus === 'CONFIRMED' && app.bookingStatus && <div className="text-center text-sm text-gray-700 font-semibold p-2.5 bg-gray-100 rounded-md">✅ ผู้ซื้อนัดหมายเรียบร้อยแล้ว</div>}
                                                </>
                                            )}
                                            {app.groupStatus === 'HIDDEN' && <div className="text-center text-sm text-gray-700 font-semibold p-2.5 bg-gray-100 rounded-md">✅ ขั้นตอนเสร็จสมบูรณ์</div>}
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}