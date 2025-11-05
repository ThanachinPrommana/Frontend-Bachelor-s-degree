import { useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
// import SignatureCanvas from "react-signature-canvas";
import { PDFDownloadLink } from "@react-pdf/renderer";
import ContractDocument from "./ContractDocument";
import { Font } from '@react-pdf/renderer';
import { useEffect } from "react";
import SignaturePad from 'react-signature-pad-wrapper';
import { useLocation, useNavigate } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Upload, FileText, Loader2, X, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@headlessui/react";
import { apiClient } from "@/api/authconfig";
import { ThaiDatePicker } from "thaidatepicker-react";


// (แก้ไข) 1. ย้าย InputField ออกมาไว้นอก Component หลัก
// และรับ register เข้ามาเป็น prop
const InputField = ({ id, placeholder, className = "", register }) => (
    <input
        type="text"
        {...register(id)}
        placeholder={placeholder}
        className={`border-b-2 border-dotted border-gray-400 focus:outline-none focus:border-solid focus:border-black pb-1 px-1 ${className}`}
    />
);
const InputDate = ({ id, register, className = "" }) => (
    <input
        type="date"
        {...register(id)}
        className={`border-b-2 border-dotted border-gray-400 focus:outline-none focus:border-solid focus:border-black pb-1 px-1 ${className}`}
    />
)


Font.register({
    family: 'Sarabun',
    fonts: [
        { src: '/fonts/Sarabun-Regular.ttf' },
        { src: '/fonts/Sarabun-Bold.ttf', fontWeight: 'bold' },
    ]
});

const FormField = ({ label, children, className = "" }) => (
    <div className={`flex flex-col space-y-1 ${className}`}>
        <label className="text-gray-600 font-medium">{label}</label>
        {children}
    </div>
);

// (เพิ่ม) 2. สร้าง Component สำหรับหัวข้อของแต่ละ Section
const SectionHeader = ({ title }) => (
    <div className="pt-8 pb-2 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
    </div>
);

const ContractForm = () => {
    // --- State Management ---
    // (แก้ไข) ⭐️ 3. เพิ่ม control

    const navigate = useNavigate()
    const location = useLocation()
    const { authUser, loading } = useAuth()

    const buyerSigCanvas = useRef({});
    const sellerSigCanvas = useRef({});
    const witness1SigCanvas = useRef({});
    const witness2SigCanvas = useRef({});

    const buyerSigCanvas2 = useRef({})
    const sellerSigCanvas2 = useRef({});
    const witness1SigCanvas2 = useRef({});
    const witness2SigCanvas2 = useRef({});

    const [buyerSignature, setBuyerSignature] = useState(null);
    const [sellerSignature, setSellerSignature] = useState(null);
    const [witness1Signature, setWitness1Signature] = useState(null);
    const [witness2Signature, setWitness2Signature] = useState(null);

    const [buyerSignature2, setBuyerSignature2] = useState(null);
    const [sellerSignature2, setSellerSignature2] = useState(null);
    const [witness1Signature2, setWitness1Signature2] = useState(null);
    const [witness2Signature2, setWitness2Signature2] = useState(null);
    const [isFontLoaded, setIsFontLoaded] = useState(false);

    // --- (เพิ่ม) State สำหรับ Modal และการอัปโหลด ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    // ใช้ชื่อเป็นพหูพจน์ และกำหนดค่าเริ่มต้นเป็น Array ว่าง
    const [filesToUpload, setFilesToUpload] = useState([]);;
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');


    const { postData, selectedUnit } = location.state || {};

    // 4. ใช้ useEffect เติมข้อมูล


    const defaultValues = useMemo(() => {
        if (!authUser) return {};
        const fullName = `${authUser.First_name || ''} ${authUser.Last_name || ''}`.trim();

        return {
            buyerName: fullName,
            buyerAge: authUser.Buyer?.Age || '',
            buyerID: authUser.Buyer?.National_ID || '',
            buyerAddress: authUser.Buyer?.Address || '',
            // buyerVillageNo: authUser.Buyer?.VillageNo || '',
            buyerSoi: authUser.Buyer?.Soi || '',
            buyerRoad: authUser.Buyer?.Road || '',
            buyerSubDistrict: authUser.Buyer?.SubDistrict || '',
            buyerDistrict: authUser.Buyer?.District || '',
            buyerProvince: authUser.Buyer?.Province || '',

            buyerReg_HouseNo: authUser.Buyer?.Reg_HouseNo || '',
            buyerReg_Village: authUser.Buyer?.Reg_Village || '',
            buyerReg_Alley: authUser.Buyer?.Reg_Alley || '',
            buyerReg_Road: authUser.Buyer?.Reg_Road || '',
            buyerReg_Subdistrict: authUser.Buyer?.Reg_Subdistrict || '',
            buyerReg_District: authUser.Buyer?.Reg_District || '',
            buyerReg_Province: authUser.Buyer?.Reg_Province || '',
        };
    }, [authUser]);

    // (แก้ไข) ⭐️ 3. ส่ง defaultValues เข้าไปใน useForm
    const { register, watch, control, reset } = useForm({
        defaultValues: defaultValues
    });

    const formData = watch();

    useEffect(() => {
        // 5. เช็กว่ามี postData และข้อมูลผู้ขายที่ซ้อนอยู่หรือไม่
        if (postData && postData.user && postData.user.Buyer) {

            const sellerUser = postData.user;
            const sellerProfile = postData.user.Buyer; // 👈 นี่คือข้อมูลที่คุณต้องการ
            console.log("Post Data:", sellerUser);
            reset({
                // ▼ ข้อมูลผู้ขายที่คุณต้องการทั้งหมดอยู่ที่นี่ ▼
                sellerName: `${sellerUser.First_name || ''} ${sellerUser.Last_name || ''}`,

                // ▼ ⭐️ แก้ไข: ดึงข้อมูลจาก sellerProfile (ซึ่งคือ .Buyer) โดยตรง
                sellerID: sellerProfile.National_ID || "",
                sellerAddress: sellerProfile.Reg_HouseNo || "",
                sellerVillageNo: sellerProfile.Reg_Village || "",
                sellerSoi: sellerProfile.Reg_Alley || "",
                sellerRoad: sellerProfile.Reg_Road || "",
                sellerSubDistrict: sellerProfile.Reg_Subdistrict || "",
                sellerDistrict: sellerProfile.Reg_District || "",
                sellerProvince: sellerProfile.Reg_Province || "",


                price: postData.Price || 0,
                somecontract: postData.Deposit_Amount || 0,
            });
        }
    }, [postData, reset]);



    // (เพิ่ม) 2. เพิ่ม useEffect เพื่อตรวจสอบว่า Font โหลดเสร็จหรือยัง
    useEffect(() => {
        // ป้องกันการเข้าหน้านี้โดยตรง

        if (!postData || !selectedUnit) {
            console.error("Missing data, redirecting to home.");
            navigate('/');
        }
        // Logic โหลด Font (เหมือนเดิม)
        const timer = setTimeout(() => setIsFontLoaded(true), 500);
        return () => clearTimeout(timer);
    }, [postData, selectedUnit, navigate]);

    if (loading) {
        return (
            <div className="bg-gray-200 min-h-screen p-4 sm:p-8 flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-gray-500" />
            </div>
        );
    }

    const handleRemoveFile = (indexToRemove) => {
        setFilesToUpload(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
    };

    // --- (เพิ่ม) ฟังก์ชันสำหรับจัดการ Modal และการอัปโหลด ---
    const handleFileSelect = (e) => {
        const chosenFiles = Array.from(e.target.files);

        // ตรวจสอบว่าไฟล์ใหม่รวมกับของเดิมแล้วเกิน 3 ไฟล์หรือไม่
        if (filesToUpload.length + chosenFiles.length > 3) {
            setUploadError("คุณสามารถอัปโหลดได้สูงสุด 3 ไฟล์เท่านั้น");
            return;
        }

        // กรองเอาเฉพาะไฟล์ PDF
        const pdfFiles = chosenFiles.filter(file => file.type === "application/pdf");

        if (pdfFiles.length !== chosenFiles.length) {
            setUploadError("กรุณาเลือกไฟล์ PDF เท่านั้น");
        } else {
            setUploadError('');
        }

        // เพิ่มไฟล์ใหม่ที่ถูกต้องเข้าไปใน State (ต่อท้าย Array เดิม)
        setFilesToUpload(prevFiles => [...prevFiles, ...pdfFiles]);
    };

    const handleUploadSubmit = async () => {
        // (แก้ไข) ตรวจสอบจาก Array
        if (filesToUpload.length === 0) {
            setUploadError("กรุณาเลือกไฟล์ที่จะอัปโหลด");
            return;
        }
        setIsUploading(true);
        setUploadError('');

        const formData = new FormData();

        // (หัวใจหลัก) วน Loop เพื่อส่งไฟล์ทั้งหมดใน Array
        // และใช้ key "documents" ให้ตรงกับที่กำหนดใน Backend Router
        for (const file of filesToUpload) {
            formData.append("documents", file);
        }

        // append ข้อมูลอื่นๆ เหมือนเดิม
        formData.append("postId", postData.id);
        formData.append("unitId", selectedUnit.id);
        formData.append("DocumentName", `เอกสารมัดจำ ${postData.Property_Name}`);

        if (authUser?.userId) {
            formData.append("userId", authUser.userId);
        }
        try {
            // (สำคัญ) Path "/document" ต้องตรงกับใน Router ของคุณ
            const response = await apiClient.post("/document", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            console.log("Upload successful:", response.data);
            alert("เอกสารถูกจัดส่งแล้ว");
            setIsModalOpen(false);
            setFilesToUpload([]); // เคลียร์ไฟล์หลังอัปโหลดสำเร็จ
            // navigate("/success-page");

        } catch (err) {
            console.error("Upload failed:", err);
            setUploadError(err.response?.data?.message || "การอัปโหลดล้มเหลว");
        } finally {
            setIsUploading(false);
        }
    };


    return (
        <div className="bg-gray-200 min-h-screen p-4 sm:p-8 flex items-center justify-center font-['Sarabun']">
            <div className="w-full max-w-5xl">

                {/* --- ส่วนของฟอร์มที่แสดงบนหน้าเว็บ --- */}
                <div className="bg-white p-8 md:p-12 shadow-2xl rounded-lg">

                    {/* --- หัวเรื่องสัญญา --- */}
                    <div className="text-center mb-12">
                        <h1 className="text-3xl font-bold text-gray-900">
                            สัญญาจะซื้อจะขาย หรือ สัญญาวางเงินมัดจำ
                        </h1>
                        <p className="text-gray-500 mt-2">
                            กรุณากรอกข้อมูลในช่องว่างให้ครบถ้วน
                        </p>
                    </div>

                    {/* --- Section: Date and Place --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-lg border-t pt-6">
                        <FormField label="ทำที่" className="md:col-span-2">
                            <InputField id="contractPlace" placeholder="สถานที่ทำสัญญา" register={register} className="w-full" />
                        </FormField>

                        {/* ⭐️ (แก้ไข) 4. ใช้ Controller ครอบ ThaiDatePicker ⭐️ */}
                        <FormField label="วันที่ทำสัญญา" className="md:col-span-2">
                            {/* 1. เพิ่ม div relative เพื่อจัดตำแหน่งไอคอน */}
                            <div className="relative w-full">
                                {/* 2. เพิ่มไอคอน (วางทับแบบ absolute) */}
                                <CalendarIcon
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                                />

                                {/* 3. Controller และ ThaiDatePicker เหมือนเดิม */}
                                <Controller
                                    name="contractDate"
                                    control={control}
                                    render={({ field }) => (
                                        <ThaiDatePicker
                                            value={field.value}
                                            onChange={(christDate, buddhistDate) => {
                                                field.onChange(christDate);
                                            }}
                                            inputProps={{
                                                placeholder: "เลือกวันที่ (พ.ศ.)",
                                                // 4. (สำคัญ) แก้ไข className ให้สวยงาม
                                                // (และแก้ typo จาก _className เป็น className)
                                                className: `
                                                  w-full rounded-md border border-gray-300 bg-white 
                                                  px-3 py-2 pl-10 
                                                  text-gray-900 shadow-sm 
                                                  focus:outline-none focus:ring-2 focus:ring-blue-500
                                                `
                                            }}
                                        />
                                    )}
                                />
                            </div>
                        </FormField>
                    </div>

                    {/* --- Seller Section --- */}
                    <SectionHeader title="ข้อมูลผู้จะขาย" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6 text-lg mt-6">
                        <FormField label="ชื่อ-สกุล ผู้จะขาย" className="lg:col-span-3">
                            <InputField id="sellerName" register={register} className="w-full" />
                        </FormField>

                        <FormField label="อายุ (ปี)">
                            <InputField id="sellerAge" register={register} className="w-full" />
                        </FormField>

                        <FormField label="เลขบัตรประชาชน" className="lg:col-span-2">
                            <InputField id="sellerID" register={register} className="w-full" />
                        </FormField>

                        <FormField label="บ้านเลขที่" className="lg:col-span-2">
                            <InputField id="sellerAddress" register={register} className="w-full" />
                        </FormField>

                        <FormField label="หมู่ที่">
                            <InputField id="sellerVillageNo" register={register} className="w-full" />
                        </FormField>

                        <FormField label="ซอย">
                            <InputField id="sellerSoi" register={register} className="w-full" />
                        </FormField>

                        <FormField label="ถนน">
                            <InputField id="sellerRoad" register={register} className="w-full" />
                        </FormField>

                        <FormField label="ตำบล/แขวง">
                            <InputField id="sellerSubDistrict" register={register} className="w-full" />
                        </FormField>

                        <FormField label="อำเภอ/เขต">
                            <InputField id="sellerDistrict" register={register} className="w-full" />
                        </FormField>

                        <FormField label="จังหวัด">
                            <InputField id="sellerProvince" register={register} className="w-full" />
                        </FormField>
                    </div>

                    {/* --- Buyer Section --- */}
                    <SectionHeader title="ข้อมูลผู้จะซื้อ" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6 text-lg mt-6">
                        <FormField label="ชื่อ-สกุล ผู้จะซื้อ" className="lg:col-span-3">
                            <InputField id="buyerName" register={register} className="w-full" />
                        </FormField>

                        <FormField label="อายุ (ปี)">
                            <InputField id="buyerAge" register={register} className="w-full" />
                        </FormField>

                        <FormField label="เลขบัตรประชาชน" className="lg:col-span-2">
                            <InputField id="buyerID" register={register} className="w-full" />
                        </FormField>

                        <FormField label="บ้านเลขที่" className="lg:col-span-2">
                            <InputField id="buyerReg_HouseNo" register={register} className="w-full" />
                        </FormField>

                        <FormField label="หมู่ที่">
                            <InputField id="buyerReg_Village" register={register} className="w-full" />
                        </FormField>

                        <FormField label="ซอย">
                            <InputField id="buyerReg_Alley" register={register} className="w-full" />
                        </FormField>

                        <FormField label="ถนน">
                            <InputField id="buyerReg_Road" register={register} className="w-full" />
                        </FormField>

                        <FormField label="ตำบล/แขวง">
                            <InputField id="buyerReg_Subdistrict" register={register} className="w-full" />
                        </FormField>

                        <FormField label="อำเภอ/เขต">
                            <InputField id="buyerReg_District" register={register} className="w-full" />
                        </FormField>

                        <FormField label="จังหวัด">
                            <InputField id="buyerReg_Province" register={register} className="w-full" />
                        </FormField>
                    </div>

                    {/* --- Contract Details Section --- */}
                    <SectionHeader title="รายละเอียดสัญญา" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-lg mt-6">
                        <FormField label="ข้อ 1: ทรัพย์สินที่ขาย" className="md:col-span-2">
                            <InputField id="ownSeller" placeholder="เช่น บ้านพร้อมที่ดิน โฉนดเลขที่..." register={register} className="w-full" />
                        </FormField>

                        <FormField label="ข้อ 2: ราคาที่ตกลงซื้อขาย (บาท)">
                            <InputField id="price" placeholder="เช่น 2,500,000" register={register} className="w-full" />
                        </FormField>
                        <FormField label="จำนวนเงินเป็นภาษาไทย">
                            <InputField id="pricefont" placeholder="เช่น สองล้านห้าแสน" register={register} className="w-full" />
                        </FormField>

                        <div className="md:col-span-2">

                            <FormField label="ข้อ 3: เงินมัดจำ (บาท)" className="mt-6">
                                <InputField id="somecontract" placeholder="เช่น 50,000" register={register} className="w-full" />
                            </FormField>
                            <FormField label="จำนวนเงินเป็นภาษาไทย" className="mt-6">
                                <InputField id="pricefont3" placeholder="เช่น ห้าหมืน" register={register} className="w-full" />
                            </FormField>

                            <FormField label="ชำระโดย">
                                <InputField id="bankcheck" placeholder="เงินสด / เช็คธนาคาร" register={register} className="w-full" />
                            </FormField>

                            <FormField label="ธนาคาร / สาขา">
                                <InputField id="remainingAmount" register={register} className="w-full" />
                            </FormField>

                            <FormField label="เลขที่เช็ค">
                                <InputField id="checkNo" register={register} className="w-full" />
                            </FormField>

                            <FormField label="ลงวันที่">
                                {/* 1. เพิ่ม div relative เพื่อจัดตำแหน่งไอคอน */}
                                <div className="relative w-full">
                                    {/* 2. เพิ่มไอคอน (วางทับแบบ absolute) */}
                                    <CalendarIcon
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                                    />

                                    {/* 3. Controller และ ThaiDatePicker */}
                                    <Controller
                                        name="datepay"
                                        control={control}
                                        render={({ field }) => (
                                            <ThaiDatePicker
                                                value={field.value}
                                                onChange={(christDate, buddhistDate) => {
                                                    field.onChange(christDate);
                                                }}
                                                inputProps={{
                                                    placeholder: "เลือกวันที่ (พ.ศ.)",
                                                    // 4. (สำคัญ) แก้ไข className ให้สวยงาม
                                                    // (และแก้ typo จาก _className เป็น className)
                                                    className: `
                                                  w-full rounded-md border border-gray-300 bg-white 
                                                  px-3 py-2 pl-10 
                                                  text-gray-900 shadow-sm 
                                                  focus:outline-none focus:ring-2 focus:ring-blue-500
                                                `
                                                }}
                                            />
                                        )}
                                    />
                                </div>
                            </FormField>

                            <FormField label="โอนเงินเข้าบัญชี">
                                <InputField id="toaccount" register={register} className="w-full" />
                            </FormField>

                            <FormField label="ชื่อบัญชี">
                                <InputField id="nameaccount1" register={register} className="w-full" />
                            </FormField>

                            <FormField label="เลขที่บัญชี">
                                <InputField id="accountNo" register={register} className="w-full" />
                            </FormField>
                        </div>
                        <div>
                            <FormField label="ข้อ 4: ผู้ซื้อตกลงชำระราคา ส่วนที่เหลืออีก">
                                <InputField id="moneyleft" register={register} className="w-full" />
                            </FormField>

                            <FormField label="จำนวนเงินเป็นภาษาไทย">
                                <InputField id="pricefont4" register={register} className="w-full" />
                            </FormField>

                            <FormField label="ภายในวันที่">
                                <Controller
                                    name="dateofpay5"
                                    control={control}
                                    render={({ field }) => (
                                        <ThaiDatePicker
                                            value={field.value}
                                            onChange={(christDate, buddhistDate) => {
                                                field.onChange(christDate);
                                            }}
                                            inputProps={{
                                                placeholder: "เลือกวันที่ (พ.ศ.)",
                                                // 4. (สำคัญ) แก้ไข className ให้สวยงาม
                                                // (และแก้ typo จาก _className เป็น className)
                                                className: `
                                                  w-full rounded-md border border-gray-300 bg-white 
                                                  px-3 py-2 pl-10 
                                                  text-gray-900 shadow-sm 
                                                  focus:outline-none focus:ring-2 focus:ring-blue-500
                                                `
                                            }}
                                        />
                                    )}
                                />
                            </FormField>
                        </div>

                    </div>

                    {/* --- ค่าใช้จ่ายในการโอน --- */}
                    <SectionHeader title="ข้อ 5: ค่าใช้จ่ายในการโอนกรรมสิทธิ์" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-lg mt-6">
                        <FormField label="5.1 ค่าธรรมเนียมการโอน (ผู้ออก)">
                            <InputField id="transferfee" placeholder="ผู้จะซื้อ/ผู้จะขาย/คนละครึ่ง" register={register} className="w-full" />
                        </FormField>

                        <FormField label="5.2 ค่าธุรกิจเฉพาะ/อากร (ผู้ออก)">
                            <InputField id="specificbusinessfee" placeholder="ผู้จะซื้อ/ผู้จะขาย/คนละครึ่ง" register={register} className="w-full" />
                        </FormField>

                        <FormField label="5.3 ค่าภาษีเงินได้ (ผู้ออก)" className="md:col-span-2">
                            <InputField id="incomeTax" placeholder="ผู้จะซื้อ/ผู้จะขาย/คนละครึ่ง" register={register} className="w-full" />
                        </FormField>
                    </div>

                    <SectionHeader title="ข้อ 6. หากผู้จะซื้อผิดสัญญา ผู้จะซื้อยอมให้ผู้จะขายริบเงินที่ได้ชำระไว้แล้วทั้งสิ้น หากผู้จะขายผิดสัญญา ผู้จะขายต้องคืนเงินที่ได้ชำระไว้จากผู้จะซื้อทั้งหมด และยอมชดใช้ค่าเสียหายให้ผู้จะซื้อจำนวนเงินเท่ากับเงินที่ผู้จะซื้อได้วางมัดจำ
                    สัญญานี้ทำขึ้นเป็นสามฉบับ แต่ละฉบับมีข้อความถูกต้องตรงกันทุกประการ ทั้งสองฝ่ายต่างได้อ่านและเข้าใจดี เห็นว่าตรงตามความประสงค์ของตนแล้ว จึงได้ลงลายมือชื่อไว้เป็นสำคัญต่อหน้าพยาน" />

                    {/* Signature Section */}
                    <div className="grid grid-cols-1 gap-y-5 mt-24 pt-8 border-t-2 border-dotted">
                        {/* ----- Seller Signature ----- */}
                        <div className="text-center">
                            <div className="border border-gray-400 bg-gray-50 rounded-md h-32 w-full max-w-xs mx-auto">
                                {/* (แก้ไข) เปลี่ยนชื่อ Component เป็น SignaturePad */}
                                <SignaturePad
                                    ref={sellerSigCanvas}
                                    options={{ penColor: 'black' }}
                                />
                            </div>
                            <div className="space-x-4 mt-1">
                                <button type="button" onClick={() => sellerSigCanvas.current.clear()} className="text-sm text-blue-600 hover:underline">ล้าง</button>
                                <button type="button" onClick={() => setSellerSignature(sellerSigCanvas.current.toDataURL('image/png'))} className="text-sm text-green-600 hover:underline">บันทึก</button>
                            </div>
                            {sellerSignature && <p className="text-xs text-green-600 mt-1">✓ บันทึกลายเซ็นแล้ว</p>}
                            <div className="flex justify-center items-center">
                                <p className="mt-2">(</p>
                                <InputField id="namesigseller" register={register} />
                                <p className="mt-2">)</p>
                            </div>
                            <p>ผู้จะขาย</p>
                        </div>

                        {/* ----- Buyer Signature ----- */}
                        <div className="text-center">
                            <div className="border border-gray-400 bg-gray-50 rounded-md h-32 w-full max-w-xs mx-auto">
                                {/* (แก้ไข) เปลี่ยนชื่อ Component เป็น SignaturePad */}
                                <SignaturePad
                                    ref={buyerSigCanvas}
                                    options={{ penColor: 'black' }}
                                />
                            </div>
                            <div className="space-x-4 mt-1">
                                <button type="button" onClick={() => buyerSigCanvas.current.clear()} className="text-sm text-blue-600 hover:underline">ล้าง</button>
                                <button type="button" onClick={() => setBuyerSignature(buyerSigCanvas.current.toDataURL('image/png'))} className="text-sm text-green-600 hover:underline">บันทึก</button>
                            </div>
                            {buyerSignature && <p className="text-xs text-green-600 mt-1">✓ บันทึกลายเซ็นแล้ว</p>}
                            <div className="flex justify-center items-center">
                                <p className="mt-2">(</p>
                                <InputField id="namesigbuyer" register={register} />
                                <p className="mt-2">)</p>
                            </div>
                            <p>ผู้จะซื้อ</p>
                        </div>
                        <div className="text-center">
                            <div className="border border-gray-400 bg-gray-50 rounded-md h-32 w-full max-w-xs mx-auto">
                                <SignaturePad
                                    ref={witness1SigCanvas}
                                    options={{ penColor: 'black' }}
                                />
                            </div>
                            <div className="space-x-4 mt-1">
                                <button type="button" onClick={() => witness1SigCanvas.current.clear()} className="text-sm text-blue-600 hover:underline">ล้าง</button>
                                <button type="button" onClick={() => setWitness1Signature(witness1SigCanvas.current.toDataURL('image/png'))} className="text-sm text-green-600 hover:underline">บันทึก</button>
                            </div>
                            {witness1Signature && <p className="text-xs text-green-600 mt-1">✓ บันทึกลายเซ็นแล้ว</p>}
                            <div className="flex justify-center items-center">
                                <p className="mt-2">(</p>
                                <InputField id="witness1" register={register} />
                                <p className="mt-2">)</p>
                            </div>
                            <p>พยาน</p>
                        </div>

                        {/* ----- Witness 2 Signature ----- */}
                        <div className="text-center">
                            <div className="border border-gray-400 bg-gray-50 rounded-md h-32 w-full max-w-xs mx-auto">
                                <SignaturePad
                                    ref={witness2SigCanvas}
                                    options={{ penColor: 'black' }}
                                />
                            </div>
                            <div className="space-x-4 mt-1">
                                <button type="button" onClick={() => witness2SigCanvas.current.clear()} className="text-sm text-blue-600 hover:underline">ล้าง</button>
                                <button type="button" onClick={() => setWitness2Signature(witness2SigCanvas.current.toDataURL('image/png'))} className="text-sm text-green-600 hover:underline">บันทึก</button>
                            </div>
                            {witness2Signature && <p className="text-xs text-green-600 mt-1">✓ บันทึกลายเซ็นแล้ว</p>}
                            <div className="flex justify-center items-center">
                                <p className="mt-2">(</p>
                                <InputField id="witness2" register={register} />
                                <p className="mt-2">)</p>
                            </div>
                            <p>พยาน</p>
                        </div>


                    </div>
                    {/*---- Agreement for Purchase and Sale ----*/}
                    <div className="text-center mb-12 mt-20">
                        <h1 className="text-3xl font-bold text-gray-900">
                            บันทึกข้อตกลงสัญญาจะซื้อจะขาย
                        </h1>
                        <p className="text-gray-500 mt-2">
                            กรุณากรอกข้อมูลในช่องว่างให้ครบถ้วน
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-lg border-t pt-6">
                        <div className="md:col-span-2">
                            <FormField label="ผู้จะซื้อและผู้จะขายได้ตกลงกันว่าจะแจ้งซื้อขายกันที่กรมที่ดินในราคา">
                                <InputField id="notification_sale" register={register} className="w-full" />
                            </FormField>
                            <FormField label="จำนวนเงินเป็นภาษาไทย">
                                <InputField id="pricefont5" register={register} className="w-full" />
                            </FormField>
                            <FormField label="กรณีที่ซื้อขายเกินกว่าราคาข้างต้น">
                                <InputField id="realprice" register={register} className="w-full" />
                            </FormField>
                            <FormField label="หมายเหตุ">
                                <InputField id="annotation" register={register} className="w-full" />

                            </FormField>
                        </div>
                    </div>
                    {/* Signature Section */}
                    <div className="grid grid-cols-1 gap-y-5 mt-24 pt-8 border-t-2 border-dotted">
                        {/* ----- Seller Signature ----- */}
                        <div className="text-center">
                            <div className="border border-gray-400 bg-gray-50 rounded-md h-32 w-full max-w-xs mx-auto">
                                {/* (แก้ไข) เปลี่ยนชื่อ Component เป็น SignaturePad */}
                                <SignaturePad
                                    ref={sellerSigCanvas2}
                                    options={{ penColor: 'black' }}
                                />
                            </div>
                            <div className="space-x-4 mt-1">
                                <button type="button" onClick={() => sellerSigCanvas2.current.clear()} className="text-sm text-blue-600 hover:underline">ล้าง</button>
                                <button type="button" onClick={() => setSellerSignature2(sellerSigCanvas2.current.toDataURL('image/png'))} className="text-sm text-green-600 hover:underline">บันทึก</button>
                            </div>
                            {sellerSignature2 && <p className="text-xs text-green-600 mt-1">✓ บันทึกลายเซ็นแล้ว</p>}
                            <div className="flex justify-center items-center">
                                <p className="mt-2">(</p>
                                <InputField id="namesigseller2" register={register} />
                                <p className="mt-2">)</p>
                            </div>
                            <p>ผู้จะขาย</p>
                        </div>

                        {/* ----- Buyer Signature ----- */}
                        <div className="text-center">
                            <div className="border border-gray-400 bg-gray-50 rounded-md h-32 w-full max-w-xs mx-auto">
                                {/* (แก้ไข) เปลี่ยนชื่อ Component เป็น SignaturePad */}
                                <SignaturePad
                                    ref={buyerSigCanvas2}
                                    options={{ penColor: 'black' }}
                                />
                            </div>
                            <div className="space-x-4 mt-1">
                                <button type="button" onClick={() => buyerSigCanvas2.current.clear()} className="text-sm text-blue-600 hover:underline">ล้าง</button>
                                <button type="button" onClick={() => setBuyerSignature2(buyerSigCanvas2.current.toDataURL('image/png'))} className="text-sm text-green-600 hover:underline">บันทึก</button>
                            </div>
                            {buyerSignature2 && <p className="text-xs text-green-600 mt-1">✓ บันทึกลายเซ็นแล้ว</p>}
                            <div className="flex justify-center items-center">
                                <p className="mt-2">(</p>
                                <InputField id="namesigbuyer2" register={register} />
                                <p className="mt-2">)</p>
                            </div>
                            <p>ผู้จะซื้อ</p>
                        </div>
                        <div className="text-center">
                            <div className="border border-gray-400 bg-gray-50 rounded-md h-32 w-full max-w-xs mx-auto">
                                <SignaturePad
                                    ref={witness1SigCanvas2}
                                    options={{ penColor: 'black' }}
                                />
                            </div>
                            <div className="space-x-4 mt-1">
                                <button type="button" onClick={() => witness1SigCanvas2.current.clear()} className="text-sm text-blue-600 hover:underline">ล้าง</button>
                                <button type="button" onClick={() => setWitness1Signature2(witness1SigCanvas2.current.toDataURL('image/png'))} className="text-sm text-green-600 hover:underline">บันทึก</button>
                            </div>
                            {witness1Signature2 && <p className="text-xs text-green-600 mt-1">✓ บันทึกลายเซ็นแล้ว</p>}
                            <div className="flex justify-center items-center">
                                <p className="mt-2">(</p>
                                <InputField id="witness1sig2" register={register} />
                                <p className="mt-2">)</p>
                            </div>
                            <p>พยาน</p>
                        </div>

                        {/* ----- Witness 2 Signature ----- */}
                        <div className="text-center">
                            <div className="border border-gray-400 bg-gray-50 rounded-md h-32 w-full max-w-xs mx-auto">
                                <SignaturePad
                                    ref={witness2SigCanvas2}
                                    options={{ penColor: 'black' }}
                                />
                            </div>
                            <div className="space-x-4 mt-1">
                                <button type="button" onClick={() => witness2SigCanvas2.current.clear()} className="text-sm text-blue-600 hover:underline">ล้าง</button>
                                <button type="button" onClick={() => setWitness2Signature2(witness2SigCanvas2.current.toDataURL('image/png'))} className="text-sm text-green-600 hover:underline">บันทึก</button>
                            </div>
                            {witness2Signature2 && <p className="text-xs text-green-600 mt-1">✓ บันทึกลายเซ็นแล้ว</p>}
                            <div className="flex justify-center items-center">
                                <p className="mt-2">(</p>
                                <InputField id="witness2sig2" register={register} />
                                <p className="mt-2">)</p>
                            </div>
                            <p>พยาน</p>
                        </div>


                    </div>



                </div>
                {/* --- Action Button --- */}

                <div className="mt-8 flex flex-col md:flex-row gap-4">
                    {isFontLoaded ? (
                        <PDFDownloadLink
                            // onClick={() => {
                            //     if(!authUser){
                            //         navigate("/login")
                            //     }else if(authUser.userType == "Buyer"){
                            //         navigate("/buyer/payment")
                            //     }else if(authUser.userType == "Seller"){
                            //         navigate("/seller/payment")
                            //     }
                            // }}
                            document={
                                <ContractDocument
                                    data={formData}

                                    buyerSignature={buyerSignature}
                                    sellerSignature={sellerSignature}
                                    witness1Signature={witness1Signature}
                                    witness2Signature={witness2Signature}

                                    buyerSignature2={buyerSignature2}
                                    sellerSignature2={sellerSignature2}
                                    witness1Signature2={witness1Signature2}
                                    witness2Signature3={witness2Signature2}
                                />
                            }
                            fileName="Deposit.pdf"
                            className="w-full flex items-center justify-center text-center bg-green-600 text-white font-bold h-16 px-6 rounded-lg hover:bg-green-700 transition-colors duration-300 text-lg"
                        >
                            {({ loading }) => (loading ? "กำลังสร้างเอกสาร PDF..." : "สร้างและดาวน์โหลดสัญญา (PDF)")}
                        </PDFDownloadLink>
                    ) : (
                        <div className="w-full flex items-center justify-center text-center bg-gray-400 text-white font-bold h-16 px-6 rounded-lg cursor-not-allowed text-lg">
                            กำลังโหลดฟอนต์สำหรับสร้างเอกสาร...
                        </div>
                    )}

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full flex items-center justify-center bg-blue-600 text-white font-bold h-16 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-300 text-lg"
                    >
                        ส่งเอกสารที่ลงนามแล้ว
                    </button>

                </div>

                {/* --- (เพิ่ม) Modal สำหรับอัปโหลด --- */}
                <AnimatePresence>
                    {isModalOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: -20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: -20 }}
                                className="bg-white rounded-xl shadow-2xl w-full max-w-lg"
                            >
                                <div className="p-6 border-b flex justify-between items-center">
                                    <h3 className="text-xl font-bold">อัปโหลดสัญญาที่ลงนามแล้ว</h3>
                                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                        <X size={24} />
                                    </button>
                                </div>
                                <div className="p-6 space-y-6">
                                    {/* (เพิ่ม) ส่วนของคำอธิบาย */}
                                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                        <p className="font-semibold mb-2">กรุณาอัปโหลดเอกสารทั้งหมด 3 ฉบับ (PDF):</p>
                                        <ul className="list-disc pl-5 space-y-1">
                                            <li>เอกสารสัญญามัดจำ (ที่ลงนามแล้ว)</li>
                                            <li>สำเนาบัตรประชาชน</li>
                                            <li>สำเนาทะเบียนบ้าน</li>
                                        </ul>
                                    </div>
                                    {/* (แก้ไข) ส่วนของการเลือกไฟล์ */}
                                    <label className={`cursor-pointer block w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-colors ${filesToUpload.length < 3 ? 'hover:border-blue-500 hover:bg-blue-50' : 'opacity-60 cursor-not-allowed'}`}>
                                        <div className="flex flex-col items-center justify-center">
                                            <Upload size={40} className="text-gray-400 mb-2" />
                                            <span className="font-semibold text-gray-700">
                                                {filesToUpload.length < 3 ? "คลิกเพื่อเลือกไฟล์ PDF" : "อัปโหลดได้สูงสุด 3 ไฟล์"}
                                            </span>
                                            <span className="text-sm text-gray-500">คุณอัปโหลดแล้ว {filesToUpload.length} / 3 ไฟล์</span>
                                        </div>
                                        <input
                                            type="file"
                                            accept="application/pdf"
                                            multiple // (สำคัญ) เพิ่ม multiple
                                            className="hidden"
                                            onChange={handleFileSelect}
                                            disabled={filesToUpload.length >= 3} // ปิดการใช้งานเมื่อครบ 3 ไฟล์
                                        />
                                    </label>

                                    {/* (เพิ่ม) ส่วนแสดงรายชื่อไฟล์ที่เลือก */}
                                    {filesToUpload.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="font-semibold text-sm">ไฟล์ที่เลือก:</p>
                                            <ul className="space-y-1">
                                                {filesToUpload.map((file, index) => (
                                                    <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md text-sm">
                                                        <span className="truncate pr-2">{file.name}</span>
                                                        <button
                                                            onClick={() => handleRemoveFile(index)}
                                                            className="text-red-500 hover:text-red-700 flex-shrink-0"
                                                            aria-label={`Remove ${file.name}`}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}


                                    {uploadError && <p className="text-red-500 text-sm text-center">{uploadError}</p>}
                                </div>
                                <div className="p-6 bg-gray-50 rounded-b-xl flex justify-end gap-4">
                                    <Button variant="ghost" onClick={() => setIsModalOpen(false)}>ยกเลิก</Button>
                                    <Button
                                        onClick={handleUploadSubmit}
                                        disabled={isUploading || filesToUpload.length !== 3}
                                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9 px-4 flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed" // (เพิ่ม) เพิ่มสไตล์สำหรับตอน disabled
                                    >
                                        {isUploading ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            "ยืนยันการส่ง"
                                        )}
                                    </Button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>


            </div>
        </div>
    );
};

export default ContractForm;