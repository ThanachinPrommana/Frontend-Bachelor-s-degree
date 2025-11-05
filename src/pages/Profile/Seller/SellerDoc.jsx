import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Check, X, FileText, Loader2 } from "lucide-react"; // (นำ Loader2 มาใช้)
import { Button } from "@/components/ui/button";
import { apiClient } from "@/api/authconfig";
import { useNavigate } from "react-router";
import FinalSlipCard from "@/components/FinalSlipCard";
import { useToast } from "@/components/ui/use-toast";

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
        // case 'HIDDEN':
        //     colorClasses = 'bg-gray-100 text-gray-800';
        //     statusText = "สำเร็จ"
        //     break;
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
    const [activeTab, setActiveTab] = useState('ALL');
    const [reviewingId, setReviewingId] = useState(null);
    const [confirmingId, setConfirmingId] = useState(null);
    const navigate = useNavigate()
    const { toast } = useToast();

    // useEffect(() => {
    //     if (authUser) {
    //         console.log("--- FULL AUTHUSER DATA RECEIVED BY FRONTEND ---");
    //         console.log(JSON.stringify(authUser, null, 2));
    //     }
    // }, [authUser]);


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
    // const groupedApplications = useMemo(() => {
    //     // 1. ดึงข้อมูล 2 แหล่ง
    //     const docsFromOthers = authUser?.PropertyPost?.flatMap(post => post.DocumentUpload || []) || [];
    //     const docsFromMe = authUser?.DocumentUpload || [];

    //     // 2. รวมและคัดกรองข้อมูลซ้ำ
    //     const allDocumentsMap = new Map();
    //     [...docsFromOthers, ...docsFromMe].forEach(doc => {
    //         if (doc) {
    //             allDocumentsMap.set(doc.id, doc);
    //         }
    //     });
    //     const allUniqueDocuments = Array.from(allDocumentsMap.values());

    //     // 3. นำข้อมูลที่รวมแล้วไปประมวลผล
    //     const grouped = allUniqueDocuments
    //         .filter(doc => doc.unitId)
    //         .reduce((acc, doc) => {
    //             if (!acc[doc.unitId]) {

    //                 // const parentPost = authUser?.PropertyPost?.find(p => p.id === doc.postId);
    //                 // const unitData = parentPost?.PropertyUnit?.find(u => u.id === doc.unitId);
    //                 // const bookingData = unitData?.Booking;
    //                 // const bookingData = doc.unit?.Booking;

    //                 // const parentPost = authUser?.PropertyPost?.find(p => p.id === doc.postId);


    //                 // acc[doc.unitId] = {
    //                 //     //ส่วนแรก
    //                 //     // unitId: doc.unitId,
    //                 //     // unitNumber: doc.unit?.Unit_Number || doc.unitId.slice(-6),
    //                 //     // propertyName: doc.Post?.Property_Name || 'ไม่ระบุชื่อโครงการ',
    //                 //     // buyerName: `${doc.User?.First_name || ''} ${doc.User?.Last_name || ''}`,
    //                 //     // buyerUserId: doc.User?.id,
    //                 //     // createdAt: doc.createdAt,
    //                 //     // depositStatus: doc.unit?.Deposit?.Deposit_Status,
    //                 //     // bookingStatus: doc.unit?.Booking?.bookingStatus,
    //                 //     // documents: []
    //                 //     // unitId: doc.unitId,

    //                 //     //ส่วนสอง
    //                 //     // unitNumber: unitData?.Unit_Number || doc.unit?.Unit_Number || 'N/A',
    //                 //     // propertyName: parentPost?.Property_Name || doc.Post?.Property_Name || 'N/A',
    //                 //     // buyerName: `${bookingData?.Buyer?.user?.First_name || doc.User?.First_name || ''} ${bookingData?.Buyer?.user?.Last_name || doc.User?.Last_name || ''}`,
    //                 //     // buyerUserId: bookingData?.Buyer?.user?.id || doc.User?.id,
    //                 //     // createdAt: doc.createdAt,
    //                 //     // depositStatus: doc.unit?.Deposit?.Deposit_Status,
    //                 //     // bookingStatus: bookingData?.bookingStatus,
    //                 //     // bookingId: bookingData?.id,
    //                 //     // finalSlipUrl: bookingData?.finalSlipUrl,
    //                 //     // documents: []

    //                 //     unitId: doc.unitId,
    //                 //     unitNumber: doc.unit?.Unit_Number || 'N/A',
    //                 //     propertyName: parentPost?.Property_Name || doc.Post?.Property_Name || 'N/A',
    //                 //     buyerName: `${doc.User?.First_name || ''} ${doc.User?.Last_name || ''}`,
    //                 //     buyerUserId: doc.User?.id,
    //                 //     createdAt: doc.createdAt,
    //                 //     depositStatus: doc.unit?.Deposit?.Deposit_Status,

    //                 //     // ใช้ bookingData ที่ดึงมาโดยตรง
    //                 //     bookingStatus: bookingData?.bookingStatus,
    //                 //     bookingId: bookingData?.id,
    //                 //     finalSlipUrl: bookingData?.finalSlipUrl,

    //                 //     documents: []
    //                 // };
    //             }
    //             acc[doc.unitId].documents.push(doc);
    //             return acc;
    //         }, {});

    //     // 4. Map ข้อมูล, คำนวณ groupStatus, และกรองตาม searchTerm
    //     const processedApps = Object.values(grouped)
    //         .map(app => {
    //             const statuses = app.documents.map(d => d.Review_Status);
    //             let groupStatus;
    //             if (statuses.some(s => s === 'REJECTED')) groupStatus = 'REJECTED';
    //             else if (statuses.every(s => s === 'APPROVED')) groupStatus = 'APPROVED';
    //             else if (statuses.every(s => s === 'HIDDEN')) groupStatus = 'HIDDEN';
    //             else groupStatus = 'PENDING';

    //             return { ...app, groupStatus };
    //         })
    //         .filter(app => {
    //             const key = searchTerm.trim().toLowerCase();
    //             if (!key) return true;
    //             const buyerMatch = app.buyerName.toLowerCase().includes(key);
    //             const propertyMatch = app.propertyName.toLowerCase().includes(key);
    //             return buyerMatch || propertyMatch;
    //         });

    //     // ==========================================================
    //     // (สำคัญ) 5. กรองตาม Tab ที่เลือก เป็นขั้นตอนสุดท้าย
    //     // ==========================================================
    //     return processedApps.filter(app => {
    //         // กรองรายการที่มีสถานะ 'HIDDEN' ออกไปก่อนเสมอ
    //         // if (app.groupStatus === 'HIDDEN') {
    //         //     return false;
    //         // }

    //         // จากนั้นจึงกรองตาม Tab ที่เลือก
    //         if (activeTab === "ALL") {
    //             return true;
    //         }
    //         return app.groupStatus === activeTab;
    //     });

    // }, [authUser, searchTerm, activeTab]); // Dependency array ที่ถูกต้อง

    const groupedApplications = useMemo(() => {
        if (!authUser) return [];

        const applications = new Map();

        // --- ส่วนที่ 1: จัดการ DocumentUpload (เหมือนเดิม) ---
        const docsFromOthers = authUser.PropertyPost?.flatMap(post => post.DocumentUpload || []) || [];
        const docsFromMe = authUser.DocumentUpload || [];
        const allUniqueDocuments = Array.from(new Map([...docsFromOthers, ...docsFromMe].map(doc => doc && [doc.id, doc])).values()).filter(Boolean);

        if (docsFromMe.length > 0) {
            console.log("--- DEBUG: docsFromMe (เอกสารที่ฉันส่ง) ---");
            console.log("Auth User ID:", authUser.id);
            console.log("First doc from me:", docsFromMe[0]);
            console.log("Does first doc have User.id?", docsFromMe[0]?.User?.id);
        }

        allUniqueDocuments.forEach(doc => {
            if (!doc.unitId) return;
            if (!applications.has(doc.unitId)) {
                applications.set(doc.unitId, {
                    unitId: doc.unitId,
                    unitNumber: doc.unit?.Unit_Number || 'N/A',
                    propertyName: doc.Post?.Property_Name || 'N/A',
                    buyerName: `${doc.User?.First_name || ''} ${doc.User?.Last_name || ''}`,
                    buyerUserId: doc.User?.id || doc.userId, // ⭐️ (แก้ไข) ใช้ doc.User?.id || doc.userId
                    createdAt: doc.createdAt,
                    depositStatus: doc.unit?.Deposit?.Deposit_Status,
                    documents: [],
                });
            }
            applications.get(doc.unitId).documents.push(doc);
        });

        // --- ส่วนที่ 2: นำข้อมูล Booking ทั้งหมดมาพิจารณา ---
        authUser.PropertyPost?.forEach(post => {
            post.PropertyUnit?.forEach(unit => {
                const booking = unit.Booking;
                // (แก้ไข) ทำงานกับทุก Booking ที่มีอยู่ ไม่ใช่แค่สถานะเดียว
                if (booking) {
                    const app = applications.get(unit.id) || { unitId: unit.id, documents: [] };

                    applications.set(unit.id, {
                        ...app,
                        unitNumber: unit.Unit_Number,
                        propertyName: post.Property_Name,
                        postId: post.id,
                        bookingStatus: booking.bookingStatus,
                        bookingId: booking.id,
                        finalSlipUrl: booking.finalSlipUrl,
                        buyerName: `${booking.Buyer?.user?.First_name || app.buyerName || ''} ${booking.Buyer?.user?.Last_name || app.buyerName ? '' : ''}`.trim(),
                        buyerUserId: booking.Buyer?.user?.id || app.buyerUserId,
                    });
                }
            });
        });

        // --- ส่วนที่ 3: ประมวลผลและกรอง ---
        return Array.from(applications.values())
            .map(app => {
                let groupStatus;
                // จัดลำดับความสำคัญ: สลิปสุดท้าย > สถานะเอกสาร
                if (app.bookingStatus === 'COMPLETED') { // 1. เสร็จสิ้น (กรองออก)
                    groupStatus = 'COMPLETED';
                } else if (app.bookingStatus === 'PENDING_FINAL_VERIFICATION') { // 2. รอตอบสลิป (แสดง)
                    groupStatus = 'PENDING_FINAL_VERIFICATION';

                    // ⭐️ (เพิ่ม) 3. ถ้ามีสถานะจองอื่นๆ (เช่น BOOKED) = ซ่อน
                } else if (app.bookingStatus) {
                    groupStatus = 'HIDDEN'; // (จะถูกกรองออกโดย .filter() ด้านล่าง)

                } else if (app.documents.length > 0) { // 4. ถ้ายังไม่มีการจอง ให้ดูเอกสาร
                    const statuses = app.documents.map(d => d.Review_Status);
                    if (statuses.every(s => s === 'HIDDEN')) {
                        groupStatus = 'HIDDEN';
                    }
                    // 2. ถ้ามี REJECTED -> groupStatus = REJECTED
                    else if (statuses.some(s => s === 'REJECTED')) {
                        groupStatus = 'REJECTED';
                    }
                    // 3. ถ้าทุกอันที่เหลือ (ไม่ HIDDEN, ไม่ REJECTED) เป็น APPROVED -> groupStatus = APPROVED
                    else if (statuses.filter(s => s !== 'HIDDEN' && s !== 'REJECTED').every(s => s === 'APPROVED')) {
                        groupStatus = 'APPROVED';
                    }
                    // 4. ถ้าไม่ใช่กรณีข้างบน แสดงว่ามี PENDING อยู่
                    else {
                        groupStatus = 'PENDING';
                    }
                } else {
                    // ถ้าไม่มีเอกสารเลย ให้ใช้ bookingStatus (ถ้ามี) หรือ UNKNOWN
                    groupStatus = app.bookingStatus || 'UNKNOWN';
                }
                // --- สิ้นสุดการแก้ไข Logic ---
                return { ...app, groupStatus };
            })
            .filter(app => { // กรองเอาเฉพาะที่มีกิจกรรมจริงๆ
                return app.groupStatus !== 'UNKNOWN';
            })
            .filter(app => { // กรองตาม Search Term
                const key = searchTerm.trim().toLowerCase();
                if (!key) return true;
                return (app.buyerName.toLowerCase().includes(key) || app.propertyName.toLowerCase().includes(key));
            })
            .filter(app => {
                // เพิ่ม PENDING_FINAL_VERIFICATION และ REJECTED เข้าไปในเงื่อนไขการกรองออก
                return app.groupStatus !== 'HIDDEN' &&
                    app.groupStatus !== 'COMPLETED' &&
                    app.groupStatus !== 'PENDING_FINAL_VERIFICATION' && // ⬅️ เพิ่ม 1
                    app.groupStatus !== 'REJECTED'; // ⬅️ เพิ่ม 2
            })
            .filter(app => { // กรองตาม Tab
                if (activeTab === "ALL") return true;
                return app.groupStatus === activeTab;
            });

    }, [authUser, searchTerm, activeTab]);

    const handleConfirmFinalSlip = async (bookingId, newStatus) => {
        if (newStatus === 'COMPLETED' && !window.confirm("คุณแน่ใจหรือไม่ว่าต้องการยืนยันสลิปนี้?")) {
            return;
        }
        setConfirmingId(bookingId);
        try {
            await apiClient.post(`/confirmed-slip/${bookingId}`, { bookingStatus: newStatus });

            const actionText = newStatus === 'COMPLETED' ? 'ยืนยัน' : 'ปฏิเสธ';
            toast({ title: `${actionText}สลิปสำเร็จ`, description: `สถานะได้รับการอัปเดตแล้ว` });
            await revalidateUser();
        } catch (error) {
            console.error("Failed to confirm final slip:", error);
            toast({
                title: "เกิดข้อผิดพลาด",
                description: error.response?.data?.message || "ไม่สามารถยืนยันสลิปได้",
                variant: "destructive",
            });
        } finally {
            setConfirmingId(null);
        }
    };


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
            <h2 className="text-2xl font-bold mb-4">เอกสาร/การจอง สำหรับตรวจสอบ</h2>

            <div className="flex flex-col md:flex-row gap-4 mb-4">
                <input
                    type="text"
                    placeholder="ค้นหาจากชื่อผู้ซื้อ หรือชื่อโครงการ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-4 py-2"
                />
                <select
                    value={activeTab}
                    onChange={(e) => setActiveTab(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 md:w-auto w-full"
                >
                    <option value="ALL">ทั้งหมด</option>
                    <option value="PENDING">รอตรวจสอบเอกสาร</option>
                    {/* <option value="PENDING_FINAL_VERIFICATION">รอตรวจสอบสลิปสุดท้าย</option> */}
                    <option value="APPROVED">อนุมัติแล้ว</option>
                    {/* <option value="REJECTED">ถูกปฏิเสธ</option> */}
                </select>
            </div>

            <div className="bg-gray-100 p-4 rounded-lg max-h-[70vh] overflow-y-auto space-y-4">
                {loading ? (
                    <div className="text-center p-10"><Loader2 className="w-8 h-8 mx-auto animate-spin" /></div>
                ) : groupedApplications.length === 0 ? (
                    <div className="text-center text-gray-500 py-10"><p>ไม่พบรายการในหมวดหมู่นี้</p></div>
                ) : (
                    groupedApplications.map((app) => {
                        // ⭐️ ยืนยันว่าบรรทัดนี้ถูกต้อง
                        const isMyOwnDocument = app.documents.some(doc =>
                            (doc.User?.id || doc.userId) === authUser.id
                        );

                        const cardClassName = `bg-white p-4 rounded-lg shadow-sm border flex flex-col gap-4 relative`;


                        // ถ้าเป็นสถานะรอตรวจสอบสลิป ให้แสดง FinalSlipCard เท่านั้น
                        if (app.groupStatus === 'PENDING_FINAL_VERIFICATION') {
                            return (
                                <div key={app.unitId} className="bg-white rounded-lg shadow-sm border">
                                    <FinalSlipCard
                                        booking={app}
                                        onConfirm={handleConfirmFinalSlip}
                                        isConfirming={confirmingId === app.bookingId}
                                    />
                                </div>
                            )
                        }

                        // สำหรับสถานะอื่นๆ ให้แสดง Card แบบเดิม
                        return (
                            <div key={app.unitId} className={cardClassName} >
                                <div className="flex justify-between items-start flex-wrap gap-3">
                                    <div className="flex-grow">
                                        <h3 className="font-bold text-gray-800 text-lg">โครงการ: {app.propertyName}</h3>
                                        <p className="text-sm text-gray-500 mt-1">ยูนิต: <span className="font-semibold text-gray-700">{app.unitNumber}</span></p>
                                        <p className="text-sm text-gray-500 mt-0.5">ผู้ส่ง: <span className="font-semibold text-gray-700">{app.buyerName}</span> | ส่งเมื่อ: {new Date(app.createdAt).toLocaleDateString('th-TH')}</p>
                                    </div>
                                    <StatusBadge status={app.groupStatus} />
                                </div>

                                {app.documents.length > 0 && (
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
                                )}

                                <div className="mt-4 border-t pt-4">
                                    {app.groupStatus === 'PENDING' && !isMyOwnDocument && (
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
                                        isMyOwnDocument ? (
                                            <>
                                                {/* (แก้ไข) ย้าย onClick มาที่นี่ */}
                                                {app.depositStatus !== 'CONFIRMED' && (
                                                    <Button
                                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                                        onClick={() => navigate('/seller/deposit-payment', { state: { documentData: app.documents[0] } })}
                                                    >
                                                        ชำระเงินมัดจำ
                                                    </Button>
                                                )}
                                                {app.depositStatus === 'CONFIRMED' && !app.bookingStatus && <Button onClick={() => navigate(`/booking/${app.documents[0].postId}/${app.unitId}`)} className="w-full bg-green-600 hover:bg-green-700 text-white">นัดวันเจรจา</Button>}
                                                {app.bookingStatus && <div className="text-center text-sm text-gray-700 font-semibold p-2.5 bg-gray-100 rounded-md">✅ ดำเนินการเสร็จสิ้น</div>}

                                            </>
                                        ) : (
                                            <>
                                                {app.bookingStatus === 'PENDING_FINAL_VERIFICATION' ? (
                                                    <FinalSlipCard
                                                        booking={app}
                                                        onConfirm={handleConfirmFinalSlip} // ส่งฟังก์ชันที่แก้ไขแล้วไป
                                                        isConfirming={confirmingId === app.bookingId}
                                                    />
                                                ) : (
                                                    <>

                                                        {app.depositStatus === 'CONFIRMED' && !app.bookingStatus && <p className="text-center text-sm text-green-600 font-semibold">ผู้ซื้อชำระเงินแล้ว, รอนัดวันเจรจา...</p>}
                                                        {app.bookingStatus && <div className="text-center text-sm text-gray-700 font-semibold p-2.5 bg-gray-100 rounded-md">✅ ผู้ซื้อดำเนินการเรียบร้อย</div>}
                                                    </>
                                                )}
                                            </>
                                        )
                                    )}
                                    {app.groupStatus === 'REJECTED' && <p className="text-center text-sm text-red-600">เอกสารถูกปฏิเสธ</p>}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}