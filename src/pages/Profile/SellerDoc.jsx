import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const SellerDoc = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const mockDocuments = [
    {
      name: "เอกสารการซื้อขาย",
      date: "20 พ.ค. 2025",
      uploadedBy: "คุณสมชาย",
    },
    {
      name: "สำเนาทะเบียนบ้าน",
      date: "18 พ.ค. 2025",
      uploadedBy: "คุณสมหญิง",
    },
    {
      name: "บัตรประชาชน",
      date: "15 พ.ค. 2025",
      uploadedBy: "คุณสมบัติ",
    },
    {
      name: "หนังสือมอบอำนาจ",
      date: "10 พ.ค. 2025",
      uploadedBy: "คุณสมพร",
    },
  ];

  const filteredDocs = mockDocuments.filter((doc) =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Top bar */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-3">
        {/* Left - Add button */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            className="bg-white border border-gray-300 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Drive
          </Button>
          {/* Search input */}
          <input
            type="text"
            placeholder="ค้นหาเอกสาร..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#34495E]"
          />
        </div>

        {/* Right - Filter + Delete */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            className="border border-[#34495E] text-[#34495E] px-4 py-2 rounded-md font-medium hover:bg-[#34495E] hover:text-white transition"
          >
            Filter
          </button>
          <Button variant="outline" className="border-gray-400">
            <Trash2 className="w-5 h-5 text-gray-700" />
          </Button>
        </div>
      </div>

      {/* Document List */}
      <div className="bg-gray-100 p-4 rounded-lg max-h-[400px] overflow-y-auto space-y-3">
        {filteredDocs.length === 0 ? (
          <p className="text-gray-500">ไม่พบเอกสารที่ตรงกับคำค้นหา</p>
        ) : (
          filteredDocs.map((doc, index) => (
            <div
              key={index}
              className="bg-white p-4 rounded-md shadow-sm border border-gray-200"
            >
              <h4 className="font-semibold text-lg">{doc.name}</h4>
              <p className="text-sm text-gray-500">
                วันที่อัปโหลด: {doc.date} | โดย: {doc.uploadedBy}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SellerDoc;
