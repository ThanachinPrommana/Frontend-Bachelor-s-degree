import React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";


const numberOrUndefined = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
  z.number().optional()
);


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

  // Arrays
  Nearby_Landmarks: z.array(z.string()).optional(),
  Additional_Amenities: z.array(z.string()).optional(),

  // Price / Payment-ish
  Price: numberOrUndefined,
  Deposit_Amount: numberOrUndefined,
  Other_related_expenses: z.string().optional(),

  // Inform (ผู้ขาย/ติดต่อ)
  Name: z.string().optional(),
  Phone: z.string().optional(),
  Link_line: z.string().optional(),
  Link_facbook: z.string().optional(),
  Contract_Seller: z.string().optional(),

  // Upload (ภาพ)
  images: z.any().optional(), // จะตรวจจริงด้วย schema เฉพาะหน้า Upload
  videos: z.any().optional(),
});

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

      // Features
      Nearby_Landmarks: [],
      Additional_Amenities: [],

      // Price
      Price: undefined,
      Deposit_Amount: undefined,
      Other_related_expenses: "",

      // Inform (contact)
      Name: "",
      Phone: "",
      Link_line: "",
      Link_facbook: "",
      Contract_Seller: "",

      // Upload
      images: [],
      videos: []
    },
    resolver: zodResolver(softSchema), // ✅ ต่อ global แบบนิ่ม ๆ
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  return <FormProvider {...methods}>{children}</FormProvider>;
};
