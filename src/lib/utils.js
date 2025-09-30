// src/lib/utils.js

// --- เดิม ---
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- ใหม่: คุกกี้แบบ JSON (สำหรับ noti hint) ---
export function readJSONCookie(name) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  if (!m) return null;
  try {
    return JSON.parse(decodeURIComponent(m[1]));
  } catch {
    return null;
  }
}

export function writeJSONCookie(
  name,
  value,
  {
    maxAgeSec = 300, // 5 นาที พอเป็น hint
    path = "/",
    // โปรดักชันเปิด secure: true (ต้อง https)
    secure =
      typeof import.meta !== "undefined" &&
      import.meta.env &&
      import.meta.env.MODE === "production",
    sameSite = "Lax", // ถ้าข้ามไซต์จริงให้ใช้ "None"
  } = {}
) {
  if (typeof document === "undefined") return;
  const parts = [
    `${name}=${encodeURIComponent(JSON.stringify(value))}`,
    `Max-Age=${maxAgeSec}`,
    `Path=${path}`,
    `SameSite=${sameSite}`,
  ];
  if (secure) parts.push("Secure");
  document.cookie = parts.join("; ");
}

export function clearJSONCookie(name, { path = "/", sameSite = "Lax" } = {}) {
  if (typeof document === "undefined") return;
  const parts = [
    `${name}=; Max-Age=0`,
    `Path=${path}`,
    `SameSite=${sameSite}`,
  ];
  // ไม่ต้องใส่ Secure ตอนลบก็ได้
  document.cookie = parts.join("; ");
}
