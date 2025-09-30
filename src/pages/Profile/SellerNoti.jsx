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
    title: "โพสต์ของคุณถูกเผยแพร่แล้ว",
    message: "ประกาศ 'ขายบ้านเดี่ยว 2 ชั้น ย่านรามอินทรา' ถูกเผยแพร่เรียบร้อย",
    time: "10 นาทีที่แล้ว",
    icon: <CheckCircle className="text-green-600 w-5 h-5" />,
  },
  {
    type: "info",
    title: "มีผู้สนใจประกาศของคุณ",
    message: "มีผู้ใช้ติดต่อสอบถามเกี่ยวกับ 'คอนโดใกล้ BTS อ่อนนุช'",
    time: "1 ชั่วโมงที่แล้ว",
    icon: <MessageSquare className="text-blue-600 w-5 h-5" />,
  },
  {
    type: "warning",
    title: "การชำระเงินล้มเหลว",
    message: "ระบบไม่สามารถประมวลผลการจองล่าสุดของคุณได้",
    time: "2 ชั่วโมงที่แล้ว",
    icon: <AlertTriangle className="text-yellow-600 w-5 h-5" />,
  },
  {
    type: "alert",
    title: "โพสต์ถูกปฏิเสธ",
    message: "ประกาศ 'ทาวน์เฮาส์นนทบุรี' ถูกปฏิเสธ เนื่องจากข้อมูลไม่ครบถ้วน",
    time: "เมื่อวานนี้",
    icon: <AlertTriangle className="text-red-600 w-5 h-5" />,
  },
  {
    type: "info",
    title: "ระบบปรับปรุงเสร็จสิ้น",
    message: "ระบบพร้อมให้บริการตามปกติแล้ว",
    time: "2 วันที่แล้ว",
    icon: <Info className="text-gray-500 w-5 h-5" />,
  },
  // เพิ่ม mock อีกหลายรายการให้แสดง scroll
  {
    type: "info",
    title: "มีผู้กดบันทึกโพสต์ของคุณ",
    message: "ผู้ใช้คนหนึ่งบันทึกโพสต์ของคุณไว้ในรายการโปรด",
    time: "3 วันที่แล้ว",
    icon: <MessageSquare className="text-blue-600 w-5 h-5" />,
  },
  {
    type: "info",
    title: "มีการอัปเดตเงื่อนไขการใช้งาน",
    message: "โปรดอ่านเงื่อนไขใหม่เพื่อยืนยันก่อนใช้งานต่อ",
    time: "4 วันที่แล้ว",
    icon: <Info className="text-gray-500 w-5 h-5" />,
  },
];

const SellerNoti = () => {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* กล่องแจ้งเตือนแบบ scrollable */}
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

export default SellerNoti;
