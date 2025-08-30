import { BreadcrumbLink } from "../ui/breadcrumb";
import { Bell } from "lucide-react";

const Noti = () => {
  return (
    <BreadcrumbLink href="/Noti">
      <div className="flex justify-center items-center space-x-2">
        <Bell />
        <p className="text-gray-500 hover:text-black opacity-100">
          Notification
        </p>
      </div>
    </BreadcrumbLink>
  );
};
export default Noti;
