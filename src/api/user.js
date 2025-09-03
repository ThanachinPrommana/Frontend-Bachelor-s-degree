import axios from "axios";
import { apiClient } from "./authconfig";

const API_URL = "http://localhost:8200";
export const getbuyer = async (id) => {
  const res = await axios.get(`${API_URL}/api/profile/${id}`);
  return res.data;
};

export const getSeller = async (id) => {
  const res = await axios.get(`${API_URL}/api/profileseller/${id}`);
  return res.data;
};

export const updateSeller = async (data) => {
  const res = await apiClient.patch("/profileseller", data)
  return res.data;
};

export const updateprofile = async (data) => {
  const res = await apiClient.patch("/profile",data)
  return res.data;
};

export const updateImage = async (data) => {
  const res = await apiClient.post("/image", data,{
    headers:{"Content-Type":"multipart/form-data"}
  })
  return res.data;
};

export const searchFilter = async(data)=>{
  
}
