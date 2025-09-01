import { createContext, useContext, useState, useEffect } from "react";
import { apiClient } from "@/api/authconfig";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [authUser, setAuthUser] = useState(null);
    const [loading, setLoading] = useState(true);


    const revalidateUser = async () => {
        try {
            const res = await apiClient.get("/profiles/user");
            const userData = res.data.user;
            console.log("revalidateUser result:", userData);
            setAuthUser({ ...userData });
        } catch (err) {
            setAuthUser(null);
        }
    };

    useEffect(() => {
        const checkInitialStatus = async () => {
            await revalidateUser();
            setLoading(false);
        };
        checkInitialStatus();
    }, []);

    const logout = async () => {
        try {
            await apiClient.post("/logout");
            setAuthUser(null);
        } catch (err) {
            console.error("Logout failed:", err);
            setAuthUser(null);
        }
    };


    const value = { authUser, loading, logout, revalidateUser };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);