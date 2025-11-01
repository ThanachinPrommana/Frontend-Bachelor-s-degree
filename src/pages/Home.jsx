import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import axios from "axios";
import { FaMoneyBillWave, FaSearch } from "react-icons/fa";
import { HeartCrack, Loader2 } from "lucide-react";

import { apiClient } from "@/api/authconfig";
import Searchbar from "@/components/form/Searchbar";
import Cards from "@/components/Cards";
import Credit from "@/components/Credit";
import LoanCalculatorModal from "@/components/form/LoanCalculatorModal";

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

const METRO_PROVINCES = [
  "กรุงเทพมหานคร",
  "นนทบุรี",
  "ปทุมธานี",
  "สมุทรปราการ",
  "สมุทรสาคร",
  "นครปฐม",
];

const POSTS_PER_PAGE = 10;

// --- localStorage keys ---
const KEY_FILTERS = "homeFilters";
const KEY_SORT = "homeSortBy";

// --- Helpers ---
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
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const getPaginationRange = (currentPage, totalPages, siblings = 1) => {
  const totalPageNumbersToShow = siblings * 2 + 3;
  const totalFixedPages = 3 + 2 * siblings;

  if (totalPages <= totalFixedPages + 2) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const left = Math.max(currentPage - siblings, 1);
  const right = Math.min(currentPage + siblings, totalPages);

  const showLeftEllipsis = left > 2;
  const showRightEllipsis = right < totalPages - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftRange = Array.from({ length: totalFixedPages }, (_, i) => i + 1);
    return [...leftRange, "...", totalPages];
  }
  if (showLeftEllipsis && !showRightEllipsis) {
    const rightRange = Array.from(
      { length: totalFixedPages },
      (_, i) => totalPages - totalFixedPages + i + 1
    );
    return [1, "...", ...rightRange];
  }
  if (showLeftEllipsis && showRightEllipsis) {
    const middleCount = totalPageNumbersToShow - 2;
    const middle = Array.from({ length: middleCount }, (_, i) => left + i);
    return [1, "...", ...middle, "...", totalPages];
  }
  return Array.from({ length: totalPages }, (_, i) => i + 1);
};

