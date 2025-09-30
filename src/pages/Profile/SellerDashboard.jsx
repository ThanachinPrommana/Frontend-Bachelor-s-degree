import { Card, CardContent } from "@/components/ui/card";
import { Users, BarChart2, FileText, Star } from "lucide-react";

const SellerDashboard = () => {
  return (
    <div className="w-full min-h-screen bg-[#ecf0f1] px-6 py-10">
      <h2 className="text-3xl font-bold mb-8">Seller Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* สถิติรวม */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <BarChart2 className="w-10 h-10 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">ยอดขายเดือนนี้</p>
                <p className="text-xl font-bold text-gray-800">฿350,000</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Users className="w-10 h-10 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">ลูกค้าที่กำลังดำเนินการ</p>
                <p className="text-xl font-bold text-gray-800">4 คน</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Star className="w-10 h-10 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-500">คะแนนเฉลี่ยจากผู้ซื้อ</p>
                <p className="text-xl font-bold text-gray-800">4.7 / 5</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* รายชื่อลูกค้าที่กำลังดำเนินการ */}
        <Card className="col-span-1 md:col-span-2">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">ลูกค้ากำลังดำเนินการ</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-gray-600">
                    <th className="py-2 pr-4">ชื่อ</th>
                    <th className="py-2 pr-4">บ้านที่สนใจ</th>
                    <th className="py-2 pr-4">สถานะ</th>
                    <th className="py-2">อัปเดตล่าสุด</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 pr-4">คุณเอ</td>
                    <td className="py-2 pr-4">บ้าน A</td>
                    <td className="py-2 pr-4 text-blue-600">รอตรวจเอกสาร</td>
                    <td className="py-2">26 พ.ค. 2025</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4">คุณบี</td>
                    <td className="py-2 pr-4">บ้าน C</td>
                    <td className="py-2 pr-4 text-green-600">นัดวันเจรจา</td>
                    <td className="py-2">25 พ.ค. 2025</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* รีวิวล่าสุด */}
        <Card className="col-span-1 md:col-span-2 xl:col-span-3">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              รีวิวล่าสุดจากผู้ซื้อ
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-100 rounded-md">
                <p className="font-medium">คุณกอล์ฟ</p>
                <p className="text-sm text-gray-600">
                  บริการดี ตอบไว เอกสารครบ!
                </p>
              </div>
              <div className="p-4 bg-gray-100 rounded-md">
                <p className="font-medium">คุณน้ำ</p>
                <p className="text-sm text-gray-600">
                  ช่วยแนะนำบ้านเหมาะกับครอบครัวได้ดีมาก
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SellerDashboard;
