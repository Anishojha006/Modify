import { createContext, useContext, useEffect, useState } from "react";
import { getme, login } from "./services/admin.service.js";

const AdminContext = createContext(null);

export const AdminProvider = ({ children }) => {
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const restoreAdminSession = async () => {
            try {
                const response = await getme();
                setAdmin(response.admin);
            } catch {
                setAdmin(null);
            } finally {
                setLoading(false);
            }
        };

        restoreAdminSession();
    }, []);

    const handleLogin = async (credentials) => {
        setLoading(true);

        try {
            const response = await login(credentials);
            setAdmin(response.admin);
            return response;
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminContext.Provider value={{ admin, loading, handleLogin }}>
            {children}
        </AdminContext.Provider>
    );
};

export const useAdmin = () => {
    const context = useContext(AdminContext);

    if (!context) {
        throw new Error("useAdmin must be used inside AdminProvider");
    }

    return context;
};
