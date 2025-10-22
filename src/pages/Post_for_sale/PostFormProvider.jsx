// src/pages/Post_for_sale/PostFormProvider.jsx
import React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

/* ========== Helper ========== */
// แปลงค่าว่างเป็น undefined แล้วค่อย Number()
const numberOrUndefined = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
  z.number().optional()
);

/* ========== Schema (soft, ใช้รวมทุกสเต็ป) ========== */
const softSchema = z.object({
  // General
  Property_Name: z.string().min(5, "หัวข้ออย่างน้อย 5 ตัว").optional(),
  Description: z.string().min(10, "รายละเอียดอย่างน้อย 10 ตัว").optional(),
  categoryId: z.string().optional(),
  Sell_Rent: z.string().optional(),

  // Location
  Province: z.string().optional(),
  District: z.string().optional(),
  Subdistrict: z.string().optional(),
  Address: z.string().optional(),
  LinkMap: z.string().optional(),
  Latitude: numberOrUndefined,
  Longitude: numberOrUndefined,

  // Details
  Usable_Area: numberOrUndefined,
  Land_Size: numberOrUndefined,
  Bedrooms: numberOrUndefined,
  Bathroom: numberOrUndefined,
  Total_Rooms: numberOrUndefined,
  Year_Built: z.string().optional(),
  Parking_Space: numberOrUndefined,
  floor: numberOrUndefined,
  NumberOfUnits: numberOrUndefined,
  propertyUnits: z.any().optional(), // validate รายสเต็ปแทน

  // Arrays
  Nearby_Landmarks: z.array(z.string()).optional(),
  Additional_Amenities: z.array(z.string()).optional(),

  // Price (เฉพาะขาย)
  Price: numberOrUndefined,
  Deposit_Amount: numberOrUndefined, // เงินดาวน์
  Other_related_expenses: z.array(z.string().trim()).optional(), // รายจ่ายอื่น ๆ

  // Inform (ข้อมูลผู้ขาย)
  Name: z.string().optional(),
  Phone: z.string().optional(), // จะบังคับในหน้าสเต็ป PostInform
  Link_line: z.string().optional(),
  Link_facbook: z.string().optional(),
  Contract_Seller: z.string().optional(),

  // Upload (สื่อ)
  images: z.any().optional(),
  videos: z.any().optional(),
});

/* ========== Provider ========== */
export const PostFormProvider = ({ children }) => {
  const methods = useForm({
    defaultValues: {
      // General Info
      Property_Name: "",
      Description: "",
      categoryId: "",
      Sell_Rent: "",

      // Location
      Province: "",
      District: "",
      Subdistrict: "",
      Address: "",
      LinkMap: "",
      Latitude: undefined,
      Longitude: undefined,

      // Details
      Usable_Area: undefined,
      Land_Size: undefined,
      Bedrooms: 1,
      Bathroom: 1,
      Total_Rooms: undefined,
      Year_Built: "",
      Parking_Space: undefined,
      floor: undefined,
      NumberOfUnits: 1,
      propertyUnits: [{ Unit_Number: "" }],

      // Features
      Nearby_Landmarks: [],
      Additional_Amenities: [],

      // Price (เฉพาะขาย)
      Price: undefined,
      Deposit_Amount: undefined,
      Other_related_expenses: [],

      // Inform
      Name: "",
      Phone: "",
      Link_line: "",
      Link_facbook: "",
      Contract_Seller: "",

      // Upload
      images: [],
      videos: [],
    },
    resolver: zodResolver(softSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    shouldUnregister: false,
  });

  return <FormProvider {...methods}>{children}</FormProvider>;
};
