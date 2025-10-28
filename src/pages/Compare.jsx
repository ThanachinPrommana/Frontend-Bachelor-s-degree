import React from "react";
import { useCompare } from "@/context/CompareContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Trash2, X, Home, RotateCcw } from "lucide-react";

const Compare = () => {
  const { compareList, removeFromCompare, clearCompare } = useCompare();

  if (compareList.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <div className="text-center max-w-md bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Home className="w-10 h-10 text-slate-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-3">
            ยังไม่มีบ้านในรายการเปรียบเทียบ
          </h1>
          <p className="text-slate-600 mb-6">
            เพิ่มบ้านที่คุณสนใจเพื่อเริ่มต้นการเปรียบเทียบ
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
          >
            กลับไปเลือกบ้าน
          </Link>
        </div>
      </div>
    );
  }

  const formatNumber = (num) => {
    if (typeof num === 'number') {
      return num.toLocaleString();
    }
    return num || "-";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
              เปรียบเทียบบ้าน
            </h1>
            <p className="text-slate-600">
              จำนวน {compareList.length} รายการ
            </p>
          </div>
          
          <div className="flex gap-3 mt-4 lg:mt-0 flex-wrap">
            <Button
              onClick={() => {
                if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการล้างรายการเปรียบเทียบทั้งหมด?")) {
                  clearCompare();
                }
              }}
              className="flex items-center gap-2 bg-slate-700 text-white hover:bg-slate-800 px-4 py-2 rounded-lg transition-colors duration-200"
            >
              <RotateCcw className="w-4 h-4" />
              ล้างทั้งหมด
            </Button>
            <Link to="/">
              <Button className="flex items-center gap-2 bg-slate-800 text-white hover:bg-slate-900 px-4 py-2 rounded-lg transition-colors duration-200">
                <Home className="w-4 h-4" />
                กลับไปเลือกบ้าน
              </Button>
            </Link>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="overflow-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="bg-slate-800 text-white p-6 text-left min-w-[200px] sticky left-0 z-20">
                    <span className="text-lg font-semibold">รายละเอียด</span>
                  </th>
                  {compareList.map((house) => (
                    <th key={house.id} className="bg-white p-6 text-center min-w-[280px] border-l border-slate-200">
                      <div className="space-y-4">
                        <div className="relative">
                          <button
                            onClick={() => removeFromCompare(house.id)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors duration-200"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 line-clamp-2">
                          {house.name}
                        </h3>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* รูปภาพ */}
                <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150">
                  <td className="p-4 bg-slate-50 font-semibold text-slate-700 sticky left-0 z-10">
                    รูปภาพ
                  </td>
                  {compareList.map((house) => (
                    <td key={house.id} className="p-4 border-l border-slate-200">
                      <div className="flex justify-center">
                        <img
                          src={house.src}
                          alt={house.name}
                          className="w-48 h-32 object-cover rounded-xl shadow-md"
                        />
                      </div>
                    </td>
                  ))}
                </tr>

                {/* ราคาบ้าน */}
                <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150">
                  <td className="p-4 bg-slate-50 font-semibold text-slate-700 sticky left-0 z-10">
                    ราคาบ้าน
                  </td>
                  {compareList.map((house) => (
                    <td key={house.id} className="p-4 border-l border-slate-200 text-center">
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-slate-800">
                          {formatNumber(house.price)}
                        </div>
                        <div className="text-sm text-slate-500">บาท</div>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* ราคามัดจำ */}
                <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150">
                  <td className="p-4 bg-slate-50 font-semibold text-slate-700 sticky left-0 z-10">
                    ราคามัดจำ
                  </td>
                  {compareList.map((house) => (
                    <td key={house.id} className="p-4 border-l border-slate-200 text-center">
                      <div className="space-y-1">
                        <div className="text-lg font-semibold text-slate-700">
                          {formatNumber(house.deposit)}
                        </div>
                        <div className="text-sm text-slate-500">บาท</div>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* ขนาดพื้นที่ */}
                <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150">
                  <td className="p-4 bg-slate-50 font-semibold text-slate-700 sticky left-0 z-10">
                    ขนาดพื้นที่
                  </td>
                  {compareList.map((house) => (
                    <td key={house.id} className="p-4 border-l border-slate-200 text-center">
                      <div className="space-y-1">
                        <div className="text-lg font-semibold text-slate-700">
                          {formatNumber(house.size)}
                        </div>
                        <div className="text-sm text-slate-500">ตารางเมตร</div>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* จำนวนห้อง */}
                <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150">
                  <td className="p-4 bg-slate-50 font-semibold text-slate-700 sticky left-0 z-10">
                    จำนวนห้อง
                  </td>
                  {compareList.map((house) => (
                    <td key={house.id} className="p-4 border-l border-slate-200 text-center">
                      <div className="flex justify-center gap-4">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-slate-700">
                            {house.badroom || 0}
                          </div>
                          <div className="text-sm text-slate-500">ห้องนอน</div>
                        </div>
                        <div className="w-px bg-slate-300"></div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-slate-700">
                            {house.bathroom || 0}
                          </div>
                          <div className="text-sm text-slate-500">ห้องน้ำ</div>
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* ประเภท */}
                <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150">
                  <td className="p-4 bg-slate-50 font-semibold text-slate-700 sticky left-0 z-10">
                    ประเภท
                  </td>
                  {compareList.map((house) => (
                    <td key={house.id} className="p-4 border-l border-slate-200 text-center">
                      <span className="inline-block bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-medium">
                        {house.type || "-"}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Actions */}
                <tr>
                  <td className="p-4 bg-slate-50 font-semibold text-slate-700 sticky left-0 z-10">
                    การจัดการ
                  </td>
                  {compareList.map((house) => (
                    <td key={house.id} className="p-4 border-l border-slate-200 text-center">
                      <Button
                        onClick={() => removeFromCompare(house.id)}
                        className="flex items-center gap-2 bg-red-500 text-white hover:bg-red-600 px-4 py-2 rounded-lg transition-colors duration-200 mx-auto"
                      >
                        <Trash2 className="w-4 h-4" />
                        ลบออก
                      </Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Notice */}
        <div className="lg:hidden mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700 text-sm text-center">
            💡 เลื่อนแนวนontalเพื่อดูข้อมูลทั้งหมด
          </p>
        </div>
      </div>
    </div>
  );
};

export default Compare;