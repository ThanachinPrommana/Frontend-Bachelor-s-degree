// src/pages/Profile/Buyer/ProfileBuyer.jsx
import React, { useState, useMemo, useEffect, lazy, Suspense } from "react";
import {
  FaUser,
  FaBell,
  FaFileAlt,
  FaClipboardList,
  FaCalendarAlt,
} from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";

// ✅ Lazy imports ให้โหลดเบาและเร็วขึ้น
const BuyerInfo = lazy(() => import("./BuyerInfo"));
const BuyerNoti = lazy(() => import("./BuyerNoti"));
const BuyerDoc = lazy(() => import("./BuyerDoc"));
const BuyerBooking = lazy(() => import("./BuyerBooking"));
// const BuyerSchedule = lazy(() => import("./BuyerSchedule"));

// สเกเลตันระหว่างโหลดแท็บ
const LoadingPane = () => (
  <div className="p-6 text-gray-600">กำลังโหลดข้อมูล...</div>
);

// ป้องกัน URL แปลก ๆ (เหมือนฝั่ง Seller)
const isSafeHttpUrl = (u) => {
  if (!u) return false;
  try {
    const x = new URL(u, window.location.origin);
    return x.protocol === "http:" || x.protocol === "https:";
  } catch {
    return false;
  }
};

const ProfileBuyer = () => {
  const { authUser, loading } = useAuth();

  // ✅ จำแท็บล่าสุดใน localStorage
  const [selectedTab, setSelectedTab] = useState(() => {
    return localStorage.getItem("buyerTab") || "info";
  });
  useEffect(() => {
    localStorage.setItem("buyerTab", selectedTab);
  }, [selectedTab]);

  // ✅ ชื่อแท็บให้สอดคล้องกับฝั่ง Seller
  const tabs = useMemo(
    () => [
      {
        label: "ข้อมูลส่วนตัว",
        key: "info",
        icon: <FaUser className="mr-2" />,
      },
      {
        label: "การจอง",
        key: "booking",
        icon: <FaClipboardList className="mr-2" />,
      },
      // {
      //   label: "ตารางเวลา",
      //   key: "schedule",
      //   icon: <FaCalendarAlt className="mr-2" />,
      // },
      { label: "การแจ้งเตือน", key: "noti", icon: <FaBell className="mr-2" /> },
      { label: "เอกสาร", key: "doc", icon: <FaFileAlt className="mr-2" /> },
    ],
    []
  );
  const currentTab = tabs.find((t) => t.key === selectedTab) || tabs[0];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ecf0f1]">
        <div className="animate-pulse text-[#2c3e50]">กำลังโหลดโปรไฟล์...</div>
      </div>
    );
  }

  // Guard: ไม่มีผู้ใช้
  if (!authUser) {
    return (
      <div className="text-center mt-10">
        ไม่พบข้อมูลผู้ใช้ หรือกรุณาเข้าสู่ระบบ
      </div>
    );
  }

  // ชื่อแสดง
  const displayName = useMemo(() => {
    const fn = authUser?.First_name || authUser?.firstName || "ผู้ใช้";
    const ln = authUser?.Last_name || authUser?.lastName || "";
    return ln ? `${fn} ${ln}` : fn;
  }, [
    authUser?.First_name,
    authUser?.Last_name,
    authUser?.firstName,
    authUser?.lastName,
  ]);

  // Avatar ปลอดภัย + fallback
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
          aria-label="เมนูโปรไฟล์ผู้ซื้อ"
        >
          {/* User Info */}
          <div className="mb-8 md:mb-10 flex items-center space-x-4">
            <img
              src={avatarUrl}
              alt="รูปโปรไฟล์ผู้ใช้"
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
                    aria-controls={`panel-${tab.key}`} // a11y ให้สัมพันธ์กับ tabpanel
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

        {/* Content Area */}
        <main className="w-full md:w-3/4 p-6 md:p-10 overflow-y-auto">
          {/* Breadcrumb ใช้คำกลางเหมือน Seller */}
          <nav className="text-sm text-gray-500 mb-4" aria-label="breadcrumb">
            <span className="hover:text-gray-700">หน้าหลัก</span> /{" "}
            <span className="hover:text-gray-700">โปรไฟล์</span> /{" "}
            <span className="text-gray-800">{currentTab?.label}</span>
          </nav>

          {/* Page Title */}
          <h1 className="text-2xl md:text-3xl font-bold flex items-center mb-6 md:mb-8">
            {currentTab?.icon}
            <span>{currentTab?.label}</span>
          </h1>

          {/* Views */}
          <section
            id={`panel-${currentTab?.key}`}
            role="tabpanel"
            aria-labelledby={`tab-${currentTab?.key}`}
          >
            <Suspense fallback={<LoadingPane />}>
              {selectedTab === "info" && <BuyerInfo user={authUser} />}
              {selectedTab === "booking" && <BuyerBooking />}
              {/* {selectedTab === "schedule" && <BuyerSchedule />} */}
              {selectedTab === "noti" && <BuyerNoti />}
              {selectedTab === "doc" && <BuyerDoc />}
            </Suspense>
          </section>
        </main>
      </div>
    </div>
  );
};

export default ProfileBuyer;
