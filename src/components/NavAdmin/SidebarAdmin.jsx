import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  LogOut,
  Home,
  Users,
  FileText,
  CreditCard,
  Flag,
} from "lucide-react";
import { useState } from "react";

const SidebarAdmin = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeMenus, setActiveMenus] = useState(["posts"]);
  const [activeSubMenus, setActiveSubMenus] = useState([]);

  const toggleMenu = (key) => {
    setActiveMenus((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleSubMenu = (key) => {
    setActiveSubMenus((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const isActiveRoute = (path) =>
    location.pathname === `/${path}` ||
    location.pathname.startsWith(`/${path}`);

  const confirmLogout = () => {
    const confirm = window.confirm("คุณต้องการออกจากระบบใช่หรือไม่?");
    if (confirm) navigate("/login");
  };

  const menuItems = [
    {
      label: "Posts of Seller",
      key: "posts",
      icon: <FileText size={16} />,
      children: [
        { label: "Approval", path: "approval" },
        { label: "Accept post", path: "accept-post" },
        { label: "Reject post", path: "reject-post" },
      ],
    },
    {
      label: "User account",
      key: "user",
      icon: <Users size={16} />,
      children: [
        { label: "Buyer ID", path: "buyer-id" },
        {
          label: "Seller ID",
          key: "seller",
          children: [
            { label: "Verification Seller", path: "seller-id/verify" },
            { label: "Verified Seller", path: "seller-id/verified" },
            { label: "Reject Seller", path: "seller-id/reject" },
          ],
        },
      ],
    },
    {
      label: "Payment",
      key: "payment",
      icon: <CreditCard size={16} />,
      children: [
        { label: "Pay the deposit", path: "pay-deposit" },
        { label: "Pay with bank", path: "pay-bank" },
      ],
    },
    {
      label: "Reports",
      key: "reports",
      icon: <Flag size={16} />,
      children: [{ label: "Description Report", path: "description-report" }],
    },
    {
      label: "Document",
      key: "doc",
      icon: <Home size={16} />,
      children: [],
    },
  ];

  return (
    <div className="w-64 h-screen bg-[#2c3e50] text-white flex flex-col justify-between">
      {/* Top Menu */}
      <div className="p-4 overflow-auto">
        <div className="text-xl font-bold mb-6">🏠 Sale Houses</div>

        {menuItems.map((item) => (
          <div key={item.key}>
            <button
              onClick={() => toggleMenu(item.key)}
              className={`w-full flex justify-between items-center px-2 py-2 rounded transition-all duration-300 ${
                activeMenus.includes(item.key)
                  ? "bg-white text-black"
                  : "bg-[#34495e] text-white"
              }`}
            >
              <span className="flex items-center gap-2">
                {item.icon} {item.label}
              </span>
              {activeMenus.includes(item.key) ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </button>

            {activeMenus.includes(item.key) && item.children?.length > 0 && (
              <div className="ml-4 mt-2 space-y-1 transition-all duration-300">
                {item.children.map((sub) => {
                  if (sub.children) {
                    return (
                      <div key={sub.key}>
                        <button
                          onClick={() => toggleSubMenu(sub.key)}
                          className="w-full flex justify-between items-center px-2 py-1 rounded bg-[#3c5d70] text-white"
                        >
                          <span>{sub.label}</span>
                          {activeSubMenus.includes(sub.key) ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                        </button>
                        {activeSubMenus.includes(sub.key) && (
                          <div className="ml-4 mt-1 space-y-1 transition-all duration-300">
                            {sub.children.map((nested) => (
                              <Link
                                key={nested.path}
                                to={nested.path}
                                className={`block px-2 py-1 rounded ${
                                  isActiveRoute(nested.path)
                                    ? "bg-white text-black font-medium"
                                    : "text-gray-300 hover:text-white"
                                }`}
                              >
                                {nested.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={sub.path}
                      to={sub.path}
                      className={`block px-2 py-1 rounded ${
                        isActiveRoute(sub.path)
                          ? "bg-white text-black font-medium"
                          : "text-gray-300 hover:text-white"
                      }`}
                    >
                      {sub.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Logout */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={confirmLogout}
          className="flex items-center gap-2 w-full px-2 py-2 rounded text-red-400 hover:bg-red-100 hover:text-red-700 transition-all duration-200"
        >
          <LogOut size={18} />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};

export default SidebarAdmin;
