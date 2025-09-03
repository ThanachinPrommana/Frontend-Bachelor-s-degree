// src/pages/NotFound.jsx
import { Link, useNavigate } from "react-router-dom";
import { Home, ArrowLeft, LifeBuoy } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] bg-[#FAF0E6] flex items-center">
      <div className="mx-auto max-w-4xl px-6 py-16">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Top bar */}
          <div className="h-2 w-full bg-[#2c3e50]" />

          {/* Content */}
          <div className="p-8 md:p-12 grid md:grid-cols-2 gap-8">
            {/* Illustration */}
            <div className="order-2 md:order-1">
              <div className="relative mx-auto max-w-[320px]">
                {/* บ้านสไตล์มินิมอล */}
                <svg
                  viewBox="0 0 200 160"
                  className="w-full h-auto"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="g1" x1="0" x2="1">
                      <stop offset="0%" stopColor="#e8d3bc" />
                      <stop offset="100%" stopColor="#f7e8d7" />
                    </linearGradient>
                    <linearGradient id="g2" x1="0" x2="1">
                      <stop offset="0%" stopColor="#CD853F" />
                      <stop offset="100%" stopColor="#b77537" />
                    </linearGradient>
                  </defs>
                  <rect x="0" y="110" width="200" height="50" fill="#f0e2d4" />
                  <polygon points="100,10 20,70 180,70" fill="url(#g2)" />
                  <rect x="40" y="70" width="120" height="60" fill="url(#g1)" />
                  <rect x="70" y="95" width="25" height="35" fill="#ffffff" />
                  <rect x="115" y="85" width="30" height="25" fill="#ffffff" />
                  <rect x="118" y="88" width="10" height="10" fill="#dfe8f2" />
                  <rect x="133" y="88" width="10" height="10" fill="#dfe8f2" />
                </svg>
              </div>
            </div>

            {/* Text & Actions */}
            <div className="order-1 md:order-2 flex flex-col justify-center">
              <p className="text-sm text-gray-500">รหัสข้อผิดพลาด: 404</p>
              <h1 className="mt-2 text-3xl md:text-4xl font-bold text-[#2c3e50]">
                ไม่พบหน้าที่คุณต้องการ
              </h1>
              <p className="mt-3 text-gray-600">
                ลิงก์อาจถูกย้าย ถูกลบ หรือพิมพ์ที่อยู่ไม่ถูกต้อง
                ลองกลับไปหน้าแรกหรือดูศูนย์ช่วยเหลือได้เลย
              </p>

              {/* Actions */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 bg-[#CD853F] text-white hover:bg-[#b77537] motion-safe:transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CD853F]/40"
                >
                  <Home className="w-4 h-4" />
                  กลับหน้าแรก
                </Link>
                <button
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 bg-white border border-gray-200 text-[#2c3e50] hover:bg-gray-50 motion-safe:transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2c3e50]/30"
                >
                  <ArrowLeft className="w-4 h-4" />
                  ย้อนกลับ
                </button>
                <Link
                  to="/support"
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 bg-white border border-gray-200 text-[#2c3e50] hover:bg-gray-50 motion-safe:transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2c3e50]/30"
                >
                  <LifeBuoy className="w-4 h-4" />
                  ศูนย์ช่วยเหลือ
                </Link>
              </div>

              {/* Breadcrumb mini */}
              <nav className="mt-6 text-sm text-gray-500" aria-label="breadcrumb">
                <span className="hover:text-gray-700">หน้าหลัก</span> /{" "}
                <span className="text-gray-800">ไม่พบหน้า</span>
              </nav>
            </div>
          </div>
        </div>

        {/* Footer helper line */}
        <div className="mt-6 text-center text-xs text-gray-500">
          ถ้าเจอปัญหาในการใช้งาน กรุณาแจ้งทีมงานผ่านหน้า <Link to="/support" className="underline">ศูนย์ช่วยเหลือ</Link>
        </div>
      </div>
    </div>
  );
}
