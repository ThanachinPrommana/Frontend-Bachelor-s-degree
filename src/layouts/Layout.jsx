import { Outlet } from "react-router";
import Navbar from "@/components/Nav/Navbar";

const Layout = () => {
  return (
    <div>
      <Navbar />
      <Outlet />
    </div>
  );
};
export default Layout;
