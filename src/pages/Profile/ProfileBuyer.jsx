// src/pages/Profile/Buyer/ProfileBuyer.jsx
import { useEffect, useState, useMemo } from "react";
import { FaUser, FaHeart, FaBell, FaFileAlt } from "react-icons/fa";
import BuyerInfo from "./BuyerInfo";
import BuyerFavorite from "./BuyerFavorite";
import BuyerNoti from "./BuyerNoti";
import BuyerDoc from "./BuyerDoc";
// ❌ ไม่ได้ใช้แล้ว: import { getbuyer } from "@/api/user";
import { useAuth } from "@/context/AuthContext";

const ProfileBuyer = () => {
  const [selectedTab, setSelectedTab] = useState("info");
  const { authUser, loading } = useAuth();

  // แปลเป็นภาษาไทย + ชื่อแท็บสั้นจำง่าย
  const tabs = useMemo(
    () => [
      { label: "ข้อมูลของฉัน", key: "info", icon: <FaUser className="mr-2" /> },
      {
        label: "รายการถูกใจ",
        key: "favorite",
        icon: <FaHeart className="mr-2" />,
      },
      { label: "การแจ้งเตือน", key: "noti", icon: <FaBell className="mr-2" /> },
      { label: "เอกสาร", key: "doc", icon: <FaFileAlt className="mr-2" /> },
    ],
    []
  );

  const currentTab = tabs.find((t) => t.key === selectedTab);

  // ถ้ายังโหลดสถานะผู้ใช้อยู่ แสดงสถานะโหลดสั้น ๆ
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ecf0f1]">
        <div className="animate-pulse text-[#2c3e50]">กำลังโหลดโปรไฟล์...</div>
      </div>
    );
  }

  const displayName =
    (authUser?.First_name || authUser?.firstName || "ผู้ใช้") +
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
          aria-label="เมนูโปรไฟล์ผู้ซื้อ"
        >
          {/* User Info */}
          <div className="mb-8 md:mb-10 flex items-center space-x-4">
            <img
              src={authUser?.image || "https://ui-avatars.com/api/?name=Buyer"}
              alt="รูปโปรไฟล์ผู้ใช้"
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
            <span className="hover:text-gray-700">โปรไฟล์</span> /{" "}
            <span className="text-gray-800">{currentTab?.label}</span>
          </nav>

          {/* Page Title */}
          <h1 className="text-2xl md:text-3xl font-bold flex items-center mb-6 md:mb-8">
            {currentTab?.icon}
            <span>{currentTab?.label}</span>
          </h1>

          {/* Content */}
          {selectedTab === "info" && <BuyerInfo user={authUser} />}
          {selectedTab === "favorite" && <BuyerFavorite />}
          {selectedTab === "noti" && <BuyerNoti />}
          {selectedTab === "doc" && <BuyerDoc />}
        </main>
      </div>
    </div>
  );
};

export default ProfileBuyer;
