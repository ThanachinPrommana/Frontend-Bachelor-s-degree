// src/api/post.js
import { apiClient } from "./authconfig";

// สร้างโพสต์ใหม่
export const createPost = async (formData) => {
  const { data } = await apiClient.post("/propertypost", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};
// ✅ alias ให้เรียก createpost แบบเก่าก็ยังได้
export const createpost = createPost;

// ดึงโพสต์ตาม category
export const getPostsByCategory = async (categoryId) => {
  const { data } = await apiClient.get(`/post/category/${categoryId}`);
  return data;
};

// อัปเดตโพสต์
export const updatePost = async (id, formData) => {
  const { data } = await apiClient.patch(`/propertypost/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

// ลบโพสต์
export const deletePost = async (id) => {
  const { data } = await apiClient.delete(`/propertypost/${id}`);
  return data;
};
