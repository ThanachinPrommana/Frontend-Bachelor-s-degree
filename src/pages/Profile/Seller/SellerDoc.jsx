import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";


const SellerDoc = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { authUser, loading } = useAuth()
  const documents = authUser?.DocumentUpload || []

  const filteredDocs = documents.filter((doc) =>
    doc.DocumentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-6 text-center">กำลังโหลดข้อมูลเอกสาร...</div>;
  }


  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Top bar */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-3">
        {/* Left - Add button */}
        <div className="flex items-center gap-2 w-full md:w-full">

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
          <p className="text-gray-500 text-center">
            {documents.length === 0 ? "คุณยังไม่มีเอกสารใดๆ" : "ไม่พบเอกสารที่ตรงกับคำค้นหา"}
          </p>
        ) : (
          filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white p-4 rounded-md shadow-sm border border-gray-200"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-lg">{doc.DocumentName}</h4>

                  <p className="text-sm text-gray-500 mt-1">
                    {/* ✅ เปลี่ยนจาก doc.user เป็น doc.User (ตัวพิมพ์ใหญ่) */}
                    โดย: {doc.User?.First_name || ''} {doc.User?.Last_name || ''}
                    {' | '}
                    วันที่: {new Date(doc.createdAt).toLocaleDateString('th-TH')}
                  </p>
                  {/* ✨ ส่วนที่เพิ่มเข้ามา */}
                  <a
                    href={doc.DocumentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                  >
                    ดูเอกสาร
                  </a>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${doc.Review_Status === 'Approved' ? 'bg-green-100 text-green-800' :
                  doc.Review_Status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                  }`}>
                  {doc.Review_Status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SellerDoc;
