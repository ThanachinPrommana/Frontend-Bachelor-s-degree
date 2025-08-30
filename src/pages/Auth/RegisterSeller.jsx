import { registerSeller } from "@/api/auth"
import { useAuth } from "@/context/AuthContext"
import { Loader, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"


const RegisterSeller = () => {
    const { authUser, revalidateUser } = useAuth()
    const navigate = useNavigate()
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting, },
    } = useForm()
    const [serverError, setServerError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    useEffect(() => {
        if (authUser && authUser.userType === "Seller") {
            navigate("/seller")
        }
    }, [authUser, navigate])

    const onSubmit = async (data) => {
        setServerError(null);
        setSuccessMessage(null);
        try {
            const response = await registerSeller(data);
            setSuccessMessage(response.message);
            console.log("Response from registerSeller:", response)
            await revalidateUser()

        } catch (err) {
            console.error("Caught Error on Frontend:", err);
            setServerError(err.response?.data?.message || "An unexpected error occurred.");
        }
    }
    if (successMessage) {
        return (
            <div className="p-6 text-center bg-green-100 border border-green-400 text-green-700 rounded-md">
                <h3 className="text-xl font-bold">สมัครสำเร็จ!</h3>
                <p className="mt-2">กำลังนำคุณไปยังหน้าผู้ขาย...</p>
                <Loader2 className="w-6 h-6 animate-spin mx-auto mt-2" />
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-center items-center m-10">
                <h2 className="text-2xl font-bold mb-4">สมัครเป็นผู้ขาย</h2>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg mx-auto p-6 border rounded-lg shadow-md">

                {serverError &&
                    <div
                        className="p-3 text-red-800 bg-red-100 border border-red-400 rounded-md">
                        {serverError}
                    </div>}
                <div>
                    <label htmlFor="National_ID" className="block text-sm font-medium text-gray-700">
                        บัตรประจำตัวประชาชน
                    </label>
                    {/* 5. ใช้ register function และกำหนด validation rule */}
                    <input
                        type="text"
                        id="National_ID"
                        {...register("National_ID", { required: "National ID is required." })}
                        className={`mt-1 block w-full px-3 py-2 border ${errors.National_ID ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                    />
                    {/* 6. แสดง validation error message */}
                    {errors.National_ID &&
                        <p className="mt-1 text-sm text-red-600">กรุณากรอกบัตรประชาชน 13 หลัก</p>}
                </div>

                <div>
                    <label htmlFor="Company_Name" className="block text-sm font-medium text-gray-700">
                        ชื่อบริษัท
                    </label>
                    <input
                        type="text"
                        id="Company_Name"
                        {...register("Company_Name", { required: "Company Name is required." })}
                        className={`mt-1 block w-full px-3 py-2 border ${errors.Company_Name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                    />
                    {errors.Company_Name &&
                        <p className="mt-1 text-sm text-red-600">กรุณากรอกบริษัทที่สังกัด(ถ้ามี)</p>}
                </div>

                <div>
                    <label htmlFor="RealEstate_License" className="block text-sm font-medium text-gray-700">
                        บัตรประจำตัวนายหน้า
                    </label>
                    <input
                        type="text"
                        id="RealEstate_License"
                        {...register("RealEstate_License", { required: "Real Estate License is required." })}
                        className={`mt-1 block w-full px-3 py-2 border ${errors.RealEstate_License ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                    />
                    {errors.RealEstate_License &&
                        <p className="mt-1 text-sm text-red-600">กรุณากรอกบัตรประจำตัวนายหน้า(ถ้ามี)</p>}
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex 
                    justify-center py-2 px-4 border 
                    border-transparent rounded-md shadow-sm text-sm 
                    font-medium text-white bg-[#2C3E50] 
                    hover:bg-[#1a252f] focus:outline-none 
                    focus:ring-2 focus:ring-offset-2 focus:ring-[#1a252f]
                    disabled:bg-gray-400
                    cursor-pointer
                    "
                >
                    {isSubmitting ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                        "สมัครเป็นผู้ขาย"
                    )}
                </button>
            </form>
        </div>


    )
}
export default RegisterSeller