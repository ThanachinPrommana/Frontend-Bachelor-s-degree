// src/layouts/Layout_Seller.jsx
import Navbar from "@/components/Nav/Navbar";
import { Outlet } from "react-router-dom";

export default function Layout_Seller() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FAF0E6]">
        <Outlet />
      </main>
    </>
  );
}
