import Credit from "@/components/Credit";
import React, { useEffect, useState } from "react";
// 🔻 --- Mock Dependencies (ส่วนจำลอง) --- 🔻
// (เพื่อแก้ไขข้อผิดพลาด "Could not resolve" ในสภาพแวดล้อมการทดสอบ)
// เราจะจำลอง component ที่จำเป็นขึ้นมาแทนการ import

const Cardsim = ({ icon, text, text2, className }) => (
  <div
    className={`p-6 border rounded-lg shadow-lg bg-white flex flex-col items-center gap-1 ${className}`}
  >
    <div className="text-2xl text-center">{icon}</div>
    <div className="font-bold mt-2 text-center">{text}</div>
    <div className="text-sm text-gray-600 text-center">{text2}</div>
  </div>
);



const Button = ({ children, className, ...props }) => (
  <button className={`px-4 py-2 rounded ${className}`} {...props}>
    {children}
  </button>
);

// Mock lucide-react icons (ใช้ Emoji แทน)
const Phone = (props) => <span {...props}>📞</span>;
const Mail = (props) => <span {...props}>✉️</span>;
const CircleAlert = (props) => <span {...props}>⚠️</span>;
const CircleX = (props) => <span {...props}>❌</span>;
// (ที่ import มาแต่ไม่ได้ใช้ ก็ mock ไว้กัน error ครับ)
const AlarmCheck = (props) => <span {...props}>⏰</span>;
const AlertCircle = (props) => <span {...props}>ℹ️</span>;
const Circle = (props) => <span {...props}>⭕️</span>;

// 🔺 --- สิ้นสุดส่วน Mock Dependencies --- 🔺

const Support = () => {
  const [showModal, setshowModal] = useState(false);
  const [showsubmit, setsubmit] = useState(false);
  const [report, setreport] = useState("");

  const buttonlabels = [
    "เกี่ยวกับผู้ซื้อ",
    "เกี่ยวกับบัญชี",
    "เกี่ยวกับการมัดจำ",
    "เกี่ยวกับระบบ",
    "เกี่ยวกับการนัดหมาย",
    "เกี่ยวกับการแจ้งเตือน",
  ];
  useEffect(() => {});
  const handleButtonClick = (name) => {
    setreport(name);
    setsubmit(true);
  };
  return (
    <div className="min-h-screen ">
      {/* Banner Section - Responsive */}
      <div className="relative w-full h-64 md:h-96 lg:h-[30rem]">
        {/* Image */}
        <img
          src="https://www.businesseventsthailand.com/uploads/event_calendar/web/200420-banner-vDsL1lmHL.jpg"
          alt="Support Banner"
          className="w-full h-full object-cover"
        />
        {/* Overlay and Centered Text */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-4">
          <h1 className="text-white text-4xl md:text-6xl font-bold text-center">
            ติดต่อ พวกเรา
          </h1>
        </div>
      </div>

      {/* Main Content Container
        - ใช้ mx-auto และ max-w-7xl เพื่อให้อยู่ตรงกลางและมีขนาดพอดี
        - ใช้ px-4 sm:px-6 lg:px-8 เพื่อให้มีระยะห่างจากขอบจอที่เหมาะสม
        - ใช้ py-10 md:py-16 เพื่อเว้นระยะห่างแนวตั้ง
      */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        {/* Contact Information */}
        <div className="flex flex-col gap-4 bg-white rounded-2xl p-6 md:p-8 shadow-lg">
          <h1 className="text-4xl font-bold text-gray-800">ประเทศไทย</h1>
          <p className="text-gray-700">
            50 ถนน งามวงศ์วาน แขวงลาดยาว เขตจตุจักร กรุงเทพมหานคร 10900
          </p>
          <div className="flex flex-col gap-2">
            <a
              href="https://www.ku.ac.th/th"
              target="\_blank"
              rel="noopener noreferrer"
              className="text-red-600 font-bold hover:underline break-words"
            >
              www.ku.ac.th/th
            </a>
            <a
              href="https://www.kps.ku.ac.th/v8/index.php/th/"
              target="\_blank"
              rel="noopener noreferrer"
              className="text-red-600 font-bold hover:underline break-words"
            >
              www.kps.ku.ac.th/v8/index.php/th/
            </a>
          </div>
        </div>

        {/* Card Section
          - Grid นี้ responsive ดีอยู่แล้ว (1, 2, 3 columns)
          - ลบ mx-5 lg:mx-20 ออก เพราะอยู่ใน Container หลักแล้ว
        */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          <Cardsim
            icon={<Phone className="mb-1" />}
            text={<span className="block">เบอร์โทรศัพท์</span>}
            text2={<span>(+66)932305647</span>}
            className="flex flex-col items-center gap-1"
          />
          <Cardsim
            icon={<Mail className="mb-1" />}
            text={<span>อีเมล</span>}
            text2={<span>thanachin.p@ku.th</span>}
            className="flex flex-col items-center gap-1"
          />
          <Cardsim
            icon={<CircleAlert />}
            text={<a>รายงาน</a>}
            text2={
              <a
                className="text-red-500 font-bold cursor-pointer"
                onClick={() => setshowModal(true)}
              >
                เลือกปัญหาที่ต้องการรายงาน
              </a>
            }
          />
        </div>
      </div>
      {/* Modal list Report
        - Layout นี้ (fixed, w-11/12, max-w-md) responsive ดีอยู่แล้ว
      */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="flex flex-col bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
            {/* Close Button */}
            <CircleX
              className="absolute top-4 right-4 cursor-pointer text-gray-500 hover:text-black"
              onClick={() => setshowModal(false)}
            />

            {/* Title */}
            <h2 className="font-bold text-2xl mb-2 text-center">รายงาน</h2>
            <h2 className="mb-4 font-bold">เลือกปัญหาที่ต้องการรายงาน</h2>
            {/* Buttons */}
            <div className="w-full flex flex-col">
              {buttonlabels.map((label, index) => (
                <Button
                  key={label}
                  className={`bg-gray-100 px-4 py-2 text-black hover:text-white hover:bg-black !rounded justify-start cursor-pointer ${
                    index !== 0 ? "border-t-2 border-gray" : ""
                  }`}
                  onClick={() => handleButtonClick(label)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Submit 
        - Layout นี้ (fixed, w-11/12, max-w-md) responsive ดีอยู่แล้ว
      */}
      {showsubmit && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            {/* Selected Text */}
            <div className="mb-4">
              <h1 className="font-bold text-lg mb-1">ที่คุณเลือก:</h1>
              <p className="text-black/60 text-base">{report}</p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 cursor-pointer"
                onClick={() => setsubmit(false)}
              >
                ยืนยัน
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-10">
        <Credit />
      </div>
    </div>
  );
};

export default Support;

