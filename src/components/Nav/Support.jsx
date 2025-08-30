import { useNavigate } from "react-router";
import { HeartPlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const Support = () => {
  const navigate = useNavigate();
  const { authUser } = useAuth();

  const handleSupport = () => {
    if (authUser?.userType === "Buyer") {
      navigate("/buyer/support");
    } else if (authUser?.userType === "Seller") {
      navigate("/seller/support");
    } else {
      navigate("/support");
    }
  };
  return (
    <div
      onClick={handleSupport}
      className="flex justify-center items-center space-x-2"
    >
      <HeartPlus />
      <p className="text-gray-500 hover:text-black opacity-100">Support</p>
    </div>
  );
};
export default Support;
