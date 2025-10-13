import { Link } from "react-router";
import Logo from "./Logo";
import Profile from "./Profile";
import Noti from "./Noti";
import Support from "./Support";
import Home from "./Home";

const Navbarforbuyer = () => {
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
          <h1>
            <Home />
          </h1>
          <h1>
            <Profile />
          </h1>
          <h1>
            <Noti />
          </h1>
          <h1>
            <Support />
          </h1>
        </div>
      </div>
    </nav>
  );
};
export default Navbarforbuyer;
