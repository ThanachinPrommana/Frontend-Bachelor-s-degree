import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import SignatureCanvas from "react-signature-canvas";
import { PDFDownloadLink } from "@react-pdf/renderer";
import ContractDocument from "./ContractDocument";

// (แก้ไข) 1. ย้าย InputField ออกมาไว้นอก Component หลัก
// และรับ register เข้ามาเป็น prop
const InputField = ({ id, placeholder, className = "flex-grow", register }) => (
    <input
        type="text"
        {...register(id)}
        placeholder={placeholder}
        className={`border-b-2 border-dotted border-gray-400 focus:outline-none focus:border-solid focus:border-black pb-1 px-1 ${className}`}
    />
);

const ContractForm = () => {
    // --- State Management ---
    const { register, watch } = useForm();
    const buyerSigCanvas = useRef({});
    const sellerSigCanvas = useRef({});
    
    const formData = watch();
    const [buyerSignature, setBuyerSignature] = useState(null);
    const [sellerSignature, setSellerSignature] = useState(null);

    return (
        <div className="bg-gray-200 min-h-screen p-4 sm:p-8 flex items-center justify-center font-['Sarabun']">
            <div className="w-full max-w-5xl">
                {/* --- ส่วนของฟอร์มที่แสดงบนหน้าเว็บ --- */}
                <div className="bg-white p-12 md:p-16 shadow-2xl space-y-8">
                    
                    <h1 className="text-2xl font-bold text-center">สัญญาจะซื้อจะขาย หรือ สัญญาวางเงินมัดจำ</h1>

                    {/* Section: Date and Place */}
                    <div className="flex justify-end text-lg">
                        <div className="w-full sm:w-2/3 md:w-1/2 space-y-2">
                            <div className="flex items-baseline">
                                <label className="mr-2">ทำที่</label>
                                {/* (แก้ไข) 2. ส่ง register เข้าไปเป็น prop */}
                                <InputField id="contractPlace" register={register} />
                            </div>
                            <div className="flex items-baseline gap-x-4">
                                <label className="mr-2">วันที่</label>
                                <InputField id="date" placeholder="วัน" className="w-16" register={register} />
                                <label className="mr-2">เดือน</label>
                                <InputField id="month" placeholder="เดือน" register={register} />
                                <label className="mr-2">พ.ศ.</label>
                                <InputField id="year" placeholder="ปี" className="w-24" register={register} />
                            </div>
                        </div>
                    </div>

                    {/* Section: Parties */}
                    <div className="space-y-4 text-lg leading-relaxed">
                        <div className="flex flex-wrap items-baseline gap-x-4">
                            <span>ระหว่าง</span>
                            <div className="flex-grow min-w-[250px]"><InputField id="sellerName" placeholder="ชื่อผู้จะขาย" register={register} /></div>
                            <span>อายุ</span>
                            <div className="w-20"><InputField id="sellerAge" placeholder="อายุ" register={register} /></div>
                            <span>ปี</span>
                        </div>
                        <div className="flex items-baseline">
                           <span className="whitespace-nowrap mr-2">หมายเลขบัตรประจำตัวประชาชน</span>
                           <InputField id="sellerID" placeholder="เลขบัตร" register={register} />
                        </div>
                        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                            <span>อยู่บ้านเลขที่</span>
                            <div className="flex-grow min-w-[150px]"><InputField id="sellerAddress" placeholder="เลขที่" register={register} /></div>
                            <span>หมู่ที่</span>
                            <div className="w-24"><InputField id="sellerVillageNo" placeholder="หมู่" register={register} /></div>
                            <span>ซอย</span>
                            <div className="flex-grow min-w-[150px]"><InputField id="sellerSoi" placeholder="ซอย" register={register} /></div>
                        </div>
                         <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                            <span>ถนน</span>
                            <div className="flex-grow min-w-[150px]"><InputField id="sellerRoad" placeholder="ถนน" register={register} /></div>
                            <span>ตำบล/แขวง</span>
                            <div className="flex-grow min-w-[150px]"><InputField id="sellerSubDistrict" placeholder="ตำบล/แขวง" register={register} /></div>
                        </div>
                         <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                            <span>อำเภอ/เขต</span>
                            <div className="flex-grow min-w-[150px]"><InputField id="sellerDistrict" placeholder="อำเภอ/เขต" register={register} /></div>
                            <span>จังหวัด</span>
                            <div className="flex-grow min-w-[150px]"><InputField id="sellerProvince" placeholder="จังหวัด" register={register} /></div>
                        </div>
                        <p>ซึ่งต่อไปในสัญญานี้จะเรียกว่า "ผู้จะขาย" ฝ่ายหนึ่ง</p>
                        
                        <div className="flex flex-wrap items-baseline gap-x-4 pt-4">
                            <span className="whitespace-nowrap">กับ</span>
                            <div className="flex-grow min-w-[250px]"><InputField id="buyerName" placeholder="ชื่อผู้จะซื้อ" register={register} /></div>
                            <span>อายุ</span>
                            <div className="w-20"><InputField id="buyerAge" placeholder="อายุ" register={register} /></div>
                            <span>ปี</span>
                        </div>
                         <div className="flex items-baseline">
                           <span className="whitespace-nowrap mr-2">หมายเลขบัตรประจำตัวประชาชน</span>
                           <InputField id="buyerID" placeholder="เลขบัตร" register={register} />
                        </div>
                        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                            <span>อยู่บ้านเลขที่</span>
                            <div className="flex-grow min-w-[150px]"><InputField id="buyerAddress" placeholder="เลขที่" register={register} /></div>
                            <span>หมู่ที่</span>
                            <div className="w-24"><InputField id="buyerVillageNo" placeholder="หมู่" register={register} /></div>
                            <span>ซอย</span>
                            <div className="flex-grow min-w-[150px]"><InputField id="buyerSoi" placeholder="ซอย" register={register} /></div>
                            <span>ถนน</span>
                            <div className="flex-grow min-w-[150px]"><InputField id="buyerRoad" placeholder="ถนน" register={register} /></div>
                            <span>ตำบล/แขวง</span>   
                            <div className="flex-grow min-w-[150px]"><InputField id="buyerSubDistrict" placeholder="ตำบล/แขวง" register={register} /></div>
                            <span>อำเภอ/เขต</span>
                            <div className="flex-grow min-w-[150px]"><InputField id="buyerDistrict" placeholder="อำเภอ/เขต" register={register} /></div>
                            <span>จังหวัด</span>
                            <div className="flex-grow min-w-[150px]"><InputField id="buyerProvince" placeholder="จังหวัด" register={register} /></div>
                        </div>
                        <p>ซึ่งต่อไปในสัญญานี้จะเรียกว่า "ผู้จะซื้อ" ฝ่ายหนึ่ง</p>
                    </div>
                    {/* ... (เนื้อหาส่วนที่เหลือของสัญญา) ... */}
                    <div className="text-lg leading-relaxed space-y-2">
                        <p>ทั้งสองฝ่ายตกลงทำสัญญาฉบับนี้ขึ้นด้วยความสมัครใจมีข้อความดังต่อไปนี้</p>
                        <div className="flex flex-wrap items-baseline gap-x-4">
                            <span className="font">ข้อ 1. ผู้ขายเป็นเจ้าของ</span>
                            <div className="flex-grow min-w-[150px]"><InputField id="ownSeller" placeholder="ผู้ขายเป็นเจ้าของ" register={register} /></div>
                        </div>
                        <div className="flex flex-wrap items-baseline gap-x-4">
                            <span>ข้อ 2. ผู้ขายตกลงจะขายและผู้ซื้อตกลงจะซื้อ ในข้อ 1. โดยปลอกจากภาวะผูกพันหรือภาระติดพันใดๆ</span>
                            <div className="flex-grow min-w-[150px]"><InputField id="responsibility" placeholder="ผู้ขายตกลงจะขายและผู้ซื้อตกลงจะซื้อ" register={register} /></div>
                        </div>

                    </div>
                    
                    {/* Signature Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8 mt-24 pt-8 border-t-2 border-dotted">
                        <div className="text-center">
                            <div className="border border-gray-400 bg-gray-50 rounded-md h-32 w-full max-w-xs mx-auto">
                                <SignatureCanvas ref={sellerSigCanvas} penColor="black" canvasProps={{ className: "w-full h-full" }} />
                            </div>
                            <div className="space-x-4 mt-1">
                                <button type="button" onClick={() => sellerSigCanvas.current.clear()} className="text-sm text-blue-600 hover:underline">ล้าง</button>
                                <button type="button" onClick={() => setSellerSignature(sellerSigCanvas.current.getTrimmedCanvas().toDataURL('image/png'))} className="text-sm text-green-600 hover:underline">บันทึก</button>
                            </div>
                            {sellerSignature && <p className="text-xs text-green-600 mt-1">✓ บันทึกลายเซ็นแล้ว</p>}
                            <p className="mt-2">(..................................................)</p>
                            <p>ผู้จะขาย</p>
                        </div>
                         <div className="text-center">
                            <div className="border border-gray-400 bg-gray-50 rounded-md h-32 w-full max-w-xs mx-auto">
                                <SignatureCanvas ref={buyerSigCanvas} penColor="black" canvasProps={{ className: "w-full h-full" }} />
                            </div>
                            <div className="space-x-4 mt-1">
                                <button type="button" onClick={() => buyerSigCanvas.current.clear()} className="text-sm text-blue-600 hover:underline">ล้าง</button>
                                <button type="button" onClick={() => setBuyerSignature(buyerSigCanvas.current.getTrimmedCanvas().toDataURL('image/png'))} className="text-sm text-green-600 hover:underline">บันทึก</button>
                            </div>
                            {buyerSignature && <p className="text-xs text-green-600 mt-1">✓ บันทึกลายเซ็นแล้ว</p>}
                            <p className="mt-2">(..................................................)</p>
                            <p>ผู้จะซื้อ</p>
                        </div>
                    </div>

                </div>

                {/* --- Action Button --- */}
                <div className="mt-6">
                    <PDFDownloadLink
                        document={
                            <ContractDocument 
                                data={formData} 
                                buyerSignature={buyerSignature}
                                sellerSignature={sellerSignature}
                            />
                        }
                        fileName="สัญญาเงินมัดจำ.pdf"
                        className="block w-full text-center bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700"
                    >
                        {({ loading }) => loading ? 'กำลังสร้างเอกสาร PDF...' : 'สร้างและดาวน์โหลดสัญญา (PDF)'}
                    </PDFDownloadLink>
                </div>
            </div>
        </div>
    );
};

export default ContractForm;