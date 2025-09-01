import { useState } from "react";
import { FaUser, FaHome, FaTachometerAlt, FaBell, FaFileAlt } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import SellerInfo from "./SellerInfo";
import SellerPost from "./SellerPost";
import SellerDashboard from "./SellerDashboard";
import SellerNoti from "./SellerNoti";
import SellerDoc from "./SellerDoc";


const ProfileSeller = () => {
  const { authUser } = useAuth(); // ใช้ context
  const [selectedTab, setSelectedTab] = useState("info");

  
  if (!authUser) {
    return <div className="text-center mt-10">ไม่พบข้อมูลผู้ใช้ หรือกรุณาเข้าสู่ระบบ</div>;
  }


  // console.log("authUser:", authUser);
  // console.log("image:", authUser?.image);


  const tabs = [
    { label: "Info", key: "info", icon: <FaUser className="mr-2" /> },
    { label: "Post", key: "post", icon: <FaHome className="mr-2" /> },
    { label: "Dashboard", key: "dashboard", icon: <FaTachometerAlt className="mr-2" /> },
    { label: "Notification", key: "noti", icon: <FaBell className="mr-2" /> },
    { label: "Document", key: "doc", icon: <FaFileAlt className="mr-2" /> },
  ];

  return (
    <div className="min-h-screen bg-[#ecf0f1] px-8 py-10">
      <div className="max-w-7xl mx-auto flex bg-white rounded-xl shadow-lg overflow-hidden min-h-[80vh]">
        {/* Sidebar */}
        <div className="w-1/4 bg-[#2c3e50] text-white py-10 px-6 relative">
          <div className="mb-10 flex items-center space-x-4">
            <img
              src={authUser?.image || "https://ui-avatars.com/api/?name=Seller"}
              alt="avatar"
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <p className="text-sm text-gray-300">Welcome</p>
              <p className="font-bold text-white">{authUser.First_name} {authUser.Last_name}</p>
            </div>
          </div>

          <ul className="space-y-2 text-lg">
            {tabs.map((tab) => (
              <li key={tab.key} className="relative">
                <button
                  onClick={() => setSelectedTab(tab.key)}
                  className={`w-full flex items-center px-4 py-3 rounded-md transition duration-150 ${selectedTab === tab.key ? "bg-[#34495e]" : "hover:bg-[#3e5870]"
                    }`}
                >
                  {selectedTab === tab.key && (
                    <span className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-tr-md rounded-br-md"></span>
                  )}
                  {tab.icon}
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Content Area */}
        <div className="w-3/4 p-10 overflow-y-auto">
          <nav className="text-sm text-gray-500 mb-4">
            Home / Profile / <span className="text-gray-800 capitalize">{selectedTab}</span>
          </nav>

          <h1 className="text-3xl font-bold flex items-center mb-8">
            {tabs.find((tab) => tab.key === selectedTab)?.icon}
            {tabs.find((tab) => tab.key === selectedTab)?.label}
          </h1>

          {selectedTab === "info" && <SellerInfo user={authUser} />}
          {selectedTab === "post" && <SellerPost />}
          {selectedTab === "dashboard" && <SellerDashboard />}
          {selectedTab === "noti" && <SellerNoti />}
          {selectedTab === "doc" && <SellerDoc />}
        </div>
      </div>
    </div>
  );
};

export default ProfileSeller;
