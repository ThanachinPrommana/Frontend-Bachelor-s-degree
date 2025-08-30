import Logo from "./Logo";
import { useNavigate } from "react-router";
import Noti from "./Noti";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Profile_Buyer from "./Profile_Buyer";
import Support_Buyer from "./Support_Buyer";
import { AlignJustify, UserPen, HeartPlus, Gem } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/api/authconfig";
const Navbar_Buyer = () => {
  const { authUser, setAuthUser } = useAuth()
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await apiClient.post("logout")
      setAuthUser(null)
      navigate("/login")
    } catch (err) {
      console.err("Logout failed:", err)
    }
  };

  return (
    <nav className="py-4 px-5 shadow-md border-b border-gray-200 bg-[#2c3e50] text-white">
      <div className="flex flex-col sm:flex-row sm:justify-between items-center ml-70 mr-70">
        <Logo />
        <div className="flex space-x-10 py-2 cursor-pointer">
          {/* <div className="flex bg-white hover:bg-gray-50 rounded space-x-2 w-[150px] h-full">
            <Gem className="text-black "/>
            <p className="text-gray-500 hover:text-black opacity-100">Register Seller</p>
          </div> */}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <AlignJustify className="cursor-pointer hover:text-blue-300" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {authUser ? `${authUser.First_name} ${authUser.Last_name}` : "Guest"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={() => {
                navigate("/buyer/profile")
              }}>
                <div className="flex space-x-2 justify-center items-center">
                  <UserPen />
                  <p className="text-gray-500 hover:text-black opacity-100">Profile</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Noti />
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => {
                navigate("/buyer/register/seller")
              }}>
                <Gem />
                <p className="text-gray-500 hover:text-black opacity-100">Register Seller</p>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => {
                navigate("/buyer/support")
              }}>
                <div
                  className="flex justify-center items-center space-x-2"
                >
                  <HeartPlus />
                  <p className="text-gray-500 hover:text-black opacity-100">Support / Contact</p>
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

export default Navbar_Buyer;
