import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { preregister } from "@/api/auth";
const Register = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();
  const [userType, setUserType] = useState("Buyer");
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        userType:"Buyer",
      };
      console.log(payload);
      const res = await preregister(payload);

      console.log("API Response:", res);

      const message =
        res?.data?.message || res?.message || "Registered successfully";
      alert(message);

      // navigate("/verifyemail");
    } catch (err) {
      console.error("Catch error:", err);
      alert(err?.response?.data?.message || err?.message || "Server error");
    }
  };

  return (
    <div className="relative min-h-screen bg-[#2C3E50] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{
          backgroundImage:
            "url('https://i.pinimg.com/736x/5b/b4/5d/5bb45dd8bf2c2ecba1bbda8c656a2018.jpg')",
        }}
      ></div>
      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm"></div>

      <div className="relative z-10 bg-white bg-opacity-90 p-8 rounded-md w-[500px] shadow-lg">
        <div className="flex flex-col items-center mb-6">
          <img src="/hand-icon.svg" alt="logo" className="w-14 h-14 mb-2" />
          <h1 className="text-2xl font-semibold text-gray-800">
            Yuu Yenn Property
          </h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm mb-1">First Name</label>
              <input
                {...register("First_name", {
                  required: "First name is required",
                })}
                className="w-full px-3 py-2 border rounded-md"
              />
              {errors.First_name && (
                <p className="text-red-500 text-sm">
                  {errors.First_name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm mb-1">Last Name</label>
              <input
                {...register("Last_name", {
                  required: "Last name is required",
                })}
                className="w-full px-3 py-2 border rounded-md"
              />
              {errors.Last_name && (
                <p className="text-red-500 text-sm">
                  {errors.Last_name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm mb-1">Email</label>
              <input
                {...register("Email", {
                  required: "Email is required",
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: "Invalid email format",
                  },
                })}
                className="w-full px-3 py-2 border rounded-md"
              />
              {errors.Email && (
                <p className="text-red-500 text-sm">{errors.Email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm mb-1">Phone</label>
              <input
                type="tel"
                {...register("Phone", {
                  required: "Phone is required",
                  pattern: {
                    value: /^[0-9]{9,10}$/,
                    message: "Phone must be 9-10 digits and numbers only",
                  },
                })}
                className="w-full px-3 py-2 border rounded-md"
              />
              {errors.Phone && (
                <p className="text-red-500 text-sm">{errors.Phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm mb-1">Password</label>
              <input
                type="password"
                {...register("Password", {
                  required: "Password is required",
                  minLength: { value: 6, message: "Minimum 6 characters" },
                })}
                className="w-full px-3 py-2 border rounded-md"
              />
              {errors.Password && (
                <p className="text-red-500 text-sm">
                  {errors.Password.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm mb-1">Confirm Password</label>
              <input
                type="password"
                {...register("ConfirmPassword", {
                  validate: (value) =>
                    value === watch("Password") || "Passwords do not match",
                })}
                className="w-full px-3 py-2 border rounded-md"
              />
              {errors.ConfirmPassword && (
                <p className="text-red-500 text-sm">
                  {errors.ConfirmPassword.message}
                </p>
              )}
            </div>
          </div>

          {/* <div className="mb-4">
            <label className="block text-sm mb-2">User Type</label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="Buyer"
                  checked={userType === "Buyer"}
                  onChange={() => setUserType("Buyer")}
                />
                <span>Buyer</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="Seller"
                  checked={userType === "Seller"}
                  onChange={() => setUserType("Seller")}
                />
                <span>Seller</span>
              </label>
            </div>
          </div> */}

          <button
            type="submit"
            className="w-full bg-[#2C3E50] text-white py-2 rounded-md hover:bg-[#1a252f] transition"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
