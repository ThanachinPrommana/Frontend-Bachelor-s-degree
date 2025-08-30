import axios from "axios";
import { apiClient } from "./authconfig";
const API_URL = "http://localhost:8200";

export const preregister = async (payload) => {
  const res = await axios.post(`${API_URL}/api/preRegister`, payload);
  return res.data;
};
export const verifyandregister = async (payload) => {
  const res = await axios.post(`${API_URL}/api/verifyandregister`, payload);
  return res.data;
};
export const login = async (formData) => {
  const res = await apiClient.post("/login", formData)
  return res.data;
};
export const forgotpassword = async (data) => {
  const res = await axios.post(`${API_URL}/api/forgotpassword`, data);
  return res.data;
};
export const resetpassword = async (data) => {
  const res = await axios.post(`${API_URL}/api/resetpassword`, data);
  return res.data;
};
export const getprofile = async () => {
  return apiClient.get("/profiles/user");
};
export const registerSeller = async (data) => {
  const res = await apiClient.post("/seller/register", data)
  return res.data
}
