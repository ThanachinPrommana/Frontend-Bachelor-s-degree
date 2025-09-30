import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import SignatureCanvas from "react-signature-canvas";
import jsPDF from "jspdf";
import domtoimage from 'dom-to-image-more';

const ContractForm = () => {
    // --- State Management ---
    const { register, watch } = useForm();
    const buyerSigCanvas = useRef({});
    const sellerSigCanvas = useRef({});
    const contractRef = useRef(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const fontStyles = `@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');`;

    // ✅ 3. (แก้ไข) คืนฟังก์ชัน generatePdf เป็นแบบเดิมที่ไม่มี embedFonts
    const generatePdf = () => {
        setIsGenerating(true);
        const node = contractRef.current;

        // ซ่อนปุ่มล้างลายเซ็นก่อน
        const clearButtons = node.querySelectorAll('.clear-sig-button');
        clearButtons.forEach(btn => btn.style.display = 'none');

        const options = {
            quality: 1.0,
            height: node.scrollHeight,
            width: node.scrollWidth,
        };

        domtoimage.toPng(node, options)
            .then(function (dataUrl) {
                clearButtons.forEach(btn => btn.style.display = 'inline'); // ทำให้ปุ่มกลับมาแสดง

                const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const imgProps = pdf.getImageProperties(dataUrl);
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save("สัญญาเงินมัดจำ.pdf");
            })
            .catch(function (error) {
                console.error('PDF Generation Error:', error);
                alert('ขออภัย, ไม่สามารถสร้างไฟล์ PDF ได้ กรุณาตรวจสอบ Console');
                clearButtons.forEach(btn => btn.style.display = 'inline'); // ทำให้ปุ่มกลับมาแสดง
            })
            .finally(() => {
                setIsGenerating(false);
            });
    };

    // In ContractForm.jsx

    return (
        // (แก้ไข) 1. เปลี่ยน container หลักให้เป็น flex และจัดให้อยู่กลางหน้าจอ
        <div className="bg-gray-200 min-h-screen p-4 sm:p-8 flex items-center justify-center font-['Sarabun']">

            {/* (เพิ่ม) 2. สร้าง wrapper เพื่อจัดกลุ่ม "กระดาษ" และ "ปุ่ม" ให้อยู่ด้วยกัน */}
            <div className="w-full max-w-4xl">

                {/* A4 Paper Simulation */}
                {/* (แก้ไข) 3. ปรับ padding และเงาให้ดูเหมือนเอกสารมากขึ้น */}
                <div ref={contractRef} className="bg-white p-12 md:p-16 shadow-2xl">
                    <style>{fontStyles}</style>
                    {/* Header */}
                    <h1 className="text-2xl font-bold text-center mb-8">สัญญาจะซื้อจะขาย หรือ สัญญาวางเงินมัดจำ</h1>

                    {/* Date and Place */}
                    {/* <div className="flex justify-end mb-6 text-lg">
                        <div className="w-full sm:w-1/2">

                            <div className="flex items-baseline">
                                <label className="mr-2 whitespace-nowrap">วันที่:</label>
                                <input type="text" {...register("date")} className="border-b-2 border-dotted border-gray-400 w-full focus:outline-none focus:border-black" />
                            </div>
                        </div>
                    </div> */}

                    {/* Parties */}

                    {/* <p className="leading-loose text-lg mb-6">
                        สัญญานี้ทำที่ <input type="text" {...register("contractPlace")} placeholder="สถานที่ทำสัญญา" className="border-b-2 border-dotted border-gray-400 focus:outline-none focus:border-black mx-1 px-1 w-full sm:w-auto" />
                        สัญญานี้ทำขึ้นระหว่าง <input type="text" {...register("sellerName")} placeholder="ชื่อผู้จะขาย" className="border-b-2 border-dotted border-gray-400 focus:outline-none focus:border-black mx-1 px-1 w-full sm:w-auto" />
                        อยู่บ้านเลขที่ <input type="text" {...register("sellerAddress")} placeholder="ที่อยู่ผู้จะขาย" className="border-b-2 border-dotted border-gray-400 focus:outline-none focus:border-black mx-1 px-1 w-full" />
                        ซึ่งต่อไปในสัญญานี้จะเรียกว่า **"ผู้จะขาย"** ฝ่ายหนึ่ง กับ
                        <input type="text" {...register("buyerName")} placeholder="ชื่อผู้จะซื้อ" className="border-b-2 border-dotted border-gray-400 focus:outline-none focus:border-black mx-1 px-1 w-full sm:w-auto" />
                        อยู่บ้านเลขที่ <input type="text" {...register("buyerAddress")} placeholder="ที่อยู่ผู้จะซื้อ" className="border-b-2 border-dotted border-gray-400 focus:outline-none focus:border-black mx-1 px-1 w-full" />
                        ซึ่งต่อไปในสัญญานี้จะเรียกว่า **"ผู้จะซื้อ"** อีกฝ่ายหนึ่ง
                    </p> */}
                    <div className="flex flex-col">
                        <div className="space-y-4">

                            {/* --- กลุ่มที่ 1: สถานที่ --- */}
                            <p className="text-lg flex flex-wrap items-center leading-tight">
                                <span className="whitespace-nowrap">สัญญานี้ทำที่ </span>
                                <input
                                    type="text"
                                    {...register("contractPlace")}
                                    placeholder="สถานที่ทำสัญญา"
                                    className=" border-b-2 border-dotted border-gray-400 focus:outline-none focus:border-black mx-1 px-1 w-auto flex-grow min-w-[150px]"
                                />
                            </p>

                            {/* --- กลุ่มที่ 2: วัน เดือน ปี --- */}
                            <p className="text-lg flex flex-wrap items-center leading-tight">
                                <span className="whitespace-nowrap">ในวันที่ </span>

                                <span className="whitespace-nowrap">วัน</span>
                                <input
                                    type="text"
                                    {...register("date")}
                                    placeholder="วันที่"
                                    className="border-b-2 border-dotted border-gray-400 focus:outline-none focus:border-black mx-1 px-1 min-w-[50px] w-auto flex-grow"
                                />

                                <span className="whitespace-nowrap">เดือน</span>
                                <input
                                    type="text"
                                    {...register("month")}
                                    placeholder="เดือน"
                                    className="border-b-2 border-dotted border-gray-400 focus:outline-none focus:border-black mx-1 px-1 min-w-[100px] w-auto flex-grow"
                                />

                                <span className="whitespace-nowrap">พ.ศ.</span>
                                <input
                                    type="text"
                                    {...register("year")}
                                    placeholder="ปี พ.ศ."
                                    className="border-b-2 border-dotted border-gray-400 focus:outline-none focus:border-black mx-1 px-1 min-w-[70px] w-auto flex-grow"
                                />
                            </p>

                            {/* --- กลุ่มที่ 3: ระหว่าง ชื่อผู้จะขาย อายุ --- */}
                            <p className="text-lg flex flex-wrap items-center leading-tight">
                                <span className="whitespace-nowrap">ระหว่าง</span>
                                <input
                                    type="text"
                                    {...register("sellerName")}
                                    placeholder="ชื่อผู้จะขาย"
                                    className="border-b-2 border-dotted border-gray-400 focus:outline-none focus:border-black mx-1 px-1 w-auto flex-grow min-w-[150px]"
                                />

                                <span className="whitespace-nowrap ml-4">อายุ</span>
                                <input
                                    type="text"
                                    {...register("sellerAge")}
                                    placeholder="อายุ"
                                    className="border-b-2 border-dotted border-gray-400 focus:outline-none focus:border-black mx-1 px-1 min-w-[50px] w-auto flex-grow"
                                />
                                <span className="whitespace-nowrap">ปี</span>

                            </p>
                            <p className="text-lg flex flex-wrap items-center leading-tight ml-15">
                                <span className="whitespace-nowrap">หมายเลขบัตรประจำตัวประชาชน</span>
                                <input
                                    type="text"
                                    {...register("sellerID")}
                                    placeholder="เลขที่บัตรประชาชน"
                                    className="border-b-2 border-dotted border-gray-400 focus:outline-none focus:border-black mx-1 px-1 min-w-[50px] w-auto flex-grow"
                                />
                            </p>

                        </div>
                    </div>


                    {/* Clause 1: Property Details */}
                    <div className="mb-6 text-lg">
                        <p className="font-bold mb-2">ข้อ 1. ทรัพย์สินที่ซื้อขาย</p>
                        <p className="leading-loose">
                            ผู้จะขายตกลงขายและผู้จะซื้อตกลงรับซื้อ <input type="text" {...register("propertyType")} placeholder="เช่น ที่ดินพร้อมสิ่งปลูกสร้าง" className="border-b-2 border-dotted border-gray-400 focus:outline-none focus:border-black w-full" />
                            ตามโฉนดที่ดินเลขที่ <input type="text" {...register("deedNumber")} placeholder="เลขที่โฉนด" className="border-b-2 border-dotted border-gray-400 focus:outline-none focus:border-black mx-1 px-1" />
                            เนื้อที่ประมาณ <input type="text" {...register("area")} placeholder="เช่น 2 ไร่ 1 งาน 50 ตารางวา" className="border-b-2 border-dotted border-gray-400 focus:outline-none focus:border-black mx-1 px-1 w-full" />
                        </p>
                    </div>

                    {/* Placeholder for other clauses */}
                    <p className="text-center text-gray-400 my-8">[... เพิ่มข้อ 2, 3, 4, และ 5 ที่นี่ ...]</p>

                    {/* Signature Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 mt-24">
                        <div className="text-center">
                            <div className="border border-gray-400 bg-gray-50 rounded-md h-32">
                                <SignatureCanvas ref={buyerSigCanvas} penColor="black" canvasProps={{ className: "w-full h-full" }} />
                            </div>
                            <button type="button" onClick={() => buyerSigCanvas.current.clear()} className="text-sm text-blue-600 hover:underline mt-1 clear-sig-button">ล้าง</button>
                            <p className="mt-2">(..................................................)</p>
                            <p>ผู้จะซื้อ</p>
                        </div>
                        <div className="text-center">
                            <div className="border border-gray-400 bg-gray-50 rounded-md h-32">
                                <SignatureCanvas ref={sellerSigCanvas} penColor="black" canvasProps={{ className: "w-full h-full" }} />
                            </div>
                            <button type="button" onClick={() => sellerSigCanvas.current.clear()} className="text-sm text-blue-600 hover:underline mt-1 clear-sig-button">ล้าง</button>
                            <p className="mt-2">(..................................................)</p>
                            <p>ผู้จะขาย</p>
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <div className="mt-6">
                    <button
                        onClick={generatePdf}
                        disabled={isGenerating}
                        className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                    >
                        {isGenerating ? 'กำลังสร้างเอกสาร PDF...' : 'สร้างและดาวน์โหลดสัญญา (PDF)'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ContractForm;