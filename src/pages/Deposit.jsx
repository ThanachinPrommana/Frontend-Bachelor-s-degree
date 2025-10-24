import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  BedSingle, Bath, Grid2x2, Calendar, Car, Home,
  Building, Phone, MapPin, Tag, CheckCircle, Info, Video,
  Loader2,
  UserRound,
  MessageSquare,
  Facebook
} from "lucide-react";

import { apiClient } from "@/api/authconfig";
import { useCompare } from "@/context/CompareContext";
import { Button } from "@/components/ui/button";
import Buttons from "@/components/Buttons";
import Credit from "@/components/Credit";
import { useAuth } from "@/context/AuthContext";

const amenitiesList = [
  { value: "Swimming_Pool", label: "สระว่ายน้ำ" },
  { value: "Fitness_Center", label: "ฟิตเนส" },
  { value: "Co_working_Space", label: "โคเวิร์กกิ้งสเปซ" },
  { value: "Pet_Friendly", label: "เลี้ยงสัตว์ได้" },
];

const statusUnit = [
  { value: "AVAILABLE", label: "ว่าง" },
  { value: "PENDING", label: "กำลังดำเนินการ" },
  { value: "SOLD", label: "ขายไปแล้ว" }
]

const categorythai = [
  { id: "cmegzfdya0006w2bwq5d8alc7", label: "คอนโดมิเนียม" },
  { id: "cmegzfhx70007w2bwp63cbc1w", label: "บ้านเดี่ยว" },
  { id: "cmegzfls20008w2bwf0arh8jq", label: "ที่ดิน" },
  { id: "cmegzfov30009w2bwrxjpt7xn", label: "วิลล่า" },
  { id: "cmegzft08000aw2bwx91l68z9", label: "ทาวน์เฮาส์" },
  { id: "cmegzg3t1000cw2bw8shu6whw", label: "ตึกแถว/ช้อปเฮาส์" },
  { id: "cmegzg9ez000dw2bwgkdliy1a", label: "อพาร์ตเมนต์" },
  { id: "cmegzgcmy000ew2bw72nen7zo", label: "เพนท์เฮาส์" },
  { id: "cmegzgfvz000fw2bwgppl0ci5", label: "รีสอร์ท" },
  { id: "cmegzgif1000gw2bw1z7xda7u", label: "โรงแรม" },
  { id: "cmegzgky4000hw2bwe83xrvrg", label: "ออฟฟิศ" },
  { id: "cmegzgq6g000iw2bwl51st9pg", label: "อาคารพาณิชย์" },
  { id: "cmegzgu1s000jw2bwdhco4e1r", label: "โรงงาน" },
  { id: "cmegzgxsj000kw2bwebelhpmm", label: "โกดัง" },
]

const statusSellerThai = [
  { value: "APPROVED", label: "ได้รับการยืนยัน" },
  { value: "PENDING", label: "กำลังดำเนินการ" },
  { value: "REJECTED", label: "ถูกปฏิเสธ" }
]



