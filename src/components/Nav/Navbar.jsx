import Logo from "./Logo";
import Support from "./Support";
import { Link } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlignJustify } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="py-4 px-5 shadow-md border-b border-gray-200 bg-[#2c3e50] text-white">
      <div className="flex justify-center sm:justify-end mr-70">
        <Link to="Login" className="flex">
          <h1>Login</h1>
          <h1 className="flex px-2">/</h1>
          <h1>Register</h1>
        </Link>
      </div>
      <div className="flex flex-col sm:flex-row sm:justify-between items-center ml-70 mr-70">
        <Logo />
        <div className="flex space-x-30 py-2">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <AlignJustify className="cursor-pointer hover:text-blue-300" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Name</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <Support />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