// --- Main Component ---
export default function Home() {
  const [showLoanPopup, setShowLoanPopup] = useState(false);
  const [displayedPosts, setDisplayedPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState("preferred");
  const [isAddressLoading, setIsAddressLoading] = useState(true);
  const [allProvinces, setAllProvinces] = useState([]);
  const [allDistricts, setAllDistricts] = useState([]);
  const [allSubDistricts, setAllSubDistricts] = useState([]);
  const [filteredDistricts, setFilteredDistricts] = useState([]);
  const [filteredSubDistricts, setFilteredSubDistricts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const { register, handleSubmit, watch, control, setValue, reset } = useForm({
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

  // ✅ โหลดข้อมูล address
  useEffect(() => {
    const fetchAddressData = async () => {
      setIsAddressLoading(true);
      try {
        const [prov, dist, subd] = await Promise.all([
          axios.get(PROVINCE_URL),
          axios.get(DISTRICT_URL),
          axios.get(SUBDISTRICT_URL),
        ]);
        const provRes = prov.data;
        const distRes = dist.data;
        const subDistRes = subd.data;

        const metroOnly = METRO_PROVINCES.map((name) =>
          provRes.find((p) => p.name_th === name)
        ).filter(Boolean);

        setAllProvinces(metroOnly);
        setAllDistricts(distRes);
        setAllSubDistricts(subDistRes);
      } catch (e) {
        console.error("Failed to fetch address data:", e);
      } finally {
        setIsAddressLoading(false);
      }
    };
    fetchAddressData();
  }, []);

  // ✅ โหลดค่า filter/sort หลัง address โหลดครบ
  useEffect(() => {
    const savedFilters = localStorage.getItem(KEY_FILTERS);
    const savedSort = localStorage.getItem(KEY_SORT);

    if (savedSort) setSortBy(savedSort);

    if (!isAddressLoading && savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters);
        reset(parsed);
      } catch (e) {
        console.error("Error restoring filters:", e);
      }
    }
  }, [isAddressLoading, reset]);

  // ✅ บันทึกค่า filter ทุกครั้งที่เปลี่ยน
  useEffect(() => {
    try {
      localStorage.setItem(KEY_FILTERS, JSON.stringify(formValues));
    } catch {}
  }, [formValues]);

  // ✅ บันทึกค่า sort ทุกครั้งที่เปลี่ยน
  useEffect(() => {
    try {
      localStorage.setItem(KEY_SORT, sortBy);
    } catch {}
  }, [sortBy]);

  // ---- Cascade province -> district
  useEffect(() => {
    if (selectedProvinceName && allProvinces.length && allDistricts.length) {
      const selectedProvince = allProvinces.find(
        (p) => p.name_th === selectedProvinceName
      );
      if (selectedProvince) {
        setFilteredDistricts(
          allDistricts.filter((d) => d.province_id === selectedProvince.id)
        );
      }
    } else {
      setFilteredDistricts([]);
    }
  }, [selectedProvinceName, allProvinces, allDistricts]);

  // ---- Cascade district -> subdistrict
  useEffect(() => {
    setFilteredSubDistricts([]);
    if (
      selectedDistrictName &&
      selectedProvinceName &&
      allDistricts.length &&
      allSubDistricts.length
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
        setFilteredSubDistricts(
          allSubDistricts.filter(
            (sd) => String(sd.district_id) === String(selectedDistrict.id)
          )
        );
      }
    }
  }, [
    selectedDistrictName,
    selectedProvinceName,
    allProvinces,
    allDistricts,
    allSubDistricts,
  ]);

  // ✅ Search / Sort
  useEffect(() => {
    const runSearch = async () => {
      setCurrentPage(1);
      const filters = JSON.parse(debouncedJSONFilters);
      setIsLoading(true);
      try {
        const active = {};
        if (filters.searchQuery) active.query = filters.searchQuery;
        if (filters.categoryId) active.categoryId = filters.categoryId;
        if (filters.province) active.province = filters.province;
        if (filters.district) active.district = filters.district;
        if (filters.subdistrict) active.subdistrict = filters.subdistrict;
        if (filters.minPrice) active.minPrice = filters.minPrice;
        if (filters.maxPrice) active.maxPrice = filters.maxPrice;

        let res;
        if (Object.values(filters).every((v) => v === "")) {
          res = await apiClient.get("/homepage/posts", {
            params: { sort: sortBy },
          });
          setDisplayedPosts(formatPosts(res.data));
        } else {
          const sortForSearch = sortBy === "preferred" ? "latest" : sortBy;
          res = await apiClient.post("/search/filters", {
            ...active,
            sort: sortForSearch,
          });
          setDisplayedPosts(formatPosts(res.data.posts));
        }
      } catch (e) {
        console.error("เกิดข้อผิดพลาดในการค้นหา:", e);
        setDisplayedPosts([]);
      } finally {
        setIsLoading(false);
      }
    };
    runSearch();
  }, [debouncedJSONFilters, sortBy]);

  // ---- Pagination
  const indexOfLastPost = currentPage * POSTS_PER_PAGE;
  const indexOfFirstPost = indexOfLastPost - POSTS_PER_PAGE;
  const currentPosts = displayedPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(displayedPosts.length / POSTS_PER_PAGE);
  const pageNumbers = getPaginationRange(currentPage, totalPages);

  // ---- Render
  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Hero + Search */}
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

          <form onSubmit={handleSubmit(() => {})} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-2 lg:col-span-3">
                <div className="relative">
                  <Searchbar
                    {...register("searchQuery")}
                    placeholder="ค้นหาจากชื่อ, รายละเอียด, ที่อยู่..."
                    className="pl-12"
                  />
                  <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Filters */}
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    disabled={isAddressLoading}
                    className="p-3 border rounded-lg w-full bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">ทุกประเภทอสังหาริมทรัพย์</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              />

              <Controller
                name="province"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    disabled={isAddressLoading}
                    onChange={(e) => {
                      field.onChange(e);
                      setValue("district", "");
                      setValue("subdistrict", "");
                    }}
                    className="p-3 border rounded-lg w-full bg-white focus:ring-2 focus:ring-blue-500"
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
                )}
              />

              <Controller
                name="district"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    disabled={
                      isAddressLoading || filteredDistricts.length === 0
                    }
                    onChange={(e) => {
                      field.onChange(e);
                      setValue("subdistrict", "");
                    }}
                    className="p-3 border rounded-lg w-full bg-white focus:ring-2 focus:ring-blue-500"
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
                )}
              />

              <Controller
                name="subdistrict"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    disabled={
                      isAddressLoading || filteredSubDistricts.length === 0
                    }
                    className="p-3 border rounded-lg w-full bg-white focus:ring-2 focus:ring-blue-500"
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
                )}
              />

              <input
                type="number"
                {...register("minPrice")}
                placeholder="ราคาต่ำสุด (บาท)"
                className="p-3 border rounded-lg w-full focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                {...register("maxPrice")}
                placeholder="ราคาสูงสุด (บาท)"
                className="p-3 border rounded-lg w-full focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Listings */}
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
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="border rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="preferred">พื้นที่ที่ต้องการ</option>
              <option value="latest">ล่าสุด</option>
              <option value="priceAsc">ราคาต่ำสุด</option>
              <option value="priceDesc">ราคาแพงสุด</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-20 h-20 animate-spin" />
          </div>
        ) : displayedPosts.length > 0 ? (
          <>
            <Cards data={currentPosts} />
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-10 gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
                    currentPage === 1
                      ? "bg-gray-300 text-white cursor-not-allowed"
                      : "bg-[#2c3e50] text-white hover:bg-[#1a252f]"
                  }`}
                >
                  &lt; ก่อนหน้า
                </button>

                {pageNumbers.map((page, idx) =>
                  page === "..." ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-2 text-gray-500"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      disabled={currentPage === page}
                      className={`px-4 py-2 rounded-lg border font-medium ${
                        currentPage === page
                          ? "bg-[#2c3e50] text-white"
                          : "bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-lg border font-medium ${
                    currentPage === totalPages
                      ? "bg-gray-300 text-white cursor-not-allowed"
                      : "bg-[#2c3e50] text-white hover:bg-[#1a252f]"
                  }`}
                >
                  ถัดไป &gt;
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow-md">
            <HeartCrack className="mx-auto text-gray-300 w-32 h-32 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              ไม่พบอสังหาริมทรัพย์ที่ตรงกับการค้นหาของคุณ
            </h3>
            <p className="text-gray-500">
              ลองปรับเงื่อนไขหรือกดล้างตัวกรองเพื่อดูผลลัพธ์ทั้งหมด
            </p>
          </div>
        )}
      </div>

      <Credit />

      {/* Floating Button */}
      <button
        onClick={() => setShowLoanPopup((prev) => !prev)}
        className="fixed bottom-6 right-6 bg-[#2c3e50] text-white rounded-full p-4 shadow-lg hover:bg-[#1a252f] transition-all duration-300 hover:scale-110"
        aria-label="Loan Calculator"
      >
        <FaMoneyBillWave size={24} />
      </button>

      <LoanCalculatorModal
        open={showLoanPopup}
        onOpenChange={setShowLoanPopup}
      />
    </div>
  );
}
