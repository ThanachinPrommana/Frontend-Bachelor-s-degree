// src/config/menuConfig.js
import { PlusCircle, Gem } from "lucide-react";

/**
 * อัปเดตให้ตรงกับเส้นทางจริงใน AppRouter:
 * Public:  /, /compare, /support
 * Buyer:   /buyer, /buyer/profile, /buyer/support, /buyer/payment, /buyer/register/seller, /noti
 * Seller:  /seller, /seller/profile, /seller/support, CTA -> /seller/post-for-sale/title, /noti
 * Admin:   /admin/approval, /admin/buyer-id, /admin/seller-id/verify, ... (secondary)
 */
export const MENU_CONFIG = {
  PUBLIC: {
    primary: [
      { label: "หน้าแรก", to: "/" },
      { label: "เปรียบเทียบ", to: "/compare" },
      { label: "ช่วยเหลือ", to: "/support" },
    ],
    secondary: [],
    cta: null,
  },

  BUYER: {
    primary: [
      { label: "หน้าหลักผู้ซื้อ", to: "/buyer" },
      { label: "โปรไฟล์", to: "/buyer/profile" },
      { label: "เปรียบเทียบ", to: "/compare" },
    ],
    secondary: [
      { label: "การแจ้งเตือน", to: "/noti" },
      { label: "ศูนย์ช่วยเหลือ", to: "/buyer/support" },
      { label: "การชำระเงิน", to: "/buyer/payment" },
      {
        label: "สมัครเป็นผู้ขาย",
        to: "/buyer/register/seller",
        icon: <Gem className="w-4 h-4" />,
      },
    ],
    cta: null,
  },

  SELLER: {
    primary: [
      { label: "พื้นที่ผู้ขาย", to: "/seller" },
      { label: "โปรไฟล์ผู้ขาย", to: "/seller/profile" },
      { label: "ศูนย์ช่วยเหลือ", to: "/seller/support" },
    ],
    secondary: [
      { label: "การแจ้งเตือน", to: "/noti" },
      // ถ้าภายหลังอยากลิงก์เปิดแท็บโพสต์ของฉัน: { label: "โพสต์ของฉัน", to: "/seller/profile?tab=post" },
    ],
    cta: {
      label: "โพสต์ประกาศ",
      to: "/seller/post-for-sale/title",
      icon: <PlusCircle className="w-4 h-4" />,
    },
  },

  ADMIN: {
    primary: [
      { label: "อนุมัติโพสต์", to: "/admin/approval" }, // index ก็เป็นหน้านี้
      { label: "ผู้ซื้อ (Buyer ID)", to: "/admin/buyer-id" },
      { label: "ตรวจสอบผู้ขาย", to: "/admin/seller-id/verify" },
    ],
    secondary: [
      { label: "ผู้ขายที่ผ่านแล้ว", to: "/admin/seller-id/verified" },
      { label: "ผู้ขายที่ถูกปฏิเสธ", to: "/admin/seller-id/reject" },
      { label: "ชำระมัดจำ", to: "/admin/pay-deposit" },
      { label: "ชำระผ่านธนาคาร", to: "/admin/pay-bank" },
      { label: "รายงาน", to: "/admin/description-report" },
    ],
    cta: null,
  },
};
