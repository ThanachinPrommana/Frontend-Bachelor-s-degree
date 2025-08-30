import Navbar_Seller from "@/components/Nav/Navbar_Seller";
import { Outlet } from "react-router";

const Layout_Seller = () => {
  return (
    <div>
      <Navbar_Seller />
      <Outlet />
    </div>
  );
};
export default Layout_Seller;
