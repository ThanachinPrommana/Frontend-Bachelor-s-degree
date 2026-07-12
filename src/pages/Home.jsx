import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Link } from "react-router-dom";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { FaBalanceScale, FaMoneyBillWave, FaSearch } from "react-icons/fa";

import { apiClient } from "@/api/authconfig";
import Searchbar from "@/components/form/Searchbar";
import Buttons from "@/components/Buttons";
import Cards from "@/components/Cards";
import Credit from "@/components/Credit";
import LoanCalculatorModal from "@/components/form/LoanCalculatorModal";
import { HeartCrack, Loader2 } from 'lucide-react';
import { useCompare } from "@/context/CompareContext";
import { FaCheck } from "react-icons/fa";
import { useMemo } from "react";
// --- Data and Constants ---

const categories = [
  { id: "cmegzfdya0006w2bwq5d8alc7", name: "คอนโด" },
  { id: "cmegzfhx70007w2bwp63cbc1w", name: "บ้านเดี่ยว" },
  { id: "cmegzfov30009w2bwrxjpt7xn", name: "วิลล่า" },
  { id: "cmegzft08000aw2bwx91l68z9", name: "ทาวน์เฮ้าส์" },

];

const categoryMap = new Map(categories.map(item => [item.id, item.name]));
const getCategoryLabel = (id) => {
  return categoryMap.get(id) || "ไม่ระบุประเภท";
};

const PROVINCE_URL = "https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/latest/province.json";
const DISTRICT_URL = "https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/latest/district.json";
const SUBDISTRICT_URL = "https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/latest/sub_district.json";
const POSTS_PER_PAGE = 10;
// --- Helper Functions ---
const METRO_PROVINCES = [
  "กรุงเทพมหานคร",
  "นนทบุรี",
  "ปทุมธานี",
  "สมุทรปราการ",
  "สมุทรสาคร",
  "นครปฐม",
];

const KEY_FILTERS = "homeFilters";
const KEY_SORT = "homeSortBy";

const formatPosts = (posts) => {
  if (!Array.isArray(posts)) return [];
  return posts.map(post => ({
    id: post.id,
    name: post.Property_Name,
    price: post.Price,
    image: post.Image && post.Image.length > 0 ? post.Image[0].secure_url || post.Image[0].url : 'default-image-url.jpg'
  }));
};

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
    return () => { clearTimeout(handler); };
  }, [value, delay]);
  return debouncedValue;
};

const getPaginationRange = (currentPage, totalPages, siblings = 1) => {
  const totalPageNumbersToShow = siblings * 2 + 3;
  const totalFixedPages = 3 + 2 * siblings;

  if (totalPages <= totalFixedPages + 2) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblings, 1);
  const rightSiblingIndex = Math.min(currentPage + siblings, totalPages);
  const showLeftEllipsis = leftSiblingIndex > 2;
  const showRightEllipsis = rightSiblingIndex < totalPages - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    let leftItemCount = totalFixedPages;
    const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
    return [...leftRange, '...', totalPages];
  }
  if (showLeftEllipsis && !showRightEllipsis) {
    let rightItemCount = totalFixedPages;
    const rightRange = Array.from({ length: rightItemCount }, (_, i) => totalPages - rightItemCount + i + 1);
    return [1, '...', ...rightRange];
  }
  if (showLeftEllipsis && showRightEllipsis) {
    let middleRangeCount = totalPageNumbersToShow - 2;
    let middleRange = Array.from({ length: middleRangeCount }, (_, i) => leftSiblingIndex + i);
    return [1, '...', ...middleRange, '...', totalPages];
  }
  return Array.from({ length: totalPages }, (_, i) => i + 1);
};

// --- Main Component ---

