import { createContext, useEffect, useState } from "react";
import { getme } from "./services/auth.service.js";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const restoreSession = async () => {
            try {
                const response = await getme();
                setUser(response.user);
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        restoreSession();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                setLoading,
                setUser,
                user,
                loading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const AuthContextProvider = AuthContext;

