import axios from "axios";
import { apiClient } from "./authconfig";


export const createpost = async (formData) => {
    const res = await apiClient.post("/propertypost", formData, {
        headers: {
            "Content-Type": "multipart/form-data", 
        }
    })
    return res.data

}