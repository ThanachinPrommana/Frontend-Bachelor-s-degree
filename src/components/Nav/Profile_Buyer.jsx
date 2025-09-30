import { BreadcrumbLink } from "../ui/breadcrumb";
import { UserPen } from "lucide-react";

const Profile_Buyer = () => {
  return (
    <BreadcrumbLink href="/buyer/profile">
      <div className="flex space-x-2 justify-center items-center">
        <UserPen />
        <p className="text-gray-500 hover:text-black opacity-100">Profile</p>
      </div>
    </BreadcrumbLink>
  );
};
export default Profile_Buyer;
