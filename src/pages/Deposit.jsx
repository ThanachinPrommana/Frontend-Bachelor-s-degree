import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  BedSingle, Bath, Grid2x2, Calendar, Car, Home,
  Building, Phone, MapPin, Tag, CheckCircle, Info, Video
} from "lucide-react";

import { apiClient } from "@/api/authconfig";
import { useCompare } from "@/context/CompareContext";
import { Button } from "@/components/ui/button";
import Buttons from "@/components/Buttons";
import Credit from "@/components/Credit";
import { useAuth } from "@/context/AuthContext";

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
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
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

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl py-6 md:py-10">
        {/* --- Header Section --- */}
        <div className="mb-8">
          <span className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full mb-3">
            {post.Category.name}
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{post.Property_Name}</h1>
          <div className="flex items-center gap-2 text-gray-600 mt-2">
            <MapPin size={16} />
            <p className="text-md">{fullAddress}</p>
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
                  className={`rounded-2xl w-full h-full object-cover shadow-md transition-all duration-200 ${mainImage === img.secure_url ? "ring-4 ring-blue-500" : "hover:opacity-80"
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
                <DetailItem icon={<Tag className="size-7 text-blue-600" />} label="สถานะ" value={post.Status_post === "CONFIRMED" ? "พร้อมขาย/เช่า" : post.Status_post} />
              </div>
            </div>

            {/* --- Unit Selection --- */}
            <div className="bg-white p-6 rounded-2xl shadow-md border">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">เลือกยูนิต</h3>
              <div className="flex flex-wrap gap-3">
                {post.PropertyUnit.map((unit) => {
                  const isAvailable = unit.Status === "AVAILABLE";
                  const isSelected = selectedUnitId === unit.id;

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
                      {unit.Unit_Number} - {unit.Status}
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
                  {post.Additional_Amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-2 text-gray-700">
                      <CheckCircle size={18} className="text-green-500" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- Google Map --- */}
            {post.LinkMap && (
              <div className="bg-white p-6 rounded-2xl shadow-md border">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">ตำแหน่งบนแผนที่</h3>
                <a href={post.LinkMap} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full">
                    <MapPin className="mr-2" size={16} />
                    ดูบน Google Maps
                  </Button>
                </a>
              </div>
            )}

            {post.Video && post.Video.length > 0 && (
              <div className="bg-white p-6 rounded-2xl shadow-md border">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Video className="text-blue-600" />
                  วิดีโอแนะนำ
                </h3>
                <div className="rounded-lg overflow-hidden space-y-2">
                  <video
                    src={post.Video[0].secure_url}
                    controls
                    width="100%"
                    height="100%"
                    playing={false}
                    className="rounded-lg"
                    loop
                  />
                  <video
                    src={post.Video[1].secure_url}
                    controls
                    width="100%"
                    height="100%"
                    playing={false}
                    className="rounded-lg"
                    loop
                  />
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
                  }else if(authUser.userType == "Buyer"){
                    // ถ้าล็อกอินแล้ว ให้ไปหน้า Deposit_doc ตามปกติ
                    navigate("/buyer/contract", { state: { postData: post, selectedUnit: selectedUnit } });
                  }else if(authUser.userType == "Seller"){
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
                <div>
                  <p className="font-semibold text-lg text-gray-900">{`${post.user?.First_name || ""} ${post.user?.Last_name || ""}`}</p>
                  <div className="flex items-center gap-2 text-gray-600 mt-1">
                    <Phone size={16} />
                    <span>{post.Phone || "ไม่มีข้อมูลติดต่อ"}</span>
                  </div>
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