const Home = () => {
  // --- States ---
  const [showLoanPopup, setShowLoanPopup] = useState(false);
  const [displayedPosts, setDisplayedPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddressLoading, setIsAddressLoading] = useState(true);
  const [originalPosts, setOriginalPosts] = useState([]);

  // ⭐️ (เพิ่ม) 5. เรียกใช้ Compare Context
  const [sortBy, setSortBy] = useState("preferred");
  const { compareList, addToCompare, removeFromCompare } = useCompare();
  const compareIds = useMemo(() => new Set(compareList.map(item => item.id)), [compareList]);
  const MAX_COMPARE_ITEMS = 3; // (กำหนดค่าสูงสุด)


  const [allProvinces, setAllProvinces] = useState([]);
  const [allDistricts, setAllDistricts] = useState([]);
  const [allSubDistricts, setAllSubDistricts] = useState([]);

  const [filteredDistricts, setFilteredDistricts] = useState([]);
  const [filteredSubDistricts, setFilteredSubDistricts] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  // --- Form Management ---
  const { register, handleSubmit, watch, control, setValue, reset } = useForm({
    defaultValues: {
      searchQuery: "", province: "", district: "", subdistrict: "",
      minPrice: "", maxPrice: "", categoryId: ""
    }
  });

  const selectedProvinceName = watch("province");
  const selectedDistrictName = watch("district");
  const formValues = watch();
  const debouncedJSONFilters = useDebounce(JSON.stringify(formValues), 500);

  // --- Effects ---

  const getPaginationRange = (currentPage, totalPages, siblings = 1) => {
    const totalPageNumbersToShow = siblings * 2 + 3; // (siblings * 2) + first + current + last
    const totalFixedPages = 3 + 2 * siblings; // first + last + current + (2 * siblings)

    // Case 1: ถ้าน้อยกว่าจำนวนที่จะแสดง (เช่น 7) ก็แสดงทั้งหมด
    if (totalPages <= totalFixedPages + 2) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblings, 1);
    const rightSiblingIndex = Math.min(currentPage + siblings, totalPages);

    const showLeftEllipsis = leftSiblingIndex > 2;
    const showRightEllipsis = rightSiblingIndex < totalPages - 1;

    // Case 2: ไม่มี ... ด้านซ้าย (อยู่ใกล้ตอนต้น)
    if (!showLeftEllipsis && showRightEllipsis) {
      let leftItemCount = totalFixedPages;
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
      return [...leftRange, '...', totalPages];
    }

    // Case 3: ไม่มี ... ด้านขวา (อยู่ใกล้ตอนจบ)
    if (showLeftEllipsis && !showRightEllipsis) {
      let rightItemCount = totalFixedPages;
      const rightRange = Array.from({ length: rightItemCount }, (_, i) => totalPages - rightItemCount + i + 1);
      return [1, '...', ...rightRange];
    }

    // Case 4: มี ... ทั้งสองด้าน (อยู่ตรงกลาง)
    if (showLeftEllipsis && showRightEllipsis) {
      let middleRangeCount = totalPageNumbersToShow - 2; // - first and last
      let middleRange = Array.from({ length: middleRangeCount }, (_, i) => leftSiblingIndex + i);
      return [1, '...', ...middleRange, '...', totalPages];
    }

    // Default (shouldn't be reached, but for safety)
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  };

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

  useEffect(() => {
    try {
      localStorage.setItem(KEY_FILTERS, JSON.stringify(formValues));
    } catch { }
  }, [formValues]);

  useEffect(() => {
    if (selectedProvinceName && allProvinces.length > 0 && allDistricts.length > 0) {
      const selectedProvince = allProvinces.find(p => p.name_th === selectedProvinceName);
      if (selectedProvince) {
        const districtsInProvince = allDistricts.filter(d => d.province_id === selectedProvince.id);
        setFilteredDistricts(districtsInProvince);
      }
    } else {
      setFilteredDistricts([]);
    }
  }, [selectedProvinceName, allProvinces, allDistricts]);

  useEffect(() => {
    try {
      localStorage.setItem(KEY_SORT, sortBy);
    } catch { }
  }, [sortBy]);

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
        console.log(subDistrictsInDistrict)
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
      setCurrentPage(1);
      const filters = JSON.parse(debouncedJSONFilters);
      setIsLoading(true);
      try {
        const activeFilters = {};
        if (filters.searchQuery) activeFilters.query = filters.searchQuery;
        if (filters.categoryId) activeFilters.categoryId = filters.categoryId;
        if (filters.province) activeFilters.province = filters.province;
        if (filters.district) activeFilters.district = filters.district;
        if (filters.subdistrict) activeFilters.subdistrict = filters.subdistrict;
        if (filters.minPrice) activeFilters.minPrice = filters.minPrice;
        if (filters.maxPrice) activeFilters.maxPrice = filters.maxPrice;

        let response;
        if (Object.values(filters).every(val => val === "")) {
          // (เพิ่ม params.sort)
          response = await apiClient.get('/homepage/posts', {
            params: { sort: sortBy },
          });
          setOriginalPosts(response.data); // (คงไว้)
          setDisplayedPosts(formatPosts(response.data));
        } else {
          // (เพิ่ม sort payload)
          const sortForSearch = sortBy === "preferred" ? "latest" : sortBy;
          const payload = {
            ...activeFilters,
            sort: sortForSearch,
          };
          response = await apiClient.post('/search/filters', payload);
          setOriginalPosts(response.data.posts); // (คงไว้)
          setDisplayedPosts(formatPosts(response.data.posts));
        }
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการค้นหา:", error);
        setOriginalPosts([]); // (เพิ่ม)
        setDisplayedPosts([]);
      } finally {
        setIsLoading(false);
      }
    };
    runSearch();
  }, [debouncedJSONFilters, sortBy, reset]);

  // ⭐️ (เพิ่ม) 7. สร้างฟังก์ชันสำหรับจัดการการกดปุ่มเปรียบเทียบ
  const handleAddToCompare = (postId) => {
    if (compareIds.has(postId)) {
      removeFromCompare(postId); // ถ้ามีอยู่แล้ว ให้ลบออก
      return;
    }

    if (compareList.length >= MAX_COMPARE_ITEMS) {
      alert(`คุณสามารถเปรียบเทียบได้สูงสุด ${MAX_COMPARE_ITEMS} รายการ`);
      return;
    }

    // ใช้ข้อมูลจาก "originalPosts" (ที่มีข้อมูลครบ)
    const postToAdd = originalPosts.find(p => p.id === postId);
    if (!postToAdd) return;

    // (สำคัญ) แปลงข้อมูลให้ตรงกับที่หน้า Compare.jsx ต้องการ
    // (ตรวจสอบฟิลด์เหล่านี้จาก Backend / Schema ของคุณ)
    const formattedPost = {
      id: postToAdd.id,
      name: postToAdd.Property_Name,
      src: postToAdd.Image?.[0]?.secure_url || postToAdd.Image?.[0]?.url || '/placeholder.jpg',
      price: postToAdd.Price,
      deposit: postToAdd.Deposit_Amount,
      size: postToAdd.Usable_Area, // (ตรวจสอบชื่อฟิลด์นี้)
      badroom: postToAdd.Bedrooms,
      bathroom: postToAdd.Bathroom, // (ตรวจสอบชื่อฟิลด์นี้)
      type: getCategoryLabel(postToAdd.categoryId)
    };

    addToCompare(formattedPost);
  };


  const indexOfLastPost = currentPage * POSTS_PER_PAGE;
  const indexOfFirstPost = indexOfLastPost - POSTS_PER_PAGE;
  const currentPosts = displayedPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(displayedPosts.length / POSTS_PER_PAGE);
  const pageNumbers = getPaginationRange(currentPage, totalPages);

  // --- Render ---
  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="relative flex items-center justify-center min-h-[70vh] p-4 bg-gradient-to-br from-[#2c3e50] to-[#3498db]">
        <video
          className="absolute top-0 left-0 w-full h-full object-cover opacity-30"
          src="video/8302413-uhd_4096_2160_25fps.mp4"
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
          <form onSubmit={handleSubmit(() => { })} className="p-6">
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
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
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
                        setValue('district', '');
                        setValue('subdistrict', '');
                      }}
                    >
                      <option value="">{isAddressLoading ? "กำลังโหลด..." : "เลือกจังหวัด (กทม./ปริมณฑล)"}</option>
                      {allProvinces.map(p => (
                        <option key={p.id} value={p.name_th}>{p.name_th}</option>
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
                      disabled={isAddressLoading || filteredDistricts.length === 0}
                      onChange={(e) => {
                        field.onChange(e);
                        setValue('subdistrict', '');
                      }}
                    >
                      <option value="">{selectedProvinceName ? "ทุกอำเภอ" : "เลือกจังหวัดก่อน"}</option>
                      {filteredDistricts.map(d => (
                        <option key={d.id} value={d.name_th}>{d.name_th}</option>
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
                      disabled={isAddressLoading || filteredSubDistricts.length === 0}
                    >
                      <option value="">{selectedDistrictName ? "ทุกตำบล" : "เลือกอำเภอก่อน"}</option>
                      {filteredSubDistricts.map(s => (
                        <option key={s.id} value={s.name_th}>{s.name_th}</option>
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
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500"
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
          // --- MODIFIED: Wrapper for Cards + Pagination ---
          <>
            <Cards
              data={currentPosts}
              onAddToCompare={handleAddToCompare} // ⭐️ (เพิ่ม)
              compareIds={compareIds} // ⭐️ (เพิ่ม)
            /> {/* 👈 MODIFIED: Use currentPosts */}

            {/* --- ADDED: Pagination Controls --- */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-10 gap-2">
                {/* Previous Button */}
                <Buttons
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  text="< ก่อนหน้า"
                  color={currentPage === 1 ? "bg-gray-400 cursor-not-allowed" : "bg-[#2c3e50] hover:bg-[#1a252f]"}
                  className="px-4 py-2 rounded-lg"
                />

                {/* Page Numbers */}
                {pageNumbers.map((page, index) => {
                  if (page === '...') {
                    return <span key={`ellipsis-${index}`} className="px-2 py-2 text-gray-500">...</span>;
                  }

                  const isActive = currentPage === page;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      disabled={isActive}
                      className={`px-4 py-2 rounded-lg border font-medium transition-colors ${isActive
                        ? 'bg-[#2c3e50] text-white border-[#2c3e50] cursor-default'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'
                        }`}
                    >
                      {page}
                    </button>
                  );
                })}

                {/* Next Button */}
                <Buttons
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  text="ถัดไป >"
                  color={currentPage === totalPages ? "bg-gray-400 cursor-not-allowed" : "bg-[#2c3e50] hover:bg-[#1a252f]"}
                  className="px-4 py-2 rounded-lg"
                />
              </div>
            )}
            {/* --- END: Pagination Controls --- */}
          </>
          // --- END: MODIFIED Wrapper ---
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow-md">
            <div className="text-6xl mb-4 ">
              <HeartCrack className="mx-auto text-gray-300 w-32 h-32" /> {/* เพิ่ม w-32 h-32 */}
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

      <button
        onClick={() => setShowLoanPopup((prev) => !prev)}
        className="fixed bottom-6 right-6 z-40 bg-[#2c3e50] text-white border-0 shadow-lg rounded-full p-4 hover:bg-[#1a252f] transition-all duration-300 hover:scale-110"
        aria-label="Loan Calculator"
      >
        <FaMoneyBillWave size={24} />
      </button>

      <AnimatePresence>
        {showLoanPopup && (
          <motion.div
            key="loan-popup"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="bg-[#2c3e50] text-white p-4 rounded-t-xl flex justify-between items-center">
                <h3 className="text-xl font-bold">คำนวณสินเชื่อบ้าน</h3>
                <button onClick={() => setShowLoanPopup((prev) => !prev)}> ... </button>

              </div>
              <div className="p-6">
                <LoanCalculatorModal open={showLoanPopup} onOpenChange={setShowLoanPopup} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;