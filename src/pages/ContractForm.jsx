import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import SignatureCanvas from "react-signature-canvas";
import { PDFDownloadLink } from "@react-pdf/renderer";
import ContractDocument from "./ContractDocument";
import { Font } from '@react-pdf/renderer';
import { useEffect } from "react";


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

Font.register({
    family: 'Sarabun',
    fonts: [
        { src: '/fonts/Sarabun-Regular.ttf' },
        { src: '/fonts/Sarabun-Bold.ttf', fontWeight: 'bold' },
    ]
});


const ContractForm = () => {
    // --- State Management ---
    const { register, watch } = useForm();
    const buyerSigCanvas = useRef({});
    const sellerSigCanvas = useRef({});

    const formData = watch();
    const [buyerSignature, setBuyerSignature] = useState(null);
    const [sellerSignature, setSellerSignature] = useState(null);
    const [isFontLoaded, setIsFontLoaded] = useState(false);

    // (เพิ่ม) 2. เพิ่ม useEffect เพื่อตรวจสอบว่า Font โหลดเสร็จหรือยัง
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsFontLoaded(true);
        }, 500); // หน่วงเวลา 0.5 วินาทีเพื่อให้แน่ใจว่า Font พร้อมใช้งาน

        return () => clearTimeout(timer); // Cleanup function
    }, []);


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
                        <div className="flex items-baseline">
                            <span className="whitespace-nowrap mr-2">ระหว่าง</span>
                            <div ><InputField id="sellerName" placeholder="ชื่อผู้จะขาย" register={register} /></div>
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
                            <span>ในราคา</span>
                            <div className="flex-grow min-w-[150px]"><InputField id="price" placeholder="ผู้ขายตกลงจะขายและผู้ซื้อตกลงจะซื้อ" register={register} /></div>
                            <span>บาท</span>
                            <div className="flex-grow min-w-[150px]"><InputField id="responsibility" register={register} /></div>

                        </div>
                        <div className="flex flex-wrap items-baseline gap-x-4">
                            <span>ข้อ 3. ในวันทำสัญญาฉบับนี้ ผู้จะซื้อตกลงวางเงินมัดจำบางส่วนให้แก่ผู้จะขายเป็นจำนวนเงิน</span>
                            <div className="flex-grow min-w-[150px]"><InputField id="somecontract" register={register} /></div>
                            <span>โดยชำระเป็นเงินสด/เช็กธนาคาร</span>
                            <div className="flex-grow min-w-[150px]"><InputField id="bankcheck" register={register} /></div>
                            <span>สาขา</span>
                            <div className="flex-grow min-w-[150px]"><InputField id="remainingAmount" register={register} /></div>
                            <span>เลขที่เช็ค</span>
                            <div className="flex-grow min-w-[150px]"><InputField id="checkNo" register={register} /></div>
                            <span>สั่งจ่ายเงินวันที่</span>
                            <div className="flex-grow min-w-[150px]"><InputField id="datepay" register={register} /></div>
                            <span>โอนเงินเข้าบัญชี</span>
                            <div className="flex-grow min-w-[150px]"><InputField id="accountTo" register={register} /></div>
                            <span>ชื่อบัญชี</span>
                            <div className="flex-grow min-w-[150px]"><InputField id="accountName" register={register} /></div>
                            <span>เลขที่บัญชี</span>
                            <div className="flex-grow min-w-[150px]"><InputField id="accountNo" register={register} /></div>
                            <span>ซึ่งผู้ขายได้รับไว้เรียบร้อยถูกต้องครบถ้วนแล้ว และคู่สัญญา ได้ถือว่าเงินมัดจำดังกล่าวนี้เป็นเงินชำระราคาส่วนหนึ่ง</span>
                        </div>
                        <div className="flex flex-wrap items-baseline gap-x-4">
                            <span>ข้อ 4. ผู้ซื้อตกลงชำระราคา ส่วนที่เหลืออีก</span>
                            <div className="flex-grow min-w-[150px]"><InputField id="pricecontractrest" register={register} /></div>
                            <span>บาท</span>
                            <div className="flex-grow min-w-[150px]"><InputField id="Other" register={register} /></div>
                            <span>ภายในวันที่</span>
                            <div className="flex-grow min-w-[150px]"><InputField id="dateofpay4" register={register} /></div>
                        </div>
                        <span>ข้อ 5. ค่าใช้จ่ายในการโอนกรรมสิทธิ์</span>
                        <div className="flex flex-col items-baseline gap-x-4">
                            <div className="flex flex-wrap items-baseline gap-x-4">
                                <span>5.1 ค่าธรรมเนียมการโอน</span>
                                <div className="flex-grow min-w-[150px]"><InputField id="transferfee" register={register} /></div>
                                <span>เป็นผู้ออก</span>
                            </div>
                            <div className="flex flex-wrap items-baseline gap-x-4">
                                <span>5.2 ค่าธุรกิจเฉพาะ/อากร</span>
                                <div className="flex-grow min-w-[150px]"><InputField id="specificbusinessfee" register={register} /></div>
                                <span>เป็นผู้ออก</span>
                            </div>
                            <div className="flex flex-wrap  items-baseline gap-x-4">
                                <span>5.3 ค่าภาษีเงินได้บุคคลธรรมดา/ภาษีเงินได้นิติบุคคล/ภาษีเงินได้มรดก(รับให้)</span>
                                <div className="flex-grow min-w-[150px]"><InputField id="incomeTax" register={register} /></div>
                                <span>เป็นผู้ออก</span>
                            </div>
                            <span>5.4 ค่าจดจำนอง(ถ้ามี)ผู้ซื้อจะเป็นผู้ออก</span>
                        </div>
                        <div className="flex flex-wrap items-baseline gap-x-4">
                            <span>ข้อ 6. หากผู้จะซื้อผิดสัญญา ผู้จะซื้อยอมให้ผู้จะขายริบเงินที่ได้ชำระไว้แล้วทั้งสิ้น หากผู้จะขายผิดสัญญา ผู้จะขายต้องคืนเงินที่ได้ชำระไว้จากผู้จะซื้อทั้งหมด และยอมชดใช้ค่าเสียหายให้ผู้จะซื้อจำนวนเงินเท่ากับเงินที่ผู้จะซื้อได้วางมัดจำ
                            </span>
                            <span>สัญญานี้ทำขึ้นเป็นสามฉบับ แต่ละฉบับมีข้อความถูกต้องตรงกันทุกประการ ทั้งสองฝ่ายต่างได้อ่านและเข้าใจดี เห็นว่าตรงตามความประสงค์ของตนแล้ว จึงได้ลงลายมือชื่อไว้เป็นสำคัญต่อหน้าพยาน </span>
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
                    {isFontLoaded ? (
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
                    ) : (
                        <div className="block w-full text-center bg-gray-400 text-white font-bold py-3 px-6 rounded-lg cursor-not-allowed">
                            กำลังโหลดฟอนต์สำหรับสร้างเอกสาร...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContractForm;