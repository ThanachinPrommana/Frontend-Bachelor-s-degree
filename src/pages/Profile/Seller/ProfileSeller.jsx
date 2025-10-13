// src/pages/Profile/Seller/ProfileSeller.jsx
import React, { useState, useMemo, useEffect, lazy, Suspense } from "react";
import {
  FaUser,
  FaHome,
  FaBell,
  FaFileAlt,
  FaCalendarAlt,
  FaClipboardCheck,
} from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";

// 👉 Lazy imports (ไฟล์ทั้งหมดอยู่โฟลเดอร์เดียวกัน)
const SellerInfo = lazy(() => import("./SellerInfo"));
const SellerPost = lazy(() => import("./SellerPost"));
const SellerNoti = lazy(() => import("./SellerNoti"));
const SellerDoc = lazy(() => import("./SellerDoc"));
const SellerSchedule = lazy(() => import("./SellerSchedule"));
const SellerBooking = lazy(() => import("./SellerBooking"));

// สเกเลตันง่าย ๆ ระหว่างโหลดแท็บ
const LoadingPane = () => (
  <div className="p-6 text-gray-600">กำลังโหลดข้อมูล...</div>
);

// ป้องกัน URL แปลก ๆ
const isSafeHttpUrl = (u) => {
  if (!u) return false;
  try {
    const x = new URL(u, window.location.origin);
    return x.protocol === "http:" || x.protocol === "https:";
  } catch {
    return false;
  }
};

const ProfileSeller = () => {
  const { authUser, loading } = useAuth();

  // ✅ จำแท็บล่าสุด
  const [selectedTab, setSelectedTab] = useState(() => {
    return localStorage.getItem("sellerTab") || "info";
  });
  useEffect(() => {
    localStorage.setItem("sellerTab", selectedTab);
  }, [selectedTab]);

  // ✅ ตั้งชื่อแท็บให้สอดคล้องกับ Buyer
  const tabs = useMemo(
    () => [
      {
        label: "ข้อมูลส่วนตัว",
        key: "info",
        icon: <FaUser className="mr-2" />,
      },
      { label: "ประกาศของฉัน", key: "post", icon: <FaHome className="mr-2" /> },
      {
        label: "ตารางเวลา",
        key: "schedule",
        icon: <FaCalendarAlt className="mr-2" />,
      },
      {
        label: "การจอง",
        key: "booking",
        icon: <FaClipboardCheck className="mr-2" />,
      },
      { label: "การแจ้งเตือน", key: "noti", icon: <FaBell className="mr-2" /> },
      { label: "เอกสาร", key: "doc", icon: <FaFileAlt className="mr-2" /> },
    ],
    []
  );
  const currentTab = tabs.find((t) => t.key === selectedTab) || tabs[0];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ecf0f1]">
        <div className="animate-pulse text-[#2c3e50]">กำลังโหลดโปรไฟล์...</div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="text-center mt-10">
        ไม่พบข้อมูลผู้ใช้ หรือกรุณาเข้าสู่ระบบ
      </div>
    );
  }

  const displayName = useMemo(() => {
    const fn = authUser?.First_name || authUser?.firstName || "ผู้ขาย";
    const ln = authUser?.Last_name || authUser?.lastName || "";
    return ln ? `${fn} ${ln}` : fn;
  }, [
    authUser?.First_name,
    authUser?.Last_name,
    authUser?.firstName,
    authUser?.lastName,
  ]);

  // avatar: ถ้าเป็น http/https ใช้เลย ไม่งั้น fallback UI Avatars
  const avatarUrl = useMemo(() => {
    const candidate = authUser?.image;
    if (isSafeHttpUrl(candidate)) return candidate;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      displayName
    )}`;
  }, [authUser?.image, displayName]);

  return (
    <div className="min-h-screen bg-[#ecf0f1] px-4 md:px-8 py-8 md:py-10">
      <div className="mx-auto max-w-7xl bg-white rounded-xl shadow-lg overflow-hidden min-h-[70vh] md:min-h-[80vh] flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside
          className="w-full md:w-1/4 bg-[#2c3e50] text-white py-8 md:py-10 px-5 md:px-6"
          role="tablist"
          aria-label="เมนูโปรไฟล์ผู้ขาย"
        >
          {/* User Info */}
          <div className="mb-8 md:mb-10 flex items-center space-x-4">
            <img
              src={avatarUrl}
              alt="รูปโปรไฟล์ผู้ขาย"
              className="w-12 h-12 rounded-full object-cover"
              referrerPolicy="no-referrer"
              decoding="async"
              onError={(e) => {
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  displayName
                )}`;
              }}
            />
            <div>
              <p className="text-xs md:text-sm text-gray-300">สวัสดี</p>
              <p className="font-bold text-white truncate max-w-[12rem]">
                {displayName}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <ul className="space-y-2 text-base md:text-lg">
            {tabs.map((tab) => {
              const isActive = selectedTab === tab.key;
              return (
                <li key={tab.key} className="relative">
                  <button
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`panel-${tab.key}`}
                    id={`tab-${tab.key}`}
                    onClick={() => setSelectedTab(tab.key)}
                    className={`w-full flex items-center px-4 py-3 rounded-md transition duration-150 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                      isActive ? "bg-[#34495e]" : "hover:bg-[#3e5870]"
                    }`}
                  >
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-tr-md rounded-br-md"
                      />
                    )}
                    {tab.icon}
                    <span className="truncate">{tab.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Content */}
        <main className="w-full md:w-3/4 p-6 md:p-10 overflow-y-auto">
          {/* Breadcrumb ใช้คำกลางเหมือน Buyer */}
          <nav className="text-sm text-gray-500 mb-4" aria-label="breadcrumb">
            <span className="hover:text-gray-700">หน้าหลัก</span> /{" "}
            <span className="hover:text-gray-700">โปรไฟล์</span> /{" "}
            <span className="text-gray-800">{currentTab?.label}</span>
          </nav>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold flex items-center mb-6 md:mb-8">
            {currentTab?.icon}
            <span>{currentTab?.label}</span>
          </h1>

          {/* Views (lazy + Suspense) */}
          <section
            id={`panel-${currentTab?.key}`}
            role="tabpanel"
            aria-labelledby={`tab-${currentTab?.key}`}
          >
            <Suspense fallback={<LoadingPane />}>
              {selectedTab === "info" && <SellerInfo />}
              {selectedTab === "post" && <SellerPost />}
              {selectedTab === "schedule" && <SellerSchedule />}
              {selectedTab === "booking" && <SellerBooking />}
              {selectedTab === "noti" && <SellerNoti />}
              {selectedTab === "doc" && <SellerDoc />}
            </Suspense>
          </section>
        </main>
      </div>
    </div>
  );
};

export default ProfileSeller;
