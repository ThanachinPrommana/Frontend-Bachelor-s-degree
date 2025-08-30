import Navbar_Buyer from "@/components/Nav/Navbar_Buyer";
import { Outlet } from "react-router";

const Layout_Buyer = () => {
  return (
    <div>
      <Navbar_Buyer />
      <Outlet />
    </div>
  );
};
export default Layout_Buyer;
