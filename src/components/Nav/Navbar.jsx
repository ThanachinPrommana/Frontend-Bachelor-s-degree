// src/components/Nav/Navbar.jsx
import { useMemo, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Menu,
  StickyNote,
  UserPen,
  Globe,
  ShoppingCart,
  Home,
  ShieldCheck,
  PlusCircle,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { MENU_CONFIG } from "@/config/menuConfig";
import LogoImg from "@/assets/Yuuyen.jpg";
import BellMenu from "../Notification/BellMenu";

export default function Navbar() {
  const { authUser, logout } = useAuth?.() || {};
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const role = useMemo(() => {
    if (!authUser) return "PUBLIC";
    if (authUser.userType === "Buyer") return "BUYER";
    if (authUser.userType === "Seller") return "SELLER";
    if (authUser.userType === "Admin") return "ADMIN";
    return "PUBLIC";
  }, [authUser]);

  const { cta } = MENU_CONFIG[role] || {};

  const leftMenu = [
    { label: "หน้าหลัก", to: "/" },
    { label: "เปรียบเทียบ", to: "/compare" },
    {
      label: "ช่วยเหลือ",
      to:
        role === "SELLER"
          ? "/seller/support"
          : role === "BUYER"
          ? "/buyer/support"
          : "/support",
    },
  ];

  const rightDropdown = (() => {
    if (role === "BUYER") {
      return [
        { label: "โปรไฟล์", to: "/buyer/profile", icon: UserPen },
        {
          label: "สมัครเป็นผู้ขาย",
          to: "/buyer/register/seller",
          icon: StickyNote,
        },
      ];
    }
    if (role === "SELLER") {
      return [{ label: "โปรไฟล์", to: "/seller/profile", icon: UserPen }];
    }
    if (role === "ADMIN") {
      return [
        { label: "แดชบอร์ดอนุมัติ", to: "/admin/approval", icon: ShieldCheck },
      ];
    }
    return [];
  })();

  const linkCls = ({ isActive }) =>
    `px-3 py-2 text-sm rounded motion-safe:transition ${
      isActive
        ? "bg-white/10 text-white underline underline-offset-4"
        : "text-white/90 hover:text-white hover:underline"
    }`;

  const handleLogout = async () => {
    try {
      await logout?.();
    } finally {
      navigate("/login");
    }
  };

  const MenuLinksDesktop = () => (
    <nav className="hidden md:flex items-center gap-1">
      {leftMenu.map((m) => (
        <NavLink key={m.to} to={m.to} className={linkCls} title={m.label}>
          {m.label}
        </NavLink>
      ))}
    </nav>
  );

  const MenuLinksMobile = () => (
    <div className="p-4 flex flex-col gap-1">
      {cta && (
        <Link
          to={cta.to}
          onClick={() => setOpen(false)}
          className="mb-3 inline-flex items-center justify-center rounded px-3 py-2 bg-emerald-500 text-white hover:bg-emerald-600 motion-safe:transition"
        >
          {cta.label}
        </Link>
      )}

      <div className="text-xs uppercase text-white/70 mt-1 mb-1">เมนูหลัก</div>
      {leftMenu.map((m) => (
        <NavLink
          key={m.to}
          to={m.to}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `block rounded px-3 py-3 ${
              isActive
                ? "bg-white/10 text-white"
                : "text-white/90 hover:bg-white/10 hover:text-white"
            }`
          }
        >
          {m.label}
        </NavLink>
      ))}

      {authUser && rightDropdown.length > 0 && (
        <>
          <hr className="my-3 border-white/10" />
          <div className="text-xs uppercase text-white/70 mt-1 mb-1">
            บัญชีของฉัน
          </div>
          {rightDropdown.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block rounded px-3 py-3 ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/90 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          <button
            onClick={() => {
              setOpen(false);
              handleLogout();
            }}
            className="mt-2 rounded px-3 py-3 text-left text-red-300 hover:bg-white/10"
          >
            ออกจากระบบ
          </button>
        </>
      )}

      {!authUser && (
        <div className="mt-4 flex gap-2">
          <Link
            to="/login"
            onClick={() => setOpen(false)}
            className="rounded px-3 py-2 bg-white text-[#2c3e50] hover:bg-gray-100"
          >
            เข้าสู่ระบบ
          </Link>
          <Link
            to="/register"
            onClick={() => setOpen(false)}
            className="rounded px-3 py-2 bg-emerald-500 text-white hover:bg-emerald-600 motion-safe:transition"
          >
            สมัครสมาชิก
          </Link>
        </div>
      )}
    </div>
  );

  const displayName = (
    authUser?.First_name ||
    authUser?.firstName ||
    authUser?.displayName ||
    authUser?.email?.split("@")[0] ||
    "บัญชี"
  ).trim();

  const avatarSrc =
    authUser?.image ||
    authUser?.photoURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      displayName
    )}&background=2c3e50&color=fff`;

  return (
    <>
      <header className="w-full border-b bg-[#2c3e50] text-white">
        <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
          {/* Left: โลโก้ + role badge + เมนูซ้าย */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center rounded-full p-0.5 hover:opacity-90"
              title="กลับหน้าแรก"
              aria-label="กลับหน้าแรก"
            >
              <img
                src={LogoImg}
                alt="โลโก้ Yuuyen"
                className="h-10 w-10 rounded-full object-cover border-2 border-white/70"
              />
            </Link>

            {/* Role badge */}
            <span
              className={
                "hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs " +
                (role === "PUBLIC"
                  ? "bg-white/10 text-gray-100"
                  : role === "BUYER"
                  ? "bg-emerald-500/20 text-emerald-200"
                  : role === "SELLER"
                  ? "bg-sky-500/20 text-sky-200"
                  : "bg-rose-500/20 text-rose-200")
              }
            >
              {role === "PUBLIC" && <Globe className="w-4 h-4" />}
              {role === "BUYER" && <ShoppingCart className="w-4 h-4" />}
              {role === "SELLER" && <Home className="w-4 h-4" />}
              {role === "ADMIN" && <ShieldCheck className="w-4 h-4" />}
              <span className="ml-0.5">
                {role === "PUBLIC"
                  ? "ผู้เข้าชม"
                  : role === "BUYER"
                  ? "ผู้ซื้อ"
                  : role === "SELLER"
                  ? "ผู้ขาย"
                  : "แอดมิน"}
              </span>
            </span>

            <MenuLinksDesktop />
          </div>

          {/* Right: CTA + Bell + Account Dropdown + Mobile */}
          <div className="flex items-center gap-2">
            {cta && (
              <Link
                to={cta.to}
                className="hidden md:inline-flex items-center gap-2 rounded px-3 py-2 bg-emerald-500 text-white hover:bg-emerald-600 mr-2"
                title={cta.label}
              >
                {cta.icon || <PlusCircle className="w-4 h-4" />}
                {cta.label}
              </Link>
            )}

            {/* ✅ BellMenu จะแสดงเฉพาะถ้า login */}
            {authUser && <BellMenu />}

            {authUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="rounded px-2 py-1.5 hover:bg-white/10 flex items-center gap-2"
                    title="เมนูโปรไฟล์"
                  >
                    <img
                      src={avatarSrc}
                      alt="รูปโปรไฟล์"
                      className="w-6 h-6 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="px-1">{displayName}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-56">
                  {rightDropdown.map(({ to, label, icon: Icon }) => (
                    <DropdownMenuItem key={to} onClick={() => navigate(to)}>
                      <div className="flex items-center gap-2">
                        {Icon && <Icon className="w-4 h-4" />}
                        <span>{label}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem onClick={async () => handleLogout()}>
                    <span className="text-red-600 font-medium">ออกจากระบบ</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex gap-2">
                <Link
                  to="/login"
                  className="rounded px-3 py-2 bg-white text-[#2c3e50] hover:bg-gray-100"
                  title="เข้าสู่ระบบ"
                >
                  เข้าสู่ระบบ
                </Link>
                <Link
                  to="/register"
                  className="rounded px-3 py-2 bg-emerald-500 text-white hover:bg-emerald-600"
                  title="สมัครสมาชิก"
                >
                  สมัครสมาชิก
                </Link>
              </div>
            )}

            {/* Mobile Drawer */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button
                  className="md:hidden rounded px-3 py-2 hover:bg-white/10"
                  aria-label="เปิดเมนู"
                >
                  <Menu className="w-6 h-6" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-80 p-0 bg-[#2c3e50] text-white"
              >
                <div className="px-4 py-3 border-b border-white/10 font-semibold">
                  เมนู
                </div>
                <MenuLinksMobile />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  );
}
