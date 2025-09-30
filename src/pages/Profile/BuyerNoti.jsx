import {
  Bell,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Info,
} from "lucide-react";

const mockNotifications = [
  {
    type: "success",
    title: "การจองสำเร็จ",
    message: "คุณได้จอง 'คอนโดลุมพินี วิวแม่น้ำ' เรียบร้อยแล้ว",
    time: "5 นาทีที่แล้ว",
    icon: <CheckCircle className="text-green-600 w-5 h-5" />,
  },
  {
    type: "info",
    title: "มีประกาศใหม่ตรงกับความสนใจของคุณ",
    message: "มีบ้านเดี่ยวใหม่ย่านลาดพร้าว ที่คุณอาจสนใจ",
    time: "30 นาทีที่แล้ว",
    icon: <Info className="text-blue-600 w-5 h-5" />,
  },
  {
    type: "warning",
    title: "การชำระเงินล้มเหลว",
    message: "ระบบไม่สามารถประมวลผลการชำระค่ามัดจำของคุณได้",
    time: "2 ชั่วโมงที่แล้ว",
    icon: <AlertTriangle className="text-yellow-600 w-5 h-5" />,
  },
  {
    type: "alert",
    title: "เอกสารแนบไม่ถูกต้อง",
    message: "กรุณาแนบเอกสารใหม่สำหรับการยืนยันตัวตน",
    time: "เมื่อวานนี้",
    icon: <AlertTriangle className="text-red-600 w-5 h-5" />,
  },
  {
    type: "info",
    title: "ระบบพร้อมใช้งาน",
    message: "ระบบได้รับการปรับปรุงและพร้อมให้บริการแล้ว",
    time: "2 วันที่แล้ว",
    icon: <Info className="text-gray-500 w-5 h-5" />,
  },
  {
    type: "info",
    title: "โพสต์ที่คุณบันทึกไว้มีการอัปเดตราคา",
    message: "'บ้านเดี่ยวพระราม 2' ลดราคาจาก 4.5 ล้าน เหลือ 4.2 ล้าน",
    time: "3 วันที่แล้ว",
    icon: <MessageSquare className="text-blue-600 w-5 h-5" />,
  },
  {
    type: "info",
    title: "เงื่อนไขการใช้งานใหม่",
    message: "โปรดตรวจสอบและยอมรับก่อนเข้าใช้งานระบบต่อ",
    time: "4 วันที่แล้ว",
    icon: <Info className="text-gray-500 w-5 h-5" />,
  },
];

const BuyerNoti = () => {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="border border-gray-200 rounded-xl shadow bg-white max-h-[500px] overflow-y-auto">
        {mockNotifications.length === 0 ? (
          <p className="text-gray-500 p-4">ยังไม่มีการแจ้งเตือน</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {mockNotifications.map((noti, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-4 hover:bg-gray-50 transition"
              >
                <div className="mt-1">{noti.icon}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-base">{noti.title}</h3>
                  <p className="text-sm text-gray-600">{noti.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{noti.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyerNoti;