const Deposit = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mainImage, setMainImage] = useState(null);
  const navigate = useNavigate();
  const { addToCompare, compareList } = useCompare();
  const { authUser } = useAuth();


  // ✅ เก็บเฉพาะ id ของยูนิตที่เลือก
  const [selectedUnitId, setSelectedUnitId] = useState();
  const selectedUnit = post?.PropertyUnit?.find((unit) => unit.id === selectedUnitId) || null;

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const response = await apiClient.get(`/propertypost/${id}`);
        setPost(response.data);
        console.log("API Response Data:", response.data);
        if (response.data.Image && response.data.Image.length > 0) {
          setMainImage(response.data.Image[0].secure_url);
        }
      } catch (error) {
        console.error("Failed to fetch post details:", error);
        setPost(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-20 h-20 animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex justify-center items-center h-screen text-xl text-gray-600">
        <p>ไม่พบข้อมูลอสังหาริมทรัพย์ (404 Not Found)</p>
      </div>
    );
  }

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

  const fullAddress = `${post.Address}, ${post.Subdistrict}, ${post.District}, ${post.Province}`;

  const DetailItem = ({ icon, label, value }) => (
    <div className="p-4 bg-gray-50 rounded-lg flex flex-col items-center justify-center text-center border">
      {icon}
      <p className="mt-2 text-sm text-gray-600">{label}</p>
      <p className="font-semibold text-gray-900">{value || "-"}</p>
    </div>
  );

  const isAnyUnitAvailable = post.PropertyUnit?.some((unit) => unit.Status === "AVAILABLE") ?? false;


  const getStatusSeller = (status) => {
    const baseStyles = 'px-2 py-0.5 rounded-md text-xs font-medium'

    switch (status) {
      case 'APPROVED':
        return `${baseStyles} bg-green-100 text-green-800`; // สีเขียว
      case 'PENDING':
        return `${baseStyles} bg-yellow-100 text-yellow-800`; // สีเหลือง
      case 'REJECTED':
        return `${baseStyles} bg-red-100 text-red-800`; // สีแดง
      default:
        return `${baseStyles} bg-gray-100 text-gray-800`; // สีเทาสำหรับสถานะอื่นๆ
    }
  }
  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl py-6 md:py-10">
        {/* --- Header Section --- */}
        <div className="mb-8">
          {(() => {
            // 1. ตรวจสอบและแปลง post.Category ให้เป็น Array ที่ใช้งานได้เสมอ
            const categoriesToShow = Array.isArray(post.Category)
              ? post.Category
              : post.Category ? [post.Category] : [];

            // 2. ถ้ามีข้อมูลใน Array ที่พร้อมใช้งาน (categoriesToShow) ค่อยแสดงผล
            return (
              categoriesToShow.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {categoriesToShow.map((categoryItem, index) => {
                    // 3. ดึงค่า value ออกมา (กรณีเป็น Object) หรือใช้ค่าเดิม (กรณีเป็น String)
                    const categoryValue = typeof categoryItem === 'object' && categoryItem.id ? categoryItem.id : categoryItem;

                    // 4. แปลงเป็นภาษาไทย (ต้องแน่ใจว่า categorythai ถูกต้อง)
                    const thaicategory = categorythai.find(v => v.id === categoryValue)?.label || categoryValue;

                    return (
                      <span
                        key={index}
                        className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full"
                      >
                        {thaicategory}
                      </span>
                    );
                  })}
                </div>
              )
            );
          })()}

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4">{post.Property_Name}</h1>
          <div className="flex items-center gap-2 text-gray-600 mt-2">
            <p className="text-md">{fullAddress}</p>
            {/* --- Google Map --- */}
            {post.LinkMap && (
              <a
                href={post.LinkMap}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline text-sm font-semibold"
              >
                <MapPin size={14} />
                <span>ดูแผนที่</span>
              </a>
            )}
          </div>
        </div>

        {/* --- Image Gallery --- */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <div className="w-full lg:w-[60%]">
            <img
              src={mainImage || "default-image-url.jpg"}
              alt={post.Property_Name}
              className="rounded-2xl w-full h-[300px] md:h-[500px] object-cover shadow-lg"
            />
          </div>
          <div className="w-full lg:w-[40%] grid grid-cols-2 gap-4">
            {post.Image?.slice(1, 5).map((img, index) => (
              <div key={index} className="cursor-pointer" onClick={() => setMainImage(img.secure_url)}>
                <img
                  src={img.secure_url}
                  alt={`${post.Property_Name} thumbnail ${index + 1}`}
                  className={`rounded-2xl w-[250px] h-[240px] object-cover shadow-md transition-all duration-200 ${mainImage === img.secure_url ? "ring-4 ring-blue-500" : "hover:opacity-80"
                    }`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* --- Main Content Area --- */}
        <div className="flex flex-col lg:flex-row mt-8 gap-8">
          {/* Left Column - Details */}
          <div className="w-full lg:w-[65%] space-y-4">
            {/* --- Video --- */}


            {/* --- Property Details --- */}
            <div className="bg-white p-6 rounded-2xl shadow-md border">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">ข้อมูลจำเพาะ</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <DetailItem icon={<BedSingle className="size-7 text-blue-600" />} label="ห้องนอน" value={post.Bedrooms} />
                <DetailItem icon={<Bath className="size-7 text-blue-600" />} label="ห้องน้ำ" value={post.Bathroom} />
                <DetailItem icon={<Grid2x2 className="size-7 text-blue-600" />} label="พื้นที่ใช้สอย (ตร.ม.)" value={post.Usable_Area} />
                <DetailItem icon={<Building className="size-7 text-blue-600" />} label="ขนาดที่ดิน (ตร.ว.)" value={post.Land_Size} />
                <DetailItem icon={<Home className="size-7 text-blue-600" />} label="จำนวนชั้น" value={post.floor} />
                <DetailItem icon={<Car className="size-7 text-blue-600" />} label="ที่จอดรถ" value={post.Parking_Space} />
                <DetailItem icon={<Calendar className="size-7 text-blue-600" />} label="สร้างเมื่อปี" value={post.Year_Built} />
                <DetailItem icon={<Tag className="size-7 text-blue-600" />} label="สถานะ" value={post.Status_post === "CONFIRMED" ? "พร้อมขาย" : post.Status_post} />
              </div>
            </div>

            {/* --- Unit Selection --- */}
            <div className="bg-white p-6 rounded-2xl shadow-md border">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">เลือกยูนิต</h3>
              <div className="flex flex-wrap gap-3">
                {post.PropertyUnit.map((unit) => {
                  const isAvailable = unit.Status === "AVAILABLE";
                  const isSelected = selectedUnitId === unit.id;
                  const thaiStatus = statusUnit.find(s => s.value === unit.Status)?.label || unit.Status;

                  return (
                    <button
                      key={unit.id}
                      onClick={() => {
                        if (isAvailable) setSelectedUnitId(unit.id);
                        console.log("Selected Unit Data:", unit);
                        setSelectedUnitId(isSelected ? null : unit.id);
                      }}
                      disabled={!isAvailable}
                      className={`p-2 px-4 border rounded-lg transition-all duration-200 
                        ${!isAvailable && "bg-gray-200 opacity-50 cursor-not-allowed"}
                        ${isAvailable && !isSelected && "bg-green-200 hover:bg-green-300 cursor-pointer"}
                        ${isAvailable && isSelected && "bg-blue-600 text-white ring-2 ring-blue-700 scale-105 cursor-pointer"}
                      `}
                    >
                      {unit.Unit_Number} - {thaiStatus}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* --- Description --- */}
            <div className="bg-white p-6 rounded-2xl shadow-md border">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">รายละเอียดเพิ่มเติม</h3>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{post.Description}</p>
            </div>

            {/* --- Amenities --- */}
            {post.Additional_Amenities && post.Additional_Amenities.length > 0 && (
              <div className="bg-white p-6 rounded-2xl shadow-md border">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">สิ่งอำนวยความสะดวก</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
                  {post.Additional_Amenities.map((amenityValue, index) => {

                    // --- ส่วนที่เพิ่มเข้ามา ---
                    // ค้นหาชื่อภาษาไทยจาก amenitiesList
                    const thaiAmenity = amenitiesList.find(a => a.value === amenityValue)?.label || amenityValue;
                    // ------------------------

                    return (
                      <div key={index} className="flex items-center gap-2 text-gray-700">
                        <CheckCircle size={18} className="text-green-500" />

                        {/* --- ส่วนที่แก้ไข --- */}
                        <span>{thaiAmenity}</span>
                        {/* -------------------- */}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}


            {post.Video && post.Video.length > 0 && (
              <div className="bg-white p-6 rounded-2xl shadow-md border">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Video className="text-blue-600" />
                  วิดีโอแนะนำ
                </h3>
                <div className="rounded-lg overflow-hidden space-y-2">
                  {post.Video.map((video, index) => {
                    return (
                      <video
                        key={index} // ใช้ index หรือ video.id ถ้ามี
                        src={video.secure_url}
                        controls
                        width="100%"
                        className="rounded-lg"
                      />
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Pricing & Agent Info */}
          <div className="w-full lg:w-[35%] lg:sticky top-10 h-fit space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-lg border space-y-4">
              <div>
                <p className="text-md font-semibold text-gray-600">
                  {post.Sell_Rent === "SALE" ? "ราคาขาย" : "ราคาเช่าเริ่มต้น"}
                </p>
                <h2 className="text-4xl font-bold text-gray-900">฿{post.Price.toLocaleString()}</h2>
                {post.Deposit_Amount && (
                  <p className="text-sm text-gray-500 mt-1">
                    เงินมัดจำ: ฿{post.Deposit_Amount.toLocaleString()}
                  </p>
                )}
              </div>

              <Buttons
                onClick={() => {

                  if (!authUser) {
                    conslog.log("User:", authUser);
                    // ถ้าไม่มี user (ยังไม่ล็อกอิน) ให้เด้งไปหน้า login
                    navigate("/login", { state: { from: location } });
                  } else if (authUser.userType == "Buyer") {
                    // ถ้าล็อกอินแล้ว ให้ไปหน้า Deposit_doc ตามปกติ
                    navigate("/buyer/contract", { state: { postData: post, selectedUnit: selectedUnit } });
                  } else if (authUser.userType == "Seller") {
                    navigate("/seller/contract", { state: { postData: post, selectedUnit: selectedUnit } });
                  }
                }}
                text={!authUser ? "กรุณาล็อกอินเพื่อดำเนินการต่อ" : "ดำเนินการต่อ"}
                color={authUser && selectedUnit ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"}
                className="w-full text-lg"
                disabled={!selectedUnit || !authUser} // <-- ปิดปุ่มถ้ายังไม่เลือกยูนิต หรือ ยังไม่ล็อกอิน
              />

              {!selectedUnit && isAnyUnitAvailable && (
                <p className="text-xs text-center text-gray-600">
                  <Info size={12} className="inline-block mr-1" />
                  กรุณาเลือกยูนิตที่ว่างเพื่อดำเนินการต่อ
                </p>
              )}
              {!isAnyUnitAvailable && (
                <p className="text-xs text-center text-red-600">
                  <Info size={12} className="inline-block mr-1" />
                  ไม่มียูนิตว่างสำหรับทำรายการในขณะนี้
                </p>
              )}

              {isAlreadyCompared ? (
                <Button className="w-full bg-gray-400 hover:bg-gray-500">✅ อยู่ในรายการเปรียบเทียบ</Button>
              ) : (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => addToCompare(compareHouse)}
                >
                  + เพิ่มในรายการเปรียบเทียบ
                </Button>
              )}

              <Link to="/compare" className="w-full block">
                <Button variant="outline" className="w-full">
                  ดูรายการเปรียบเทียบ
                </Button>
              </Link>
            </div>

            {/* Agent Info */}
            <div className="bg-white p-6 rounded-2xl shadow-md border">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">ข้อมูลผู้ประกาศ</h3>
              <div className="flex items-center gap-4">
                {post.user?.image ? (
                  <img
                    src={post.user.image}
                    alt={`${post.user.First_name} ${post.user.Last_name}`}
                    className="w-14 h-14 rounded-full object-cover bg-gray-200"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-600">
                    {post.user?.First_name?.charAt(0)}
                  </div>
                )}
                <div className="flex flex-col">
                  <p className="font-semibold text-lg text-gray-900">{`${post.user?.First_name || ""} ${post.user?.Last_name || ""}`}</p>
                 <div className="flex items-center gap-x-3 text-gray-600 mt-1"> {/* Use one flex container */}
                    {/* Phone */}
                    <div className="flex items-center gap-1"> {/* Sub-flex for phone icon+number */}
                      <Phone size={16} />
                      <span>{post.Phone || "ไม่มีข้อมูลติดต่อ"}</span>
                    </div>

                    {/* Line Icon/Link (Conditional) */}
                    {post?.Link_line && (
                      <a
                        href={`https://line.me/ti/p/~${post.Link_line}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Line ID: ${post.Link_line}`}
                        className="text-green-600 hover:text-green-800 transition-colors"
                        aria-label="ติดต่อทาง Line"
                      >
                        <MessageSquare size={20} />
                      </a>
                    )}

                    {/* Facebook Icon/Link (Conditional) */}
                    {post?.Link_facbook && (
                      <a
                        href={post.Link_facbook}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="ไปที่ Facebook"
                        className="text-blue-700 hover:text-blue-900 transition-colors"
                        aria-label="ไปที่ Facebook"
                      >
                        <Facebook size={20} />
                      </a>
                    )}
                  </div>
                  {/* ========================================== */}

               
                  {post.seller?.Status ? (
                    <div className="flex items-center space-x-2 mt-2">
                      <p className="text-gray-600">สถานะผู้ประกาศ:</p>
                      <span className={getStatusSeller(post.seller.Status)}>
                        {statusSellerThai.find(s => s.value === post.seller.Status)?.label || post.seller.Status}
                      </span>
                    </div>
                  ) : null}


                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
      <Credit className="mt-12" />
    </div>
  );
};

export default Deposit; 
