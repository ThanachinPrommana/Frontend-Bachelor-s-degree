import Logo from "./Logo";
import Noti from "./Noti";
import { useNavigate } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlignJustify, UserPen, HeartPlus, StickyNote } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const Navbar_Seller = () => {
  const navigate = useNavigate();
  const { authUser, setAuthUser } = useAuth();
  const { logout } = useAuth();
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="py-4 px-5 shadow-md border-b border-gray-200 bg-[#2c3e50] text-white">
      <div className="flex flex-col sm:flex-row sm:justify-between items-center ml-70 mr-70">
        <Logo />
        <div className="flex space-x-30 py-2">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <AlignJustify className="cursor-pointer hover:text-blue-300" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {authUser
                  ? `${authUser.First_name} ${authUser.Last_name}`
                  : "Guest"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => {
                  navigate("/seller/profile");
                }}
              >
                <div className="flex space-x-2 justify-center items-center">
                  <UserPen />
                  <p className="text-gray-500 hover:text-black opacity-100">
                    Profile
                  </p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => {
                  navigate("/seller/post-for-sale/title");
                }}
              >
                <div className="flex justify-center items-center space-x-2">
                  <StickyNote />
                  <p className="text-gray-500 hover:text-black opacity-100">
                    Post for sale
                  </p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Noti />
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => {
                  navigate("/seller/support");
                }}
              >
                <div className="flex justify-center items-center space-x-2">
                  <HeartPlus />
                  <p className="text-gray-500 hover:text-black opacity-100">
                    Support
                  </p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={handleLogout}
              >
                <p className="text-black font-medium">Logout</p>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default Navbar_Seller;
