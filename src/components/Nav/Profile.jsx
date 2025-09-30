import { useNavigate } from "react-router";
import { UserPen } from "lucide-react";
import { useEffect, useState } from "react";

const Profile = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("userType"));
    if (user) {
      setUserType(user);
    }
  }, []);
  const handleProfile = () => {
    if (userType === "Buyer") {
      navigate("/buyer/profile");
    } else if (userType === "Seller") {
      navigate("/seller/profile");
    } else {
      navigate("/");
    }
    return (
      <div
        onClick={handleProfile}
        className="flex space-x-2 justify-center items-center"
      >
        <UserPen />
        <p className="text-gray-500 hover:text-black opacity-100">Profile</p>
      </div>
    );
  };
};
export default Profile;
