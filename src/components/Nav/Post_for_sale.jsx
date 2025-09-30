import { BreadcrumbLink } from "../ui/breadcrumb";
import { StickyNote } from "lucide-react";

const Post_for_sale = () => {
  return (
    <BreadcrumbLink href="/seller/post-for-sale/title">
      <div className="flex justify-center items-center space-x-2">
        <StickyNote />
        <p className="text-gray-500 hover:text-black opacity-100">
          Post for sale
        </p>
      </div>
    </BreadcrumbLink>
  );
};
export default Post_for_sale;
