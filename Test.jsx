import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { BedSingle, Bath, Grid2x2 } from "lucide-react";

import { apiClient } from "@/api/authconfig"; // <-- ใช้ apiClient ของเรา
import { useCompare } from "@/context/CompareContext";
import { Button } from "@/components/ui/button";
import Buttons from "@/components/Buttons";
import Credit from "@/components/Credit";

const Deposit = () => {
  const { id } = useParams(); // 1. ดึง ID จาก URL
  const [post, setPost] = useState(null); // 2. State สำหรับเก็บข้อมูลที่ดึงมา
  const [isLoading, setIsLoading] = useState(true); // 3. State สำหรับ Loading
  const navigate = useNavigate();
  const { addToCompare, compareList } = useCompare();

  // 4. useEffect สำหรับดึงข้อมูลจาก API
  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return; // ถ้าไม่มี id ก็ไม่ต้องทำอะไร
      setIsLoading(true);
      try {
        const response = await apiClient.get(`/propertypost/${id}`);
        setPost(response.data);
      } catch (error) {
        console.error("Failed to fetch post details:", error);
        setPost(null); // ตั้งค่าเป็น null หากเกิด error
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [id]); // ให้ re-run effect นี้ทุกครั้งที่ id ใน URL เปลี่ยน

  // 5. แสดงผล Loading หรือ Not Found
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>ไม่พบข้อมูลอสังหาริมทรัพย์</p>
      </div>
    );
  }

  // 6. เตรียมข้อมูลสำหรับ Compare feature
  const isAlreadyCompared = compareList.some((item) => item.id === post.id);
  const compareHouse = {
    id: post.id,
    name: post.Property_Name,
    src: post.Image?.[0]?.secure_url,
    price: post.Price,
    size: post.Usable_Area,
    badroom: post.Bedrooms,
    bathroom: post.Bathroom,
  };

  return (
    <div>
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl py-6 md:py-10">
        {/* 7. (แก้ไข) นำข้อมูลจาก 'post' มาแสดงผล */}

        {/* ส่วนแสดงภาพ */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-[55%]">
            {post.Image?.[0] && (
              <img
                src={post.Image[0].secure_url}
                alt={post.Property_Name}
                className="rounded-3xl w-full h-[250px] sm:h-[350px] md:h-[450px] object-cover shadow-md"
              />
            )}
          </div>
          <div className="w-full lg:w-[45%] grid grid-cols-2 gap-3">
            {post.Image?.slice(1, 5).map((img, index) => (
              <img
                key={index}
                src={img.secure_url}
                alt={`${post.Property_Name} sub-image ${index}`}
                className="rounded-3xl w-full h-[120px] sm:h-[170px] md:h-[220px] object-cover shadow-md"
              />
            ))}
          </div>
        </div>

        {/* ส่วนข้อมูลบ้าน */}
        <div className="mt-8 border-b border-gray-200 pb-8">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                {post.Property_Name}
              </h1>
              <h2 className="text-lg md:text-xl font-semibold text-gray-800">
                {post.Category.name}
              </h2>
            </div>
            <p className="text-gray-700">{post.Description}</p>
            {/* ... (ส่วนอื่นๆ สามารถดึงข้อมูลจาก `post` มาเพิ่มได้ตามต้องการ) ... */}



          </div>
        </div>

        {/* ส่วนราคาและรายละเอียด */}
        <div className="flex flex-col xl:flex-row mt-8 gap-8">
          <div className="xl:w-[40%] border-b xl:border-b-0 xl:border-r border-gray-200 pb-8 xl:pb-0 xl:pr-8">
            <div className="mb-8">
              <p className="text-sm font-semibold text-gray-600">{post.Sell_Rent === 'SALE' ? 'ราคาขาย' : 'ราคาเช่า'}</p>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                ฿{post.Price.toLocaleString()}
              </h1>
            </div>

            <div className="space-y-4">
              <Buttons
                onClick={() => {
                  const user = JSON.parse(localStorage.getItem("user"));
                  if (!user || user.userType !== "Buyer") {
                    navigate("/login");
                  } else {
                    navigate("/Deposit_doc", { state: { postData: post } });
                  }
                }}
                text="มัดจำ"
                color="bg-blue-600 hover:bg-blue-700"
                lenghbutton="w-full"
              />
              {/* ... (ปุ่ม Compare เหมือนเดิม) ... */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {isAlreadyCompared ? (
                    <Button className="w-full bg-gray-400 hover:bg-gray-500 text-white py-3">
                      ✅ เพิ่มในรายการเปรียบเทียบแล้ว
                    </Button>
                  ) : (
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                      onClick={() => addToCompare(compareHouse)}
                    >
                      + เพิ่มในรายการเปรียบเทียบ
                    </Button>
                  )}
                </div>

                {/* ปุ่มดูรายการเปรียบเทียบที่แยกบรรทัดใหม่ */}
                <Link to="/compare" className="w-full">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3">
                    ดูรายการเปรียบเทียบ
                  </Button>
                </Link>
              </div>

            </div>
          </div>

          <div className="xl:w-[60%]">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold mb-6 text-gray-900">รายละเอียด</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <BedSingle className="mx-auto size-6 text-blue-600" />
                  <p className="mt-2 font-medium text-gray-800">{post.Bedrooms} ห้องนอน</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <Bath className="mx-auto size-6 text-blue-600" />
                  <p className="mt-2 font-medium text-gray-800">{post.Bathroom} ห้องน้ำ</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <Grid2x2 className="mx-auto size-6 text-blue-600" />
                  <p className="mt-2 font-medium text-gray-800">{post.Usable_Area} ตร.ม.</p>
                </div>
              </div>
            </div>
            {/* ... (ส่วนข้อมูลผู้ขาย สามารถดึงจาก post.user มาแสดง) ... */}
            <div className="mt-6 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">
                ข้อมูลผู้ขาย
              </h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-600 font-medium">
                    {post.user.First_name}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {post.Property_Name}
                  </p>
                  <p className="text-sm text-gray-600">{post.user.First_name}</p>
                  <p className="text-sm text-gray-600">{post.user.Last_name}</p>
                </div>
              </div>
              <button
                onClick={() => navigate("/profile/seller")}
                className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                ดูโปรไฟล์ผู้ขายทั้งหมด →
              </button>
            </div>

            {/* ปุ่มเพิ่มเติม */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium">
                บันทึกไว้ดูภายหลัง
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium">
                แชร์ประกาศนี้
              </button>
            </div>

          </div>
        </div>
      </div>
      <Credit className="mt-12" />
    </div>
  );
};

export default Deposit;