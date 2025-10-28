import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import axios from "axios";
import { FaMoneyBillWave, FaSearch } from "react-icons/fa";

import { apiClient } from "@/api/authconfig";
import Searchbar from "@/components/form/Searchbar";
import Cards from "@/components/Cards";
import Credit from "@/components/Credit";
import LoanCalculatorModal from "@/components/form/LoanCalculatorModal";
import { HeartCrack, Loader2 } from "lucide-react";

// --- Data and Constants ---

const categories = [
  { id: "cmegzfdya0006w2bwq5d8alc7", name: "คอนโด" },
  { id: "cmegzfhx70007w2bwp63cbc1w", name: "บ้านเดี่ยว" },
  { id: "cmegzfov30009w2bwrxjpt7xn", name: "วิลล่า" },
  { id: "cmegzft08000aw2bwx91l68z9", name: "ทาวน์เฮ้าส์" },
];

const PROVINCE_URL =
  "https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/latest/province.json";
const DISTRICT_URL =
  "https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/latest/district.json";
const SUBDISTRICT_URL =
  "https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/latest/sub_district.json";

// --- Helper Functions ---
const METRO_PROVINCES = [
  "กรุงเทพมหานคร",
  "นนทบุรี",
  "ปทุมธานี",
  "สมุทรปราการ",
  "สมุทรสาคร",
  "นครปฐม",
];

const formatPosts = (posts) => {
  if (!Array.isArray(posts)) return [];
  return posts.map((post) => ({
    id: post.id,
    name: post.Property_Name,
    price: post.Price,
    image:
      post.Image && post.Image.length > 0
        ? post.Image[0].secure_url || post.Image[0].url
        : "default-image-url.jpg",
  }));
};

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

// --- Main Component ---

const Home = () => {
  // --- States ---
  const [showLoanPopup, setShowLoanPopup] = useState(false);
  const [displayedPosts, setDisplayedPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddressLoading, setIsAddressLoading] = useState(true);

  const [allProvinces, setAllProvinces] = useState([]);
  const [allDistricts, setAllDistricts] = useState([]);
  const [allSubDistricts, setAllSubDistricts] = useState([]);

  const [filteredDistricts, setFilteredDistricts] = useState([]);
  const [filteredSubDistricts, setFilteredSubDistricts] = useState([]);

  // --- Form Management ---
  const { register, handleSubmit, watch, control, setValue } = useForm({
    defaultValues: {
      searchQuery: "",
      province: "",
      district: "",
      subdistrict: "",
      minPrice: "",
      maxPrice: "",
      categoryId: "",
    },
  });

  const selectedProvinceName = watch("province");
  const selectedDistrictName = watch("district");
  const formValues = watch();
  const debouncedJSONFilters = useDebounce(JSON.stringify(formValues), 500);

  // --- Effects ---

  useEffect(() => {
    const fetchAddressData = async () => {
      setIsAddressLoading(true);
      try {
        const [provincesRes, districtsRes, subDistrictsRes] = await Promise.all(
          [
            axios.get(PROVINCE_URL),
            axios.get(DISTRICT_URL),
            axios.get(SUBDISTRICT_URL),
          ]
        );
        const provRes = provincesRes.data;
        const distRes = districtsRes.data;
        const subDistRes = subDistrictsRes.data;

        const metroProvinces = METRO_PROVINCES.map((name) =>
          provRes.find((p) => p.name_th === name)
        ).filter(Boolean);

        setAllProvinces(metroProvinces); // 👈 ใช้ข้อมูลที่กรองแล้ว
        setAllDistricts(distRes);
        setAllSubDistricts(subDistRes);
      } catch (error) {
        console.error("Failed to fetch address data:", error);
      } finally {
        setIsAddressLoading(false);
      }
    };
    fetchAddressData();
  }, []);

  useEffect(() => {
    if (
      selectedProvinceName &&
      allProvinces.length > 0 &&
      allDistricts.length > 0
    ) {
      const selectedProvince = allProvinces.find(
        (p) => p.name_th === selectedProvinceName
      );
      if (selectedProvince) {
        const districtsInProvince = allDistricts.filter(
          (d) => d.province_id === selectedProvince.id
        );
        setFilteredDistricts(districtsInProvince);
      }
    } else {
      setFilteredDistricts([]);
    }
  }, [selectedProvinceName, allProvinces, allDistricts]);

  useEffect(() => {
    setFilteredSubDistricts([]);
    if (
      selectedDistrictName &&
      selectedProvinceName &&
      allDistricts.length > 0 &&
      allSubDistricts.length > 0
    ) {
      const selectedProvince = allProvinces.find(
        (p) => p.name_th === selectedProvinceName
      );
      if (!selectedProvince) return;

      const selectedDistrict = allDistricts.find(
        (d) =>
          d.name_th === selectedDistrictName &&
          d.province_id === selectedProvince.id
      );

      if (selectedDistrict) {
        const subDistrictsInDistrict = allSubDistricts.filter(
          (sd) => String(sd.district_id) === String(selectedDistrict.id)
        );
        setFilteredSubDistricts(subDistrictsInDistrict);
      }
    }
  }, [
    selectedDistrictName,
    selectedProvinceName,
    allProvinces,
    allDistricts,
    allSubDistricts,
  ]);

  useEffect(() => {
    const runSearch = async () => {
      const filters = JSON.parse(debouncedJSONFilters);
      setIsLoading(true);
      try {
        const activeFilters = {};
        if (filters.searchQuery) activeFilters.query = filters.searchQuery;
        if (filters.categoryId) activeFilters.categoryId = filters.categoryId;
        if (filters.province) activeFilters.province = filters.province;
        if (filters.district) activeFilters.district = filters.district;
        if (filters.subdistrict)
          activeFilters.subdistrict = filters.subdistrict;
        if (filters.minPrice) activeFilters.minPrice = filters.minPrice;
        if (filters.maxPrice) activeFilters.maxPrice = filters.maxPrice;

        let response;
        if (Object.values(filters).every((val) => val === "")) {
          response = await apiClient.get("/homepage/posts");
          setDisplayedPosts(formatPosts(response.data));
        } else {
          response = await apiClient.post("/search/filters", activeFilters);
          setDisplayedPosts(formatPosts(response.data.posts));
        }
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการค้นหา:", error);
        setDisplayedPosts([]);
      } finally {
        setIsLoading(false);
      }
    };
    runSearch();
  }, [debouncedJSONFilters]);

  // --- Render ---
  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="relative flex items-center justify-center min-h-[70vh] p-4 bg-gradient-to-br from-[#2c3e50] to-[#3498db]">
        <video
          className="absolute top-0 left-0 w-full h-full object-cover opacity-30"
          src="/video/16919716-uhd_3840_2160_30fps.mp4"
          autoPlay
          loop
          muted
          playsInline
        />

        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden">
          <div className="bg-[#2c3e50] text-white p-6">
            <h2 className="text-2xl md:text-3xl font-bold text-center">
              ค้นหาอสังหาริมทรัพย์ที่คุณต้องการ
            </h2>
            <p className="text-center text-blue-100 mt-2">
              ค้นหาบ้าน คอนโด ในฝันของคุณได้ง่ายๆ
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSubmit(() => {})} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {/* Main Search */}
              <div className="md:col-span-2 lg:col-span-3">
                <div className="relative">
                  <Searchbar
                    {...register("searchQuery")}
                    placeholder="ค้นหาจากชื่อ, รายละเอียด, ที่อยู่..."
                    className="pl-12"
                  />
                  <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Property Type */}
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <select
                      {...field}
                      disabled={isAddressLoading}
                      className="p-3 border border-gray-300 rounded-lg w-full bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none pl-10"
                    >
                      <option value="">ทุกประเภทอสังหาริมทรัพย์</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              />

              {/* Province */}
              <Controller
                name="province"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <select
                      {...field}
                      disabled={isAddressLoading}
                      className="p-3 border border-gray-300 rounded-lg w-full bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none pl-10"
                      onChange={(e) => {
                        field.onChange(e);
                        setValue("district", "");
                        setValue("subdistrict", "");
                      }}
                    >
                      <option value="">
                        {isAddressLoading
                          ? "กำลังโหลด..."
                          : "เลือกจังหวัด (กทม./ปริมณฑล)"}
                      </option>
                      {allProvinces.map((p) => (
                        <option key={p.id} value={p.name_th}>
                          {p.name_th}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              />

              {/* District */}
              <Controller
                name="district"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <select
                      {...field}
                      className="p-3 border border-gray-300 rounded-lg w-full bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none pl-10"
                      disabled={
                        isAddressLoading || filteredDistricts.length === 0
                      }
                      onChange={(e) => {
                        field.onChange(e);
                        setValue("subdistrict", "");
                      }}
                    >
                      <option value="">
                        {selectedProvinceName ? "ทุกอำเภอ" : "เลือกจังหวัดก่อน"}
                      </option>
                      {filteredDistricts.map((d) => (
                        <option key={d.id} value={d.name_th}>
                          {d.name_th}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              />

              {/* Subdistrict */}
              <Controller
                name="subdistrict"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <select
                      {...field}
                      className="p-3 border border-gray-300 rounded-lg w-full bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none pl-10"
                      disabled={
                        isAddressLoading || filteredSubDistricts.length === 0
                      }
                    >
                      <option value="">
                        {selectedDistrictName ? "ทุกตำบล" : "เลือกอำเภอก่อน"}
                      </option>
                      {filteredSubDistricts.map((s) => (
                        <option key={s.id} value={s.name_th}>
                          {s.name_th}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              />

              {/* Price Range */}
              <div className="relative">
                <input
                  type="number"
                  {...register("minPrice")}
                  placeholder="ราคาต่ำสุด (บาท)"
                  className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-10"
                />
              </div>

              <div className="relative">
                <input
                  type="number"
                  {...register("maxPrice")}
                  placeholder="ราคาสูงสุด (บาท)"
                  className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-10"
                />
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Property Listings Section */}
      <div className="p-6 md:p-12 lg:p-20 mx-auto max-w-7xl">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#2c3e50] mb-2">
              อสังหาริมทรัพย์แนะนำ
            </h1>
            <p className="text-gray-600">
              ค้นพบตัวเลือกอสังหาริมทรัพย์ที่ดีที่สุดสำหรับคุณ
            </p>
          </div>
          <div className="flex items-center gap-2 mt-4 sm:mt-0">
            <span className="text-gray-600">เรียงตาม:</span>
            <select className="border border-gray-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500">
              <option>ล่าสุด</option>
              <option>ราคาต่ำสุด</option>
              <option>ราคาสูงสุด</option>
              <option>พื้นที่มากที่สุด</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-20 h-20 animate-spin" />
          </div>
        ) : displayedPosts.length > 0 ? (
          <Cards data={displayedPosts} />
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow-md">
            <div className="text-6xl mb-4 ">
              <HeartCrack className="mx-auto text-gray-300 w-32 h-32" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              ไม่พบอสังหาริมทรัพย์ที่ตรงกับการค้นหาของคุณ
            </h3>
            <p className="text-gray-500">
              ลองปรับเปลี่ยนเงื่อนไขการค้นหาหรือล้างตัวกรองเพื่อดูผลลัพธ์ทั้งหมด
            </p>
          </div>
        )}
      </div>

      <Credit />

      {/* Floating Action Button */}
      <button
        onClick={() => setShowLoanPopup((prev) => !prev)}
        className="fixed bottom-6 right-6 z-40 bg-[#2c3e50] text-white border-0 shadow-lg rounded-full p-4 hover:bg-[#1a252f] transition-all duration-300 hover:scale-110"
        aria-label="Loan Calculator"
      >
        <FaMoneyBillWave size={24} />
      </button>

      {/* Loan Calculator Modal */}
      <LoanCalculatorModal
        open={showLoanPopup}
        onOpenChange={setShowLoanPopup}
      />
    </div>
  );
};

export default Home;
