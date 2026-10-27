import { useEffect, useState } from "react";
import { AdminContext } from "./admin.context.value.js";
import { getme, login, logout } from "./services/admin.service.js";

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

    const handleLogout = async () => {
        setLoading(true);

        try {
            const response = await logout();
            setAdmin(null);
            return response;
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminContext.Provider value={{ admin, loading, handleLogin, handleLogout }}>
            {children}
        </AdminContext.Provider>
    );
};
