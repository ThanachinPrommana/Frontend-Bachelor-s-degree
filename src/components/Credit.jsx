import { Link } from "react-router-dom";
import { Facebook, Instagram, Youtube, HeartPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient } from "@/api/authconfig";

const Credit = () => {
  const [expanded, setExpanded] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const toggleTex = () => {
    setExpanded((prev) => !prev);
  };

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get("/credit/post");
        setPosts(response.data);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  return (
    <div className="w-full bg-white ">
      {/* ===== Top Bar ===== */}
      {/* ใช้ w-full สำหรับพื้นหลัง และ max-w-7xl mx-auto สำหรับคุมเนื้อหา */}
      <div className="w-full bg-[#2c3e50] border-b-2 border-white">
        <div className="flex flex-col sm:flex-row items-center justify-between h-auto sm:h-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-0">
          {/* ส่วน "ติดต่อ" (ซ้าย) */}
          {/* ลด space-x บนจอมือถือ และเพิ่ม mb เมื่อแสดงเป็น col */}
          <div className="flex items-center space-x-4 sm:space-x-8 mb-4 sm:mb-0">
            <p className="text-white">ติดต่อ</p>
            <Link to="/Support">
              <div className="flex space-x-2 text-white hover:text-blue-300">
                <HeartPlus />
              </div>
            </Link>
          </div>
          {/* ส่วน "ติดตาม" (ขวา) */}
          {/* ลด space-x บนจอมือถือ */}
          <div className="flex items-center space-x-4 sm:space-x-8">
            <p className="text-white">ติดตาม</p>
            <Facebook className="text-white hover:text-blue-300 cursor-pointer " />
            <Instagram className="text-white hover:text-blue-300 cursor-pointer" />
            <Youtube className="text-white hover:text-blue-300 cursor-pointer " />
          </div>
        </div>
      </div>

      {/* ===== Description Section ===== */}
      {/* ใช้ w-full สำหรับพื้นหลัง และ max-w-7xl mx-auto สำหรับคุมเนื้อหา */}
      <div className="bg-gray-200 w-full pt-5 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p
            className={`text-black text-sm opacity-70 transition-all duration-300 ease-in-out ${
              expanded ? "line-clamp-none" : "line-clamp-1"
            }`}
          >
            Yuu Yenn Property - “เพราะบ้าน...คือมากกว่าหลังคาและผนัง”
            มันคือจุดเริ่มต้นของชีวิตใหม่ ความฝันของครอบครัว พื้นที่เล็ก ๆ
            ที่คุณสร้างเรื่องราวขึ้นมาเองในทุกวัน ไม่ว่าคุณจะเพิ่งเริ่มทำงาน
            กำลังสร้างครอบครัว
            หรือมองหาที่พักที่สะท้อนตัวตนของคุณ—เราพร้อมอยู่ข้างคุณ ที่ Yuu Yenn
            Property เราไม่ได้เป็นแค่เว็บขายบ้าน
            แต่เราอยากเป็นเพื่อนร่วมทางของคุณในการค้นหาสถานที่ที่เรียกว่า “บ้าน”
            เราออกแบบแพลตฟอร์มให้ใช้งานง่าย ตอบโจทย์ทุกไลฟ์สไตล์
            ทั้งคอนโดในเมืองสำหรับชีวิตที่เร่งรีบ บ้านชานเมืองที่เต็มไปด้วยต้นไม้
            หรือบ้านมือสองราคาดีที่คุณแต่งเติมได้เองในแบบที่คุณเป็น
            เรามีระบบค้นหาที่ฉลาด แสดงผลเรียลไทม์ ฟิลเตอร์ครบ
            และแผนที่เข้าใจง่าย—เพราะเราเข้าใจว่าคุณไม่มีเวลาให้กับความวุ่นวาย
            เรายังมีทีมแชตให้คำปรึกษาแบบ real-human ไม่ใช่แค่บอท
            เรามีรีวิวบ้านจริงจากผู้ซื้อจริง และที่สำคัญคือ ไม่มีค่าธรรมเนียมแฝง
            ไม่มีนายหน้าแอบแฝง ในวันที่คุณพร้อม…แค่เปิดมือถือ
            แล้วมาเริ่มการเดินทางครั้งสำคัญของชีวิตกับเรา บ้านในฝันของคุณ
            ไม่ควรเป็นแค่ความฝัน
          </p>

          <button
            onClick={toggleTex}
            className="mt-3 text-blue-600 hover:underline text-sm cursor-pointer"
          >
            {expanded ? "ซ่อนรายละเอียด" : "อ่านเพิ่มเติม"}
          </button>

          {/* ===== Commented Post List (ปรับปรุง layout ใน comment) ===== */}
          {/* <div className="p-4 mt-8 border-t border-gray-300">
            <h2 className="text-xl font-semibold mb-4">โครงการทั้งหมด</h2>
            {loading ? (
              <p>กำลังโหลดข้อมูลโครงการ...</p>
            ) : (
              // (แก้ไข) ปรับ grid-cols ให้ responsive
              <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-3">
                {posts.map((post) => (
                  // (แนะนำ) ทำให้แต่ละรายการเป็นลิงก์ และตัดข้อความที่ยาวเกินไป
                  <li key={post.id} className="truncate hover:text-blue-600 transition-colors">
                    <Link to={`/deposit/${post.id}`} title={post.Property_Name}>
                      {post.Property_Name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div> */}
        </div>
      </div>

      {/* ===== Footer ===== */}
      {/* ใช้ w-full สำหรับพื้นหลัง และ max-w-7xl mx-auto สำหรับคุมเนื้อหา */}
      {/* แก้ไข border-while -> border-white */}
      <div className="w-full bg-[#1c2a38] border-t-2 border-white">
        {/* ใช้ flex-col sm:flex-row และ h-auto sm:h-20 เพื่อ responsive */}
        <div className="flex flex-col sm:flex-row items-center justify-between h-auto sm:h-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-0">
          <Link to="/Support" className="mb-2 sm:mb-0 hover:text-blue-300">
            <p className="text-white">ศูนย์ช่วยเหลือ</p>
          </Link>
          {/* ลบ 'flex' ที่ไม่จำเป็น และเพิ่ม text-sm, text-center */}
          <p className="text-white text-sm text-center sm:text-left">
            © 2025 Yuu Yenn Property LIMITED
          </p>
        </div>
      </div>
    </div>
  );
};
export default Credit;