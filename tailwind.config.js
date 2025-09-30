/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],

  // เพิ่มส่วนนี้เข้าไปเพื่อแก้ปัญหา oklch ที่เราเจอกัน
  corePlugins: {
    cssPropertyFallbacks: true,
  },
}