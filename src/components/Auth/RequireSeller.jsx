import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

const RequireSeller = () => {
  const { authUser, loading } = useAuth();

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#ecf0f1]">
        <Loader2 className="h-16 w-16 animate-spin text-gray-600" />
      </div>
    );

  if (!authUser) return <Navigate to="/login" replace />;

  if (authUser.userType !== "Seller") return <Navigate to="/" replace />;

  return <Outlet />;
};

export default RequireSeller;
