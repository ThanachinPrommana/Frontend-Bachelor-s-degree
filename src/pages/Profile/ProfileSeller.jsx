// src/pages/Profile/Seller/ProfileSeller.jsx
import { useState, useMemo } from "react";
import { FaUser, FaHome, FaBell, FaFileAlt } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import SellerInfo from "./SellerInfo";
import SellerPost from "./SellerPost";
// ⛔️ ลบ SellerDashboard ออกเรียบร้อย
import SellerNoti from "./SellerNoti";
import SellerDoc from "./SellerDoc";

const ProfileSeller = () => {
  const { authUser, loading } = useAuth();
  const [selectedTab, setSelectedTab] = useState("info");

  // ✅ ไม่มี “แดชบอร์ด” แล้ว
  const tabs = useMemo(
    () => [
      { label: "ข้อมูลผู้ขาย", key: "info", icon: <FaUser className="mr-2" /> },
      { label: "โพสต์ของฉัน", key: "post", icon: <FaHome className="mr-2" /> },
      { label: "การแจ้งเตือน", key: "noti", icon: <FaBell className="mr-2" /> },
      { label: "เอกสาร", key: "doc", icon: <FaFileAlt className="mr-2" /> },
    ],
    []
  );

  const currentTab = tabs.find((t) => t.key === selectedTab);

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

  const displayName =
    (authUser?.First_name || authUser?.firstName || "ผู้ขาย") +
    (authUser?.Last_name || authUser?.lastName
      ? ` ${authUser?.Last_name || authUser?.lastName}`
      : "");

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
              src={authUser?.image || "https://ui-avatars.com/api/?name=Seller"}
              alt="รูปโปรไฟล์ผู้ขาย"
              className="w-12 h-12 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div>
              <p className="text-xs md:text-sm text-gray-300">สวัสดี</p>
              <p className="font-bold text-white truncate max-w-[12rem]">
                {displayName}
              </p>
            </div>
          </div>

          {/* Tab Menu */}
          <ul className="space-y-2 text-base md:text-lg">
            {tabs.map((tab) => {
              const isActive = selectedTab === tab.key;
              return (
                <li key={tab.key} className="relative">
                  <button
                    role="tab"
                    aria-selected={isActive}
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
          {/* Breadcrumb */}
          <nav className="text-sm text-gray-500 mb-4" aria-label="breadcrumb">
            <span className="hover:text-gray-700">หน้าหลัก</span> /{" "}
            <span className="hover:text-gray-700">โปรไฟล์ผู้ขาย</span> /{" "}
            <span className="text-gray-800">{currentTab?.label}</span>
          </nav>

          {/* Page Title */}
          <h1 className="text-2xl md:text-3xl font-bold flex items-center mb-6 md:mb-8">
            {currentTab?.icon}
            <span>{currentTab?.label}</span>
          </h1>

          {/* Content */}
          {selectedTab === "info" && <SellerInfo user={authUser} />}
          {selectedTab === "post" && <SellerPost />}
          {selectedTab === "noti" && <SellerNoti />}
          {selectedTab === "doc" && <SellerDoc />}
        </main>
      </div>
    </div>
  );
};

export default ProfileSeller;
