import { UserPen } from "lucide-react";
import { BreadcrumbLink } from "../ui/breadcrumb";

const Profile_Seller = () => {
  return (
    <BreadcrumbLink href="/seller/profile">
      <div className="flex space-x-2 justify-center items-center">
        <UserPen />
        <p className="text-gray-500 hover:text-black opacity-100">Profile</p>
      </div>
    </BreadcrumbLink>
  );
};
export default Profile_Seller;
