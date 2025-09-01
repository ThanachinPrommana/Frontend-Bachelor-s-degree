import { useAuth } from "@/context/AuthContext";
import React from "react";

const SellerPost = () => {
 const { authUser } = useAuth(); // ดึง loading มาด้วย



  // เราจะใช้ authUser ที่ debug แล้วมาหา posts
  const posts = authUser?.PropertyPost || [];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Search and Filter Controls */}
      <div className="flex items-center justify-between mb-6 space-x-4">
        <input
          type="text"
          placeholder="ค้นหาโพสต์..."
          className="flex-grow border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#34495E]"
        />
        {/* <button
          type="button"
          className="border border-[#34495E] text-[#34495E] px-4 py-2 rounded-md font-medium hover:bg-[#34495E] hover:text-white transition"
        >
          Filter
        </button> */}
      </div>

      {posts.length === 0 ? (
        <p className="text-gray-500 text-center">ยังไม่มีรายการโพสต์</p>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex items-center space-x-4 border border-gray-300 p-4 rounded-xl shadow-sm relative"
            >
              {post.Image?.[0]?.url && (
                <img
                  src={post.Image[0].url}
                  alt={post.Property_Name}
                  className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                />
              )}

              <div className="flex-1">
                <h3 className="text-xl font-semibold">{post.Property_Name}</h3>
                <p className="text-gray-600 mt-1">{post.Address}</p>
                <p className="text-gray-600">{post.Province}</p>
                <p className="text-green-600 font-bold mt-1 text-lg">
                  {Number(post.Price).toLocaleString()} บาท
                </p>
              </div>

              <button
                onClick={() => alert(`แก้ไข: ${post.Property_Name}`)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 border-2 border-[#34495E] text-[#34495E] px-4 py-1 rounded-md font-medium hover:bg-[#34495E] hover:text-white transition"
              >
                ลบ
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

};

export default SellerPost;