import { Link } from "react-router-dom";
// (สมมติว่าคุณใช้ react-icons หรือ lucide-react)
import { FaBalanceScale, FaCheck } from "react-icons/fa"; // หรือ import { Check, Scale } from 'lucide-react';

/**
 * (แก้ไข) 1. แก้ไข Props ที่รับเข้ามา
 * - data: Array ของโพสต์ (จาก Home)
 * - onAddToCompare: ฟังก์ชันที่ถูกส่งมาจาก Home
 * - compareIds: Set ของ ID ที่ถูกเปรียบเทียบอยู่ (จาก Home)
 */
const Cards = ({ data, onAddToCompare, compareIds }) => {

  // 2. ตรวจสอบ 'data' (ถูกต้อง)
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  return (
    <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 item">
      {data.map((item) => {

        // 3. (เพิ่ม) คำนวณว่าการ์ดใบนี้ถูกเปรียบเทียบหรือยัง
        const isCompared = compareIds.has(item.id);

        return (
          // (แก้ไข) 4. ย้าย key มาที่ div นอกสุด และเปลี่ยน Link ให้อยู่ข้างใน
          <div key={item.id} className="relative group overflow-hidden rounded-xl bg-white shadow-md">

            {/* 5. (เพิ่ม) ปุ่ม Add to Compare */}
            <button
              onClick={(e) => {
                e.preventDefault(); // ป้องกัน Link ทำงาน
                onAddToCompare(item.id);
              }}
              className={`
                absolute top-3 right-3 z-10 p-2 rounded-full 
                transition-all duration-200
                ${isCompared
                  ? 'bg-blue-500 text-white hover:bg-blue-600' // (สีฟ้า = อยู่ใน List)
                  : 'bg-white/70 text-gray-700 hover:bg-white' // (สีขาว = ยังไม่อยู่)
                }
              `}
              aria-label={isCompared ? "ลบออกจากเปรียบเทียบ" : "เพิ่มในรายการเปรียบเทียบ"}
            >
              {isCompared
                ? <FaCheck className="w-4 h-4" /> // (ถ้าใช้ Lucide: <Check />)
                : <FaBalanceScale className="w-4 h-4" /> // (ถ้าใช้ Lucide: <Scale />)
              }
            </button>

            {/* 6. (แก้ไข) ย้าย Link มาไว้ข้างใน */}
            <Link to={`/deposit/${item.id}`}>
              <div
                className="overflow-hidden cursor-pointer relative"
              // onClick={...} (onClick เดิมของคุณถ้ามี)
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-50 object-cover" // (h-50 ดูเหมือนจะไม่ใช่ Tailwind มาตรฐาน, อาจจะต้องเป็น h-48 หรือ h-52)
                />
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-center p-2">
                  <p className="text-white text-lg font-semibold text-center break-words">
                    {item.name}
                  </p>
                </div>
              </div>
            </Link>

          </div>
        );
      })}
    </div>
  );
};

export default Cards;